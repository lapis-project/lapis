import * as fs from "node:fs";
import { Readable } from "node:stream";

import { log } from "@acdh-oeaw/lib";
import { Hono, type Context } from "hono";
import { stream } from "hono/streaming";

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

function streamAudioFile(
	c: Context<AppEnv>,
	filePath: string,
	options?: { end?: number; start?: number },
) {
	const fileNodeStream = fs.createReadStream(filePath, options);

	return stream(c, async (responseStream) => {
		// Browsers regularly cancel in-flight requests when seeking. Closing the underlying
		// descriptor prevents the server from continuing to read a large audio file.
		responseStream.onAbort(() => {
			fileNodeStream.destroy();
		});
		await responseStream.pipe(Readable.toWeb(fileNodeStream) as unknown as ReadableStream);
	});
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

	// Handle conditional requests (If-None-Match)
	const ifNoneMatch = c.req.header("if-none-match");
	if (ifNoneMatch === etag) {
		c.status(304);
		return c.body(null);
	}

	if (range) {
		// Parse "bytes=start-end"
		const m = /^bytes=(\d*)-(\d*)$/.exec(range);
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

	// Full file (no Range): return 200 and the whole file
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
	const matchesETag = ifNoneMatch?.split(",").some((value) => value.trim() === etag) ?? false;
	const modifiedSince = ifModifiedSince == null ? Number.NaN : Date.parse(ifModifiedSince);
	const notModifiedSince =
		ifNoneMatch == null &&
		Number.isFinite(modifiedSince) &&
		Math.floor(waveformFile.stat.mtimeMs / 1000) <= Math.floor(modifiedSince / 1000);

	if (matchesETag || notModifiedSince) {
		c.status(304);
		return c.body(null);
	}

	return c.body(await fs.promises.readFile(waveformFile.path));
});

export default audio;

export type StreamType = typeof audio;
