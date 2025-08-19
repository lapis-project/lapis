/* eslint-disable n/no-unsupported-features/node-builtins */

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { Readable } from "node:stream";

import { log } from "@acdh-oeaw/lib";
import { Hono } from "hono";
import { stream } from "hono/streaming";

import type { Context } from "@/lib/context";

const mimeTypes: Record<string, string> = {
	".mp3": "audio/mpeg",
	".ogg": "audio/ogg",
	".wav": "audio/wav",
};

const parseIso8601OrClockToSeconds = (raw: string): number | null => {
	const s = raw.trim();

	// ISO-8601 duration e.g. PT1H2M3.45S, PT90S, PT3M
	const iso = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i;
	const m = iso.exec(s);
	if (m) {
		const days = parseInt(m[1] ?? "0", 10);
		const hours = parseInt(m[2] ?? "0", 10);
		const mins = parseInt(m[3] ?? "0", 10);
		const secs = parseFloat(m[4] ?? "0");
		return days * 86400 + hours * 3600 + mins * 60 + secs;
	}

	// Clock formats: HH:MM:SS(.sss) | MM:SS(.sss) | SS(.sss)
	const parts = s.split(":").map(Number);
	if (parts.every((n) => !Number.isNaN(n))) {
		if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
			return parts[0] * 3600 + parts[1] * 60 + parts[2];
		}
		if (parts.length === 2 && parts[0] && parts[1]) {
			return parts[0] * 60 + parts[1];
		}
		if (parts.length === 1) {
			return parts[0];
		}
	}

	// Plain seconds with fraction
	const asNum = Number(s);
	if (!Number.isNaN(asNum)) {
		return asNum;
	}

	return null;
};

// WAV helper: find byteRate and data chunk offset/size
async function getWavLayout(filePath: string): Promise<{
	byteRate: number;
	dataOffset: number;
	dataSize: number;
}> {
	const fh = await fs.promises.open(filePath, "r");
	try {
		const header = Buffer.alloc(12);
		await fh.read(header, 0, 12, 0);
		if (header.toString("ascii", 0, 4) !== "RIFF" || header.toString("ascii", 8, 12) !== "WAVE") {
			throw new Error("Not a WAVE file");
		}
		let offset = 12;
		let byteRate = 0;
		let dataOffset = -1;
		let dataSize = 0;

		const chunkHdr = Buffer.alloc(8);
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		while (true) {
			const { bytesRead } = await fh.read(chunkHdr, 0, 8, offset);
			if (bytesRead < 8) {
				break;
			}

			const id = chunkHdr.toString("ascii", 0, 4);
			const size = chunkHdr.readUInt32LE(4);
			const next = offset + 8 + size + (size % 2); // chunks are word-aligned

			if (id === "fmt ") {
				const fmt = Buffer.alloc(size);
				await fh.read(fmt, 0, size, offset + 8);
				byteRate = fmt.readUInt32LE(8); // sr * channels * bits/8
			} else if (id === "data") {
				dataOffset = offset + 8;
				dataSize = size;
				break;
			}
			offset = next;
		}

		if (!byteRate || dataOffset < 0) {
			throw new Error("Missing fmt/data chunks");
		}
		return { byteRate, dataOffset, dataSize };
	} finally {
		await fh.close();
	}
}

const streamHandler = new Hono<Context>().get("/audio/:filename", async (c) => {
	const filename = c.req.param("filename");
	const t = c.req.query("t"); // e.g. PT1M30S
	const persistentDir = path.join(process.cwd(), "persistent");
	const filePath = path.join(persistentDir, filename);

	// Security: Prevent path traversal attacks
	// Useage of well crafted filename to access hidden files on the server
	if (!filePath.startsWith(persistentDir)) {
		log.warn(`Potential path traversal attempt: ${filename}`);
		return c.json({ error: "Invalid filename" }, 400);
	}

	// Check if the file exists at all
	// Use async file methods to prevent the blocking of node.js event loop
	try {
		await fs.promises.access(filePath);
	} catch {
		log.info(`File not found: ${filename}`);
		return c.json({ error: "File not found" }, 404);
	}

	const fileExtension = path.extname(filename).toLowerCase();
	const contentType = mimeTypes[fileExtension] ?? "application/octet-stream";

	// Same as above to prevent blocking of nodejs event loop
	const stat = await fs.promises.stat(filePath);
	const range = c.req.header("range");

	if (t) {
		const seconds = parseIso8601OrClockToSeconds(t);
		if (seconds === null || seconds < 0) {
			return c.text("Invalid time format. Use ISO-8601 duration like PT1M30S, or 01:30.", 400);
		}

		c.header("Content-Type", contentType);
		c.header("Accept-Ranges", "bytes");

		if (fileExtension === ".wav") {
			// Byte-accurate for PCM WAV
			try {
				const { byteRate, dataOffset, dataSize } = await getWavLayout(filePath);
				const startInData = Math.min(
					Math.max(0, Math.floor(seconds * byteRate)),
					Math.max(0, dataSize - 1),
				);
				const start = dataOffset + startInData;
				const end = dataOffset + dataSize - 1;
				const chunksize = end - start + 1;

				c.status(206);
				c.header(
					"Content-Range",
					`bytes ${start.toString()}-${end.toString()}/${stat.size.toString()}`,
				);
				c.header("Content-Length", String(chunksize));

				const fileNodeStream = fs.createReadStream(filePath, { start, end });
				return stream(c, async (s) => {
					await s.pipe(Readable.toWeb(fileNodeStream) as unknown as ReadableStream);
				});
			} catch (err) {
				log.warn(`WAV fast-seek failed for ${filename}: ${(err as Error).message}`);
				// Fall through to ffmpeg-based seek
			}
		}

		// Generic (handles MP3/OGG/VBR, etc.) — requires ffmpeg in PATH
		try {
			const format =
				fileExtension === ".mp3"
					? "mp3"
					: fileExtension === ".ogg"
						? "ogg"
						: fileExtension === ".wav"
							? "wav"
							: "mp3";

			// Use -ss before -i for fast seek; -c copy to avoid re-encoding
			const ff = spawn("ffmpeg", [
				"-hide_banner",
				"-loglevel",
				"error",
				"-ss",
				seconds.toString(),
				"-i",
				filePath,
				"-vn",
				"-c",
				"copy",
				"-f",
				format,
				"pipe:1",
			]);

			ff.on("error", (e) => {
				log.error(`ffmpeg spawn error: ${e.message}`);
			});

			c.status(200);
			// No Content-Length when piping; chunked transfer

			return stream(c, async (stream) => {
				stream.onAbort(() => {
					ff.kill("SIGKILL");
				});
				await stream.pipe(Readable.toWeb(ff.stdout) as ReadableStream);
			});
		} catch {
			return c.text("Server cannot seek: ffmpeg not available.", 501);
		}
	}

	// --- Normal Range/Full-file handling (unchanged) ---
	c.header("Content-Type", contentType);
	c.header("Accept-Ranges", "bytes");

	if (range) {
		c.status(206);
		const parts = range.replace(/bytes=/, "").split("-");
		const startString = parts[0];
		if (startString === undefined) {
			return c.text("Invalid Range header", 400);
		}

		const start = parseInt(startString, 10);
		const endString = parts[1];
		const end = endString ? parseInt(endString, 10) : stat.size - 1;
		const chunksize = end - start + 1;

		c.header("Content-Range", `bytes ${String(start)}-${String(end)}/${String(stat.size)}`);
		c.header("Content-Length", chunksize.toString());

		const fileNodeStream = fs.createReadStream(filePath, { start, end });
		return stream(c, async (stream) => {
			await stream.pipe(Readable.toWeb(fileNodeStream) as ReadableStream);
		});
	} else {
		c.status(206); // keep partial semantics for players
		c.header("Content-Length", stat.size.toString());
		const fileNodeStream = fs.createReadStream(filePath);
		return stream(c, async (stream) => {
			await stream.pipe(Readable.toWeb(fileNodeStream) as ReadableStream);
		});
	}
});

export default streamHandler;

export type StreamType = typeof streamHandler;
