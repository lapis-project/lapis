import * as fs from "node:fs";
import { Readable } from "node:stream";

import { log } from "@acdh-oeaw/lib";
import { Hono, type Context } from "hono";

import type { AppEnv } from "@/lib/context.ts";
import {
	resolveAudioFileForInstanceId,
	resolveWaveformFileForInstanceId,
} from "@/service/audioService.ts";

const audio = new Hono<AppEnv>();

function parseInstanceId(value: string): number | null {
	if (!/^\d+$/.test(value)) return null;
	const instanceId = Number(value);
	return Number.isSafeInteger(instanceId) ? instanceId : null;
}

// Helper function to generate ETag from file stats
function generateETag(stat: fs.Stats): string {
	// Combine mtime timestamp and file size for a stable ETag
	return `"${stat.mtime.getTime().toString(16)}-${stat.size.toString(16)}"`;
}

function matchesIfNoneMatch(headerValue: string | undefined, etag: string): boolean {
	if (!headerValue) return false;
	return headerValue.split(",").some((value) => {
		const trimmed = value.trim();
		return trimmed === "*" || trimmed === etag || trimmed === `W/${etag}`;
	});
}

function isNotModifiedSince(
	ifNoneMatch: string | undefined,
	ifModifiedSince: string | undefined,
	stat: fs.Stats,
): boolean {
	if (ifNoneMatch != null) return false;
	const modifiedSince = ifModifiedSince == null ? Number.NaN : Date.parse(ifModifiedSince);
	return (
		Number.isFinite(modifiedSince) &&
		Math.floor(stat.mtimeMs / 1000) <= Math.floor(modifiedSince / 1000)
	);
}

function matchesIfRange(ifRange: string | undefined, etag: string, stat: fs.Stats): boolean {
	if (!ifRange) return true;
	const trimmed = ifRange.trim();
	if (trimmed === etag) return true;
	if (trimmed.startsWith('"') || trimmed.startsWith("W/")) return false;

	const rangeDate = Date.parse(trimmed);
	return (
		Number.isFinite(rangeDate) && Math.floor(stat.mtimeMs / 1000) <= Math.floor(rangeDate / 1000)
	);
}

function streamAudioFile(
	c: Context<AppEnv>,
	filePath: string,
	options?: { end?: number; start?: number },
) {
	const fileNodeStream = fs.createReadStream(filePath, options);
	const reader = (
		Readable.toWeb(fileNodeStream) as unknown as ReadableStream<Uint8Array>
	).getReader();
	let cancelled = false;

	return c.body(
		new ReadableStream<Uint8Array>({
			async pull(controller) {
				try {
					const { done, value } = await reader.read();
					if (cancelled) return;
					if (done) controller.close();
					else controller.enqueue(value);
				} catch (error) {
					if (cancelled) return;
					log.error(`Failed to stream audio file: ${filePath}`, error);
					controller.error(error);
				}
			},
			cancel(reason) {
				// Seeking and metadata probes regularly cancel requests. The Node adapter destroys
				// the file stream on cancellation, closing its underlying descriptor.
				cancelled = true;
				return reader.cancel(reason);
			},
		}),
	);
}

// Shared logic for streaming audio files
async function handleAudioStream(c: Context<AppEnv>, isHeadRequest = false) {
	const instanceId = c.req.param("instanceId") ?? "";
	const parsedInstanceId = parseInstanceId(instanceId);

	if (parsedInstanceId == null) {
		log.warn(`Invalid instance ID attempted: ${instanceId}`);
		return c.json({ error: "Invalid instance ID" }, 400);
	}

	const audioFile = await resolveAudioFileForInstanceId(parsedInstanceId);
	if (!audioFile) {
		log.info(`Audio file not found for instance ID: ${instanceId}`);
		return c.json({ error: "Audio file not found" }, 404);
	}

	const { mimeType, path: audioPath, stat } = audioFile;
	const etag = generateETag(stat);
	const range = c.req.header("range");

	// Set common headers for caching and metadata
	c.header("Content-Type", mimeType);
	c.header("Accept-Ranges", "bytes");
	c.header("Cache-Control", "public, max-age=31536000");
	c.header("Last-Modified", stat.mtime.toUTCString());
	c.header("ETag", etag);

	const ifNoneMatch = c.req.header("if-none-match");
	const ifModifiedSince = c.req.header("if-modified-since");

	// Cache preconditions take precedence over Range, including for byte-range probes.
	if (
		matchesIfNoneMatch(ifNoneMatch, etag) ||
		isNotModifiedSince(ifNoneMatch, ifModifiedSince, stat)
	) {
		c.status(304);
		return c.body(null);
	}

	const ifRange = c.req.header("if-range");
	// Multiple ranges are unsupported; ignore them and serve the full representation.
	if (range && !range.includes(",") && matchesIfRange(ifRange, etag, stat)) {
		// Parse a single "bytes=start-end" range.
		const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
		if (!m || (!m[1] && !m[2])) {
			return c.text("Invalid Range header", 400);
		}

		const size = stat.size;
		let start: number;
		let end: number;

		// Handle suffix-byte-range-spec: "bytes=-N" means last N bytes
		if (!m[1] && m[2]) {
			const suffixLength = Number.parseInt(m[2], 10);
			if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
				c.header("Content-Range", `bytes */${String(size)}`);
				return c.text("Requested Range Not Satisfiable", 416);
			}
			start = Math.max(0, size - suffixLength);
			end = size - 1;
		} else {
			// Standard range: "bytes=start-end" or "bytes=start-"
			start = m[1] ? Number.parseInt(m[1], 10) : 0;
			end = m[2] ? Number.parseInt(m[2], 10) : size - 1;

			// Normalize / validate
			if (!Number.isSafeInteger(start)) {
				c.header("Content-Range", `bytes */${String(size)}`);
				return c.text("Requested Range Not Satisfiable", 416);
			}
			if (!Number.isSafeInteger(end) || end >= size) {
				end = size - 1;
			}
		}

		if (start > end || start < 0) {
			c.status(416);
			c.header("Content-Range", `bytes */${String(size)}`);
			return c.text("Requested Range Not Satisfiable", 416);
		}

		const chunkSize = end - start + 1;

		c.status(206);
		c.header("Content-Range", `bytes ${String(start)}-${String(end)}/${String(size)}`);
		c.header("Content-Length", String(chunkSize));

		// For HEAD requests, don't stream the body
		if (isHeadRequest) {
			return c.body(null);
		}

		return streamAudioFile(c, audioPath, { start, end });
	}

	// Return the full file when Range is absent, ignored, or its If-Range validator differs.
	c.status(200);
	c.header("Content-Length", String(stat.size));

	// For HEAD requests, don't stream the body
	if (isHeadRequest) {
		return c.body(null);
	}

	return streamAudioFile(c, audioPath);
}

audio.on(["GET", "HEAD"], "/stream/:instanceId", async (c) => {
	return handleAudioStream(c, c.req.method === "HEAD");
});

audio.get("/waveform/:instanceId", async (c) => {
	const instanceId = c.req.param("instanceId");
	const parsedInstanceId = parseInstanceId(instanceId);
	if (parsedInstanceId == null) {
		log.warn(`Invalid waveform instance ID attempted: ${instanceId}`);
		return c.json({ error: "Invalid instance ID" }, 400);
	}

	const waveformFile = await resolveWaveformFileForInstanceId(parsedInstanceId);
	if (!waveformFile) return c.json({ error: "Waveform not found" }, 404);

	const etag = generateETag(waveformFile.stat);
	c.header("Content-Type", "application/json; charset=UTF-8");
	c.header("Content-Length", String(waveformFile.stat.size));
	c.header("Cache-Control", "public, max-age=0, must-revalidate");
	c.header("Last-Modified", waveformFile.stat.mtime.toUTCString());
	c.header("ETag", etag);

	const ifNoneMatch = c.req.header("if-none-match");
	const ifModifiedSince = c.req.header("if-modified-since");

	if (
		matchesIfNoneMatch(ifNoneMatch, etag) ||
		isNotModifiedSince(ifNoneMatch, ifModifiedSince, waveformFile.stat)
	) {
		c.status(304);
		return c.body(null);
	}

	return c.body(await fs.promises.readFile(waveformFile.path));
});

export default audio;

export type StreamType = typeof audio;
