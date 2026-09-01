import { mkdtemp, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
	collectStereoPeaks,
	createWaveformData,
	generateAudioWaveforms,
	MAX_WAVEFORM_PEAKS,
	type WaveformGeneratorDependencies,
} from "@/audio/waveformGenerator.ts";

const temporaryDirectories: Array<string> = [];

function encodeStereoFrames(frames: Array<[number, number]>): Buffer {
	const buffer = Buffer.alloc(frames.length * 8);
	frames.forEach(([left, right], index) => {
		buffer.writeFloatLE(left, index * 8);
		buffer.writeFloatLE(right, index * 8 + 4);
	});
	return buffer;
}

async function* chunks(buffer: Buffer, chunkSize = buffer.length): AsyncGenerator<Uint8Array> {
	for (let offset = 0; offset < buffer.length; offset += chunkSize) {
		yield buffer.subarray(offset, offset + chunkSize);
	}
}

function dependenciesFor(
	frames: Array<[number, number]>,
	duration = 1,
): WaveformGeneratorDependencies {
	return {
		probeDuration: vi.fn().mockResolvedValue(duration),
		decodeStereoPcm: vi.fn(() => chunks(encodeStereoFrames(frames), 5)),
	};
}

afterEach(async () => {
	await Promise.all(
		temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
	);
});

describe("audio waveform generation", () => {
	it("keeps two distinct channels and the exact probed duration", async () => {
		const waveform = await createWaveformData(
			"recording.ogg",
			dependenciesFor(
				[
					[0.25, -0.5],
					[-0.75, 0.9],
				],
				2955.755,
			),
		);

		expect(waveform.duration).toBe(2955.755);
		expect(waveform.channels[0]).not.toEqual(waveform.channels[1]);
		expect(waveform.channels.flat().every(Number.isFinite)).toBe(true);
		expect(waveform.channels.flat().every((peak) => Math.abs(peak) <= 1)).toBe(true);
	});

	it("never exceeds the peak limit even when the reported duration is too short", async () => {
		const frames = Array.from({ length: MAX_WAVEFORM_PEAKS * 3 + 1 }, (_, index) => {
			const value = index % 2 === 0 ? 0.5 : -0.75;
			return [value, -value] as [number, number];
		});
		const peaks = await collectStereoPeaks(chunks(encodeStereoFrames(frames), 101), 0.001);

		expect(peaks[0].length).toBeLessThanOrEqual(MAX_WAVEFORM_PEAKS);
		expect(peaks[1].length).toBeLessThanOrEqual(MAX_WAVEFORM_PEAKS);
		expect(peaks.flat().every(Number.isFinite)).toBe(true);
	});

	it("duplicates mono samples into matching stereo lanes", async () => {
		const monoAsStereo = [
			[0.1, 0.1],
			[-0.8, -0.8],
		] satisfies Array<[number, number]>;
		const waveform = await createWaveformData("mono.mp3", dependenciesFor(monoAsStereo));

		expect(waveform.channels[0]).toEqual(waveform.channels[1]);
	});

	it("skips fresh sidecars and regenerates them with --force semantics", async () => {
		const directory = await mkdtemp(join(tmpdir(), "lapis-waveforms-"));
		temporaryDirectories.push(directory);
		const audioPath = join(directory, "recording.ogg");
		const sidecarPath = `${audioPath}.waveform.json`;
		await writeFile(audioPath, "audio");
		const dependencies = dependenciesFor([[0.5, -0.25]]);

		const first = await generateAudioWaveforms({ audioDirectory: directory, dependencies });
		const now = new Date();
		await utimes(sidecarPath, now, now);
		const second = await generateAudioWaveforms({ audioDirectory: directory, dependencies });
		const forced = await generateAudioWaveforms({
			audioDirectory: directory,
			dependencies,
			force: true,
		});

		expect(first[0]?.status).toBe("generated");
		expect(second[0]?.status).toBe("skipped");
		expect(forced[0]?.status).toBe("generated");
		expect(dependencies.probeDuration).toHaveBeenCalledTimes(2);
		expect(JSON.parse(await readFile(sidecarPath, "utf8"))).toMatchObject({
			version: 1,
			duration: 1,
		});
	});
});
