import * as fs from "node:fs";
import * as path from "node:path";
import { Readable } from "node:stream";

import { log } from "@acdh-oeaw/lib";
import { Hono } from "hono";
import { stream } from "hono/streaming";

import type { Context } from "@/lib/context";

const audio = new Hono<Context>().get("/stream/:filename", async (c) => {
	console.log("hello from backend");
	const filename = c.req.param("filename");
	const persistentDir = path.join(process.cwd(), "persistent");
	const base = path.basename(filename, path.extname(filename)); // sanitize and strip any ext
	const oggPath = path.resolve(persistentDir, `${base}.ogg`);

	// Prevent path traversal: ensure resolved path stays under persistentDir
	const rootWithSep = persistentDir.endsWith(path.sep) ? persistentDir : persistentDir + path.sep;
	if (!oggPath.startsWith(rootWithSep)) {
		log.warn(`Potential path traversal attempt: ${filename}`);
		return c.json({ error: "Invalid filename" }, 400);
	}

	try {
		await fs.promises.access(oggPath, fs.constants.R_OK);
	} catch {
		log.info(`File not found: ${base}.ogg`);
		return c.json({ error: "File not found" }, 404);
	}

	const stat = await fs.promises.stat(oggPath);
	const range = c.req.header("range");

	c.header("Content-Type", "audio/ogg");
	c.header("Accept-Ranges", "bytes");

	if (range) {
		// Parse "bytes=start-end"
		console.log(range);
		const m = /^bytes=(\d*)-(\d*)$/.exec(range);
		if (!m) {
			return c.text("Invalid Range header", 400);
		}

		const size = stat.size;
		let start = m[1] ? Number.parseInt(m[1], 10) : 0;
		let end = m[2] ? Number.parseInt(m[2], 10) : size - 1;

		// Normalize / validate
		if (Number.isNaN(start)) {
			start = 0;
		}
		if (Number.isNaN(end) || end >= size) {
			end = size - 1;
		}

		if (start > end || start < 0) {
			c.status(416);
			c.header("Content-Range", `bytes */${size}`);
			return c.text("Requested Range Not Satisfiable", 416);
		}

		const chunkSize = end - start + 1;

		c.status(206);
		c.header("Content-Range", `bytes ${start}-${end}/${size}`);
		c.header("Content-Length", String(chunkSize));

		const fileNodeStream = fs.createReadStream(oggPath, { start, end });
		return stream(c, async (s) => {
			await s.pipe(Readable.toWeb(fileNodeStream) as unknown as ReadableStream);
		});
	}

	// Full file (no Range): return 200 and the whole file
	c.status(200);
	c.header("Content-Length", String(stat.size));

	const fileNodeStream = fs.createReadStream(oggPath);
	return stream(c, async (s) => {
		await s.pipe(Readable.toWeb(fileNodeStream) as unknown as ReadableStream);
	});
});

export default audio;

export type StreamType = typeof audio;
