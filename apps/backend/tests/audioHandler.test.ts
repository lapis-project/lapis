import { mkdir, rm, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const TEST_AUDIO_DIR = "./test-audio-files";
const audioLocations = new Map<number, { audio_link: string; comment: string }>();
const getAudioLocationByInstanceId = vi.fn((instanceId: number) =>
	Promise.resolve(audioLocations.get(instanceId)),
);

// Set AUDIO_DIR and ALLOWED_ORIGINS before importing the handler
process.env.AUDIO_DIR = TEST_AUDIO_DIR;
process.env.ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:5173";

// Mock the config to use TEST_AUDIO_DIR
vi.mock("@/config/config.ts", async () => {
	const actual = await vi.importActual("@/config/config.ts");
	return {
		...actual,
		AUDIO_DIR: TEST_AUDIO_DIR,
	};
});

vi.mock("@/db/audioRepository.ts", () => ({ getAudioLocationByInstanceId }));

// Now import the audio handler after setting up mocks
const { default: audio } = await import("@/handler/audioHandler.ts");

// Helper function to create a test audio file
async function createTestAudioFile(
	instanceId: number,
	filename: string,
	extension: ".ogg" | ".mp3",
	size = 1024,
	folder = "interviews",
): Promise<void> {
	audioLocations.set(instanceId, { audio_link: folder, comment: filename });
	await mkdir(join(TEST_AUDIO_DIR, folder), { recursive: true });
	await writeFile(join(TEST_AUDIO_DIR, folder, `${filename}${extension}`), Buffer.alloc(size, "A"));
}

async function createTestWaveform(instanceId: number): Promise<string> {
	const location = audioLocations.get(instanceId)!;
	const audioPath = join(TEST_AUDIO_DIR, location.audio_link, `${location.comment}.ogg`);
	const waveformPath = `${audioPath}.waveform.json`;
	await writeFile(
		waveformPath,
		JSON.stringify({
			version: 1,
			duration: 12.5,
			channels: [
				[0.25, -0.75],
				[-0.5, 1],
			],
		}),
	);
	return waveformPath;
}

describe("Audio Handler", () => {
	beforeAll(async () => {
		// Create test directory and audio files
		await mkdir(TEST_AUDIO_DIR, { recursive: true });

		// The handler resolves the basename and folder from survey_conducted.
		await createTestAudioFile(161, "0029_NECK_jungI_m_INT_Vers2", ".ogg", 2048);
		await createTestAudioFile(162, "0030_NECK_alt_f_INT", ".mp3", 4096);
		await createTestAudioFile(163, "0031_ALLE_jungII_m_INT", ".ogg", 8192);
	});

	afterAll(async () => {
		// Clean up test files
		await rm(TEST_AUDIO_DIR, { recursive: true, force: true });
		audioLocations.clear();
		delete process.env.AUDIO_DIR;
		delete process.env.ALLOWED_ORIGINS;
	});

	describe("GET /stream/:filename", () => {
		it("should stream an .ogg audio file successfully", async () => {
			const response = await audio.request("/stream/161");

			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe("audio/ogg");
			expect(response.headers.get("Accept-Ranges")).toBe("bytes");
			expect(response.headers.get("Content-Length")).toBe("2048");
			expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000");
			expect(response.headers.get("Last-Modified")).toBeTruthy();
			expect((await response.arrayBuffer()).byteLength).toBe(2048);
		});

		it("should stream an .mp3 audio file successfully", async () => {
			const response = await audio.request("/stream/162");

			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toBe("audio/mpeg");
			expect(response.headers.get("Accept-Ranges")).toBe("bytes");
			expect(response.headers.get("Content-Length")).toBe("4096");
		});

		it("should return 404 when audio file does not exist", async () => {
			const response = await audio.request("/stream/999");

			expect(response.status).toBe(404);
			const body = await response.json();
			expect(body.error).toBe("Audio file not found");
		});

		it("should return 400 for an invalid instance ID (path traversal attempt)", async () => {
			const response = await audio.request("/stream/..%2Fetc%2Fpasswd");

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error).toBe("Invalid instance ID");
		});

		it("should return 400 for a non-numeric instance ID", async () => {
			const response = await audio.request("/stream/abc");

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error).toBe("Invalid instance ID");
		});

		it("should return 400 for transcript ID with special characters", async () => {
			const response = await audio.request("/stream/123;rm-rf");

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error).toBe("Invalid instance ID");
		});

		it("should not sanitize a malformed ID into a valid filename", async () => {
			const response = await audio.request("/stream/1.61");

			expect(response.status).toBe(400);
		});

		describe("Range Requests", () => {
			it("should handle range request for partial content", async () => {
				const response = await audio.request("/stream/163", {
					headers: {
						Range: "bytes=0-1023",
					},
				});

				expect(response.status).toBe(206); // Partial Content
				expect(response.headers.get("Content-Type")).toBe("audio/ogg");
				expect(response.headers.get("Content-Range")).toBe("bytes 0-1023/8192");
				expect(response.headers.get("Content-Length")).toBe("1024");
				expect((await response.arrayBuffer()).byteLength).toBe(1024);
			});

			it("should handle range request with only start byte", async () => {
				const response = await audio.request("/stream/163", {
					headers: {
						Range: "bytes=1024-",
					},
				});

				expect(response.status).toBe(206);
				expect(response.headers.get("Content-Range")).toBe("bytes 1024-8191/8192");
				expect(response.headers.get("Content-Length")).toBe("7168");
			});

			it("should handle range request with only end byte (suffix-range)", async () => {
				const response = await audio.request("/stream/163", {
					headers: {
						Range: "bytes=-1024",
					},
				});

				expect(response.status).toBe(206);
				expect(response.headers.get("Content-Range")).toBe("bytes 7168-8191/8192");
				expect(response.headers.get("Content-Length")).toBe("1024");
			});

			it("should return 416 for invalid range (start > end)", async () => {
				const response = await audio.request("/stream/163", {
					headers: {
						Range: "bytes=5000-1000",
					},
				});

				expect(response.status).toBe(416); // Range Not Satisfiable
				expect(response.headers.get("Content-Range")).toBe("bytes */8192");
			});

			it("should return 416 for out-of-bounds range", async () => {
				const response = await audio.request("/stream/163", {
					headers: {
						Range: "bytes=10000-20000",
					},
				});

				expect(response.status).toBe(416);
			});

			it("should return 400 for malformed range header", async () => {
				const response = await audio.request("/stream/163", {
					headers: {
						Range: "invalid-range-format",
					},
				});

				expect(response.status).toBe(400);
				const body = await response.text();
				expect(body).toBe("Invalid Range header");
			});

			it("should normalize range when end exceeds file size", async () => {
				const response = await audio.request("/stream/163", {
					headers: {
						Range: "bytes=0-99999",
					},
				});

				expect(response.status).toBe(206);
				expect(response.headers.get("Content-Range")).toBe("bytes 0-8191/8192");
				expect(response.headers.get("Content-Length")).toBe("8192");
			});

			it("should handle seeking to middle of file (typical audio player behavior)", async () => {
				const response = await audio.request("/stream/163", {
					headers: {
						Range: "bytes=4096-6143",
					},
				});

				expect(response.status).toBe(206);
				expect(response.headers.get("Content-Range")).toBe("bytes 4096-6143/8192");
				expect(response.headers.get("Content-Length")).toBe("2048");
			});

			it("should honour a valid open-ended range", async () => {
				const response = await audio.request("/stream/163", {
					headers: {
						Range: "bytes=0-",
					},
				});

				expect(response.status).toBe(206);
				expect(response.headers.get("Content-Range")).toBe("bytes 0-8191/8192");
				expect(response.headers.get("Content-Length")).toBe("8192");
			});
		});

		describe("HEAD /stream/:filename", () => {
			it("should return the same range metadata without a response body", async () => {
				const response = await audio.request("/stream/163", {
					method: "HEAD",
					headers: { Range: "bytes=1024-2047" },
				});

				expect(response.status).toBe(206);
				expect(response.headers.get("Content-Range")).toBe("bytes 1024-2047/8192");
				expect(response.headers.get("Content-Length")).toBe("1024");
				expect(await response.text()).toBe("");
			});
		});

		describe("File Format Detection", () => {
			it("should prefer .ogg over .mp3 when both exist", async () => {
				// Create both formats for the same database-resolved filename.
				await createTestAudioFile(164, "0032_NECK_alt_m_INT", ".ogg", 1024);
				await writeFile(
					join(TEST_AUDIO_DIR, "interviews", "0032_NECK_alt_m_INT.mp3"),
					Buffer.alloc(2048, "A"),
				);

				const response = await audio.request("/stream/164");

				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toBe("audio/ogg");
				expect(response.headers.get("Content-Length")).toBe("1024");

				// Clean up
				await rm(join(TEST_AUDIO_DIR, "interviews", "0032_NECK_alt_m_INT.ogg"));
				await rm(join(TEST_AUDIO_DIR, "interviews", "0032_NECK_alt_m_INT.mp3"));
			});

			it("should fall back to .mp3 when .ogg does not exist", async () => {
				const response = await audio.request("/stream/162");

				expect(response.status).toBe(200);
				expect(response.headers.get("Content-Type")).toBe("audio/mpeg");
			});
		});

		describe("Streaming Headers", () => {
			it("should include required headers for audio streaming", async () => {
				const response = await audio.request("/stream/161");

				// These headers should be accessible to the frontend
				expect(response.headers.get("Accept-Ranges")).toBe("bytes");
				expect(response.headers.get("Content-Length")).toBeTruthy();
				expect(response.headers.get("Content-Type")).toBeTruthy();
			});
		});

		describe("Caching", () => {
			it("should include cache headers for efficient playback", async () => {
				const response = await audio.request("/stream/161");

				expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000");
				expect(response.headers.get("Last-Modified")).toBeTruthy();
			});
		});
	});

	describe("GET /waveform/:instanceId", () => {
		it("serves distinct stereo peaks resolved from the database folder and filename", async () => {
			await createTestAudioFile(170, "nested-recording", ".ogg", 512, "nested/interviews");
			await createTestWaveform(170);

			const response = await audio.request("/waveform/170");
			const body = await response.json();

			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toContain("application/json");
			expect(body.duration).toBe(12.5);
			expect(body.channels).toEqual([
				[0.25, -0.75],
				[-0.5, 1],
			]);
		});

		it("supports ETag and Last-Modified cache validation", async () => {
			await createTestAudioFile(171, "cached-recording", ".ogg");
			await createTestWaveform(171);
			const first = await audio.request("/waveform/171");
			const etag = first.headers.get("ETag")!;
			const lastModified = first.headers.get("Last-Modified")!;

			const etagResponse = await audio.request("/waveform/171", {
				headers: { "If-None-Match": etag },
			});
			const dateResponse = await audio.request("/waveform/171", {
				headers: { "If-Modified-Since": lastModified },
			});

			expect(etagResponse.status).toBe(304);
			expect(dateResponse.status).toBe(304);
		});

		it("returns 400 for invalid instance IDs", async () => {
			const response = await audio.request("/waveform/not-a-number");
			expect(response.status).toBe(400);
		});

		it("returns 404 for a missing sidecar", async () => {
			await createTestAudioFile(172, "no-waveform", ".ogg");
			const response = await audio.request("/waveform/172");
			expect(response.status).toBe(404);
		});

		it("returns 404 for a sidecar older than its audio", async () => {
			await createTestAudioFile(173, "stale-waveform", ".ogg");
			await createTestWaveform(173);
			const audioPath = join(TEST_AUDIO_DIR, "interviews", "stale-waveform.ogg");
			const future = new Date(Date.now() + 5_000);
			await utimes(audioPath, future, future);

			const response = await audio.request("/waveform/173");
			expect(response.status).toBe(404);
		});

		it("rejects traversal in database-controlled folders and filenames", async () => {
			audioLocations.set(174, { audio_link: "../outside", comment: "recording" });
			audioLocations.set(175, { audio_link: "interviews", comment: "../recording" });

			expect((await audio.request("/waveform/174")).status).toBe(404);
			expect((await audio.request("/waveform/175")).status).toBe(404);
		});
	});
});
