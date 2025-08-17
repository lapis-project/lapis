/* eslint-disable n/no-unsupported-features/node-builtins */

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

const streamHandler = new Hono<Context>().get("/audio/:filename", async (c) => {
	const filename = c.req.param("filename");
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

	c.header("Content-Type", contentType);
	c.header("Accept-Ranges", "bytes");
	c.status(206);

	if (range) {
		const parts = range.replace(/bytes=/, "").split("-");
		const startString = parts[0];

		if (startString === undefined) {
			// Handle the case where the range header is malformed
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
		c.header("Content-Length", stat.size.toString());
		const fileNodeStream = fs.createReadStream(filePath);
		return stream(c, async (stream) => {
			await stream.pipe(Readable.toWeb(fileNodeStream) as ReadableStream);
		});
	}
});

export default streamHandler;

export type StreamType = typeof streamHandler;
