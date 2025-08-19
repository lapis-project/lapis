/* eslint-disable n/no-unsupported-features/node-builtins */

import * as fs from "node:fs";
import * as path from "node:path";
import { Readable } from "node:stream";

import { log } from "@acdh-oeaw/lib";
import { Hono } from "hono";
import { stream } from "hono/streaming";

import type { Context } from "@/lib/context";

const audio = new Hono<Context>().get("/audio/:filename", async (c) => {
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

	const temp = `${filePath}.ogg`;

	try {
		await fs.promises.access(temp);
	} catch {
		log.info(`File not found: ${filename}`);
		return c.json({ error: "File not found" }, 404);
	}

	const contentType = "audio/ogg";

	// Same as above to prevent blocking of nodejs event loop
	const stat = await fs.promises.stat(temp);
	const range = c.req.header("range");

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

		const fileNodeStream = fs.createReadStream(temp, { start, end });
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

export default audio;

export type StreamType = typeof audio;
