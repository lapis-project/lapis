import * as fs from "node:fs";
import * as path from "node:path";

import { log } from "@acdh-oeaw/lib";

import { AUDIO_DIR } from "@/config/config.ts";
import { getAudioLocationByInstanceId } from "@/db/audioRepository.ts";

const AUDIO_EXTENSIONS = [
	{ extension: ".ogg", mimeType: "audio/ogg" },
	{ extension: ".mp3", mimeType: "audio/mpeg" },
] as const;
const AUDIO_DIRECTORY = path.resolve(AUDIO_DIR);

export interface AudioFile {
	path: string;
	mimeType: "audio/ogg" | "audio/mpeg";
	stat: fs.Stats;
}

export interface WaveformFile {
	path: string;
	stat: fs.Stats;
}

function isPathInsideAudioDirectory(filePath: string): boolean {
	const relativePath = path.relative(AUDIO_DIRECTORY, filePath);
	return (
		relativePath !== ".." &&
		!relativePath.startsWith(`..${path.sep}`) &&
		!path.isAbsolute(relativePath)
	);
}

async function findAudioFile(folder: string, filename: string): Promise<AudioFile | null> {
	const audioFolder = path.resolve(AUDIO_DIRECTORY, folder);
	if (!isPathInsideAudioDirectory(audioFolder) || path.basename(filename) !== filename) {
		log.warn(`Invalid audio location from database: ${folder}/${filename}`);
		return null;
	}

	for (const { extension, mimeType } of AUDIO_EXTENSIONS) {
		const audioPath = path.join(audioFolder, `${filename}${extension}`);
		try {
			const stat = await fs.promises.stat(audioPath);
			if (stat.isFile()) return { path: audioPath, mimeType, stat };
		} catch {
			// This extension does not exist or is not readable. Try the next one.
		}
	}

	return null;
}

/** Resolves a transcript's database-controlled audio path without allowing traversal. */
export async function resolveAudioFileForInstanceId(instanceId: number): Promise<AudioFile | null> {
	if (!Number.isSafeInteger(instanceId) || instanceId < 0) return null;

	const audioLocation = await getAudioLocationByInstanceId(instanceId);
	if (!audioLocation?.audio_link || !audioLocation.comment) return null;
	return findAudioFile(audioLocation.audio_link, audioLocation.comment);
}

/** Resolves a current waveform sidecar for a transcript's audio file. */
export async function resolveWaveformFileForInstanceId(
	instanceId: number,
): Promise<WaveformFile | null> {
	const audioFile = await resolveAudioFileForInstanceId(instanceId);
	if (!audioFile) return null;

	const waveformPath = `${audioFile.path}.waveform.json`;
	try {
		const stat = await fs.promises.stat(waveformPath);
		if (!stat.isFile() || stat.mtimeMs < audioFile.stat.mtimeMs) return null;
		return { path: waveformPath, stat };
	} catch {
		return null;
	}
}
