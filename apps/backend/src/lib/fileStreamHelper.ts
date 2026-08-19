import { createHash } from "node:crypto";
import { createReadStream, type Stats, statSync } from "node:fs";
import { createGzip } from "node:zlib";

import type { Context } from "hono";
import { stream } from "hono/streaming";

/** Options for file streaming */
export interface StreamFileOptions {
	/** The absolute file path to stream */
	filePath: string;

	/** Content-Type header value */
	contentType: string;

	/** Enable gzip compression (default: true for files > 1MB) */
	enableCompression?: boolean;

	/** Enable caching headers with ETag (default: true) */
	enableCaching?: boolean;

	/** Custom chunk size in bytes (default: 256KB for large files) */
	chunkSize?: number;

	/** Optional callback for progress tracking */
	onProgress?: (bytesRead: number, totalBytes: number) => void;
}

/** Options for streaming JSON with additional data prepended/appended */
export interface StreamJsonWithMetadataOptions {
	/** The absolute file path to the JSON file */
	filePath: string;

	/** Data to prepend before the file content (will be JSON stringified) */
	prefix?: Record<string, unknown>;

	/** Data to append after the file content (will be JSON stringified) */
	suffix?: Record<string, unknown>;

	/** Key name for the file content in the resulting JSON (default: "data") */
	contentKey?: string;

	/** Enable gzip compression (default: true) */
	enableCompression?: boolean;

	/** Enable caching headers with ETag (default: true) */
	enableCaching?: boolean;
}

/**
 * Validates that a file path is safe and exists
 *
 * @param filePath - The file path to validate
 * @param maxSizeBytes - Maximum allowed file size in bytes (default: 10MB)
 * @returns Object with validation result and file stats
 */
export function validateFile(
	filePath: string,
	maxSizeBytes = 10 * 1024 * 1024,
): { valid: true; stats: Stats } | { valid: false; error: string; stats?: never } {
	try {
		const stats = statSync(filePath);

		if (!stats.isFile()) {
			return { valid: false, error: "Path is not a file" };
		}

		if (stats.size > maxSizeBytes) {
			return {
				valid: false,
				error: `File too large: ${String(stats.size)} bytes (max: ${String(maxSizeBytes)})`,
			};
		}

		return { valid: true, stats };
	} catch {
		return { valid: false, error: "File not found or inaccessible" };
	}
}

/**
 * Generates an ETag for a file based on its modification time and size This is faster than hashing
 * the entire file content
 */
export function generateETag(stats: Stats): string {
	const hash = createHash("md5");
	const mtime = stats.mtime.getTime();
	const size = stats.size;
	hash.update(`${String(mtime)}-${String(size)}`);
	return `"${hash.digest("hex")}"`;
}

/** Checks if the client's cached version is still valid */
export function checkCacheHeaders(c: Context, etag: string): boolean {
	const ifNoneMatch = c.req.header("If-None-Match");
	return ifNoneMatch === etag;
}

/** Determines if compression should be used based on file size and client support */
export function shouldCompress(c: Context, fileSize: number, enableCompression?: boolean): boolean {
	if (enableCompression === false) {
		return false;
	}

	// Only compress files larger than 1KB
	if (fileSize < 1024) {
		return false;
	}

	// Check if client accepts gzip
	const acceptEncoding = c.req.header("Accept-Encoding") ?? "";
	return acceptEncoding.includes("gzip");
}

/**
 * Streams a file to the client with optimizations: - Content-Length header for progress tracking -
 * ETag/Last-Modified for caching - Gzip compression for large files - Proper error handling with
 * HTTP status codes - Optimized chunk size for 4-5MB files
 *
 * @example
 * 	```typescript
 * 	return streamFile(c, {
 * 		filePath: "/path/to/file.json",
 * 		contentType: "application/json",
 * 	});
 * 	```;
 */
export function streamFile(c: Context, options: StreamFileOptions) {
	const {
		filePath,
		contentType,
		enableCompression,
		enableCaching = true,
		chunkSize = 256 * 1024, // 256KB default for large files
		onProgress,
	} = options;

	// Validate file
	const validation = validateFile(filePath);
	if (!validation.valid) {
		return c.json({ error: validation.error }, 404);
	}

	const stats = validation.stats;

	// Generate ETag for caching
	const etag = enableCaching ? generateETag(stats) : "";

	// Check if client has valid cache
	if (enableCaching && checkCacheHeaders(c, etag)) {
		return c.body(null, 304); // Not Modified
	}

	// Determine compression
	const useCompression = shouldCompress(c, stats.size, enableCompression);

	// Set headers
	c.header("Content-Type", contentType);

	if (enableCaching) {
		c.header("ETag", etag);
		c.header("Last-Modified", stats.mtime.toUTCString());
		c.header("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
	}

	if (useCompression) {
		c.header("Content-Encoding", "gzip");
		// Don't set Content-Length when compressing (size changes)
	} else {
		c.header("Content-Length", stats.size.toString());
	}

	// Stream the file
	return stream(c, async (stream) => {
		let bytesRead = 0;

		try {
			const fileStream = createReadStream(filePath, {
				highWaterMark: chunkSize,
			});

			// Apply compression if needed
			const outputStream = useCompression ? fileStream.pipe(createGzip()) : fileStream;

			for await (const chunk of outputStream) {
				await stream.write(chunk as Uint8Array);

				if (onProgress && !useCompression) {
					bytesRead += (chunk as Buffer).length;
					onProgress(bytesRead, stats.size);
				}
			}
		} catch (error) {
			console.error("File streaming error:", error);
			// Stream is already started, can't change status code
			// But at least we log the error
			throw error;
		}
	});
}

/**
 * Streams a JSON file with additional metadata prepended/appended Useful for stitching together
 * metadata + large JSON data without loading everything into memory
 *
 * @example
 * 	```typescript
 * 	return streamJsonWithMetadata(c, {
 * 		filePath: "/path/to/data.json",
 * 		prefix: { metadata: { id: 123, name: "Test" } },
 * 		contentKey: "transcript_data",
 * 	});
 * 	// Output: {"metadata":{"id":123,"name":"Test"},"transcript_data":<file contents>}
 * 	```;
 */
export function streamJsonWithMetadata(c: Context, options: StreamJsonWithMetadataOptions) {
	const {
		filePath,
		prefix,
		suffix,
		contentKey = "data",
		enableCompression,
		enableCaching = true,
	} = options;

	// Validate file
	const validation = validateFile(filePath);
	if (!validation.valid) {
		return c.json({ error: validation.error }, 404);
	}

	const stats = validation.stats;

	// Generate ETag (based on file + prefix/suffix)
	const etag = enableCaching
		? `"${createHash("md5")
				.update(
					`${String(stats.mtime.getTime())}-${String(stats.size)}-${JSON.stringify(prefix)}-${JSON.stringify(suffix)}`,
				)
				.digest("hex")}"`
		: "";

	// Check cache
	if (enableCaching && checkCacheHeaders(c, etag)) {
		return c.body(null, 304);
	}

	// Determine compression
	const useCompression = shouldCompress(c, stats.size, enableCompression);

	// Set headers
	c.header("Content-Type", "application/json");

	if (enableCaching) {
		c.header("ETag", etag);
		c.header("Last-Modified", stats.mtime.toUTCString());
		c.header("Cache-Control", "public, max-age=3600");
	}

	if (useCompression) {
		c.header("Content-Encoding", "gzip");
	}

	// Stream the stitched JSON
	return stream(c, async (stream) => {
		try {
			// Start JSON object
			let jsonPrefix = "{";

			// Add prefix fields
			if (prefix) {
				const prefixEntries = Object.entries(prefix);
				for (const entry of prefixEntries) {
					const [key, value] = entry;
					jsonPrefix += `"${key}":${JSON.stringify(value)},`;
				}
			}

			// Add content key
			jsonPrefix += `"${contentKey}":`;

			// Optionally compress the output
			if (useCompression) {
				const gzip = createGzip();
				const gzipPromise = new Promise<void>((resolve, reject) => {
					gzip.on("data", (chunk: Buffer) => {
						void stream.write(chunk);
					});
					gzip.on("end", resolve);
					gzip.on("error", reject);
				});

				// Write prefix
				gzip.write(jsonPrefix);

				// Stream file content
				const fileStream = createReadStream(filePath, {
					highWaterMark: 256 * 1024,
				});

				for await (const chunk of fileStream) {
					gzip.write(chunk);
				}

				// Add suffix fields if any
				if (suffix && Object.keys(suffix).length > 0) {
					let jsonSuffix = ",";
					const suffixEntries = Object.entries(suffix);
					suffixEntries.forEach(([key, value], index) => {
						jsonSuffix += `"${key}":${JSON.stringify(value)}`;
						if (index < suffixEntries.length - 1) {
							jsonSuffix += ",";
						}
					});
					gzip.write(jsonSuffix);
				}

				// Close JSON object
				gzip.end("}");

				await gzipPromise;
			} else {
				// No compression - direct streaming
				await stream.write(jsonPrefix);

				// Stream file content
				const fileStream = createReadStream(filePath, {
					highWaterMark: 256 * 1024,
				});

				for await (const chunk of fileStream) {
					await stream.write(chunk as Uint8Array);
				}

				// Add suffix fields if any
				if (suffix && Object.keys(suffix).length > 0) {
					let jsonSuffix = ",";
					const suffixEntries = Object.entries(suffix);
					suffixEntries.forEach(([key, value], index) => {
						jsonSuffix += `"${key}":${JSON.stringify(value)}`;
						if (index < suffixEntries.length - 1) {
							jsonSuffix += ",";
						}
					});
					await stream.write(jsonSuffix);
				}
				// Close JSON object
				await stream.write("}");
			}
		} catch (error) {
			console.error("JSON streaming error:", error);
			throw error;
		}
	});
}

/** Validates and sanitizes a transcript ID Returns null if invalid */
export function validateTranscriptId(id: string): string | null {
	const safeId = id.replace(/[^\w-]/g, "");

	// Must be a positive integer
	if (!safeId || !/^\d+$/.test(safeId)) {
		return null;
	}

	return safeId;
}
