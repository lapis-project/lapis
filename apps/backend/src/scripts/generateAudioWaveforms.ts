import { generateAudioWaveforms } from "@/audio/waveformGenerator.ts";
import { AUDIO_DIR } from "@/config/config.ts";

const unknownArguments = process.argv
	.slice(2)
	.filter((argument) => argument !== "--force" && argument !== "--");
if (unknownArguments.length > 0) {
	console.error(`Unknown argument(s): ${unknownArguments.join(", ")}`);
	process.exitCode = 1;
} else {
	const results = await generateAudioWaveforms({
		audioDirectory: AUDIO_DIR,
		force: process.argv.includes("--force"),
		onFile(result) {
			process.stdout.write(`${result.status}: ${result.audioPath}\n`);
		},
	});
	const generated = results.filter((result) => result.status === "generated").length;
	process.stdout.write(
		`Waveforms complete: ${String(generated)} generated, ${String(results.length - generated)} skipped\n`,
	);
}
