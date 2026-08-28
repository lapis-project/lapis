import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { opendir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_WAVEFORM_PEAKS = 8_000;
export const WAVEFORM_SAMPLE_RATE = 8_000;
export const WAVEFORM_VERSION = 1 as const;

const AUDIO_EXTENSIONS = new Set([".mp3", ".ogg"]);
const OUTPUT_CHANNELS = 2;
const BYTES_PER_SAMPLE = Float32Array.BYTES_PER_ELEMENT;
const BYTES_PER_FRAME = OUTPUT_CHANNELS * BYTES_PER_SAMPLE;

export interface AudioWaveformData {
	version: typeof WAVEFORM_VERSION;
	duration: number;
	channels: [Array<number>, Array<number>];
}

export interface WaveformGeneratorDependencies {
	probeDuration(audioPath: string): Promise<number>;
	decodeStereoPcm(audioPath: string, sampleRate: number): AsyncIterable<Uint8Array>;
}

export interface GenerateAudioWaveformsOptions {
	audioDirectory: string;
	force?: boolean;
	onFile?: (result: WaveformGenerationResult) => void;
	dependencies?: WaveformGeneratorDependencies;
}

export interface WaveformGenerationResult {
	audioPath: string;
	sidecarPath: string;
	status: "generated" | "skipped";
}

function selectSignedPeak(first: number, second: number): number {
	return Math.abs(second) > Math.abs(first) ? second : first;
}

function compactPeaks(channels: [Array<number>, Array<number>]): void {
	for (const channel of channels) {
		let writeIndex = 0;
		for (let readIndex = 0; readIndex < channel.length; readIndex += 2) {
			const first = channel[readIndex] ?? 0;
			const second = channel[readIndex + 1];
			channel[writeIndex] = second == null ? first : selectSignedPeak(first, second);
			writeIndex += 1;
		}
		channel.length = writeIndex;
	}
}

function normalizePeaks(channel: Array<number>): Array<number> {
	let maximum = 0;
	for (const peak of channel) maximum = Math.max(maximum, Math.abs(peak));
	if (maximum === 0) return channel.map(() => 0);

	return channel.map((peak) => Number((peak / maximum).toFixed(6)));
}

/**
 * Reduces interleaved stereo float32 PCM to a bounded number of signed peaks. Chunks may split
 * samples or frames at arbitrary byte offsets.
 */
export async function collectStereoPeaks(
	chunks: AsyncIterable<Uint8Array>,
	duration: number,
	maxPeaks = MAX_WAVEFORM_PEAKS,
	sampleRate = WAVEFORM_SAMPLE_RATE,
): Promise<[Array<number>, Array<number>]> {
	if (!Number.isFinite(duration) || duration <= 0)
		throw new Error("Audio duration must be positive");
	if (!Number.isSafeInteger(maxPeaks) || maxPeaks <= 0) {
		throw new Error("Maximum waveform peak count must be a positive integer");
	}

	let framesPerPeak = Math.max(1, Math.ceil((duration * sampleRate) / maxPeaks));
	let framesInPeak = 0;
	let currentPeaks: [number, number] = [0, 0];
	const channels: [Array<number>, Array<number>] = [[], []];
	let remainder = Buffer.alloc(0);

	const flushPeak = () => {
		channels[0].push(currentPeaks[0]);
		channels[1].push(currentPeaks[1]);
		framesInPeak = 0;
		currentPeaks = [0, 0];

		// A malformed duration must not make memory usage grow with the source file.
		if (channels[0].length > maxPeaks) {
			compactPeaks(channels);
			framesPerPeak *= 2;
		}
	};

	for await (const chunk of chunks) {
		const incoming = Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
		const buffer = remainder.length === 0 ? incoming : Buffer.concat([remainder, incoming]);
		const completeBytes = buffer.length - (buffer.length % BYTES_PER_FRAME);

		for (let offset = 0; offset < completeBytes; offset += BYTES_PER_FRAME) {
			const left = buffer.readFloatLE(offset);
			const right = buffer.readFloatLE(offset + BYTES_PER_SAMPLE);
			if (Number.isFinite(left)) currentPeaks[0] = selectSignedPeak(currentPeaks[0], left);
			if (Number.isFinite(right)) currentPeaks[1] = selectSignedPeak(currentPeaks[1], right);

			framesInPeak += 1;
			if (framesInPeak === framesPerPeak) flushPeak();
		}

		remainder = Buffer.from(buffer.subarray(completeBytes));
	}

	if (framesInPeak > 0) flushPeak();
	if (channels[0].length === 0) throw new Error("FFmpeg decoded no audio samples");

	return [normalizePeaks(channels[0]), normalizePeaks(channels[1])];
}

function collectProcessOutput(
	command: string,
	args: Array<string>,
): Promise<{ stdout: string; stderr: string }> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
		let stdout = "";
		let stderr = "";

		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk: string) => {
			stdout += chunk;
		});
		child.stderr.on("data", (chunk: string) => {
			stderr += chunk;
		});
		child.on("error", reject);
		child.on("close", (code) => {
			if (code === 0) resolve({ stdout, stderr });
			else reject(new Error(`${command} exited with code ${String(code)}: ${stderr.trim()}`));
		});
	});
}

export async function probeAudioDuration(audioPath: string): Promise<number> {
	const { stdout } = await collectProcessOutput("ffprobe", [
		"-v",
		"error",
		"-show_entries",
		"format=duration",
		"-of",
		"default=noprint_wrappers=1:nokey=1",
		audioPath,
	]);
	const duration = Number(stdout.trim());
	if (!Number.isFinite(duration) || duration <= 0) {
		throw new Error(`FFprobe returned an invalid duration for ${audioPath}`);
	}
	return duration;
}

export async function* decodeStereoPcm(
	audioPath: string,
	sampleRate: number,
): AsyncGenerator<Uint8Array> {
	const child = spawn(
		"ffmpeg",
		[
			"-v",
			"error",
			"-i",
			audioPath,
			"-map",
			"0:a:0",
			"-vn",
			"-ac",
			String(OUTPUT_CHANNELS),
			"-ar",
			String(sampleRate),
			"-f",
			"f32le",
			"pipe:1",
		],
		{ stdio: ["ignore", "pipe", "pipe"] },
	);
	let stderr = "";
	child.stderr.setEncoding("utf8");
	child.stderr.on("data", (chunk: string) => {
		stderr += chunk;
	});

	let fullyConsumed = false;
	try {
		for await (const chunk of child.stdout) yield chunk as Buffer;
		fullyConsumed = true;
	} finally {
		if (!fullyConsumed && child.exitCode == null) child.kill();
	}

	const exitCode = await new Promise<number | null>((resolve, reject) => {
		if (child.exitCode != null) {
			resolve(child.exitCode);
			return;
		}
		child.once("error", reject);
		child.once("close", resolve);
	});
	if (exitCode !== 0) {
		throw new Error(`ffmpeg exited with code ${String(exitCode)}: ${stderr.trim()}`);
	}
}

const defaultDependencies: WaveformGeneratorDependencies = {
	probeDuration: probeAudioDuration,
	decodeStereoPcm,
};

export async function createWaveformData(
	audioPath: string,
	dependencies: WaveformGeneratorDependencies = defaultDependencies,
): Promise<AudioWaveformData> {
	const duration = await dependencies.probeDuration(audioPath);
	const channels = await collectStereoPeaks(
		dependencies.decodeStereoPcm(audioPath, WAVEFORM_SAMPLE_RATE),
		duration,
	);
	return { version: WAVEFORM_VERSION, duration, channels };
}

export function getWaveformSidecarPath(audioPath: string): string {
	return `${audioPath}.waveform.json`;
}

async function* findAudioFiles(directory: string): AsyncGenerator<string> {
	const entries = await opendir(directory);
	for await (const entry of entries) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) yield* findAudioFiles(entryPath);
		else if (entry.isFile() && AUDIO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
			yield entryPath;
		}
	}
}

async function isFresh(audioPath: string, sidecarPath: string): Promise<boolean> {
	try {
		const [audioStat, sidecarStat] = await Promise.all([stat(audioPath), stat(sidecarPath)]);
		if (sidecarStat.mtimeMs < audioStat.mtimeMs) return false;

		// Do not preserve a fresh-looking but corrupt sidecar indefinitely.
		const waveform = JSON.parse(await readFile(sidecarPath, "utf8")) as Partial<AudioWaveformData>;
		return waveform.version === WAVEFORM_VERSION && waveform.duration != null;
	} catch {
		return false;
	}
}

async function writeAtomically(filePath: string, contents: string): Promise<void> {
	const temporaryPath = path.join(
		path.dirname(filePath),
		`.${path.basename(filePath)}.${String(process.pid)}.${randomUUID()}.tmp`,
	);
	try {
		await writeFile(temporaryPath, contents, { encoding: "utf8", flag: "wx" });
		await rename(temporaryPath, filePath);
	} catch (error) {
		await rm(temporaryPath, { force: true });
		throw error;
	}
}

export async function generateAudioWaveforms(
	options: GenerateAudioWaveformsOptions,
): Promise<Array<WaveformGenerationResult>> {
	const audioDirectory = path.resolve(options.audioDirectory);
	const dependencies = options.dependencies ?? defaultDependencies;
	const results: Array<WaveformGenerationResult> = [];

	for await (const audioPath of findAudioFiles(audioDirectory)) {
		const sidecarPath = getWaveformSidecarPath(audioPath);
		if (!options.force && (await isFresh(audioPath, sidecarPath))) {
			const result = { audioPath, sidecarPath, status: "skipped" as const };
			results.push(result);
			options.onFile?.(result);
			continue;
		}

		const waveform = await createWaveformData(audioPath, dependencies);
		await writeAtomically(sidecarPath, `${JSON.stringify(waveform)}\n`);
		const result = { audioPath, sidecarPath, status: "generated" as const };
		results.push(result);
		options.onFile?.(result);
	}

	return results;
}
