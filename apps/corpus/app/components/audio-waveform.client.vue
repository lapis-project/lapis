<script setup lang="ts">
import WaveSurfer from "wavesurfer.js";

const props = defineProps<{
	id: number;
	audio: HTMLAudioElement | null;
	scrub: number;
	isScrubbing: boolean;
	isPlaying: boolean;
	isStopped: boolean;
}>();

const emit = defineEmits<{
	(e: "commit-scrub" | "ready"): void;
	(e: "update:scrub", value: number): void;
	(e: "time-change", value: number): void;
}>();

const container = ref<HTMLElement | string>("");
const wavesurfer = ref<WaveSurfer | null>(null);
const status = ref<"loading" | "ready" | "error">("loading");

const abortController = new AbortController();

const { response: waveform, isPending, hasError } = useAudioWaveform(props.id, abortController);

function PlaySurfer() {
	if (wavesurfer.value == null) return;
	wavesurfer.value.play();
}

function PauseSurfer() {
	if (wavesurfer.value == null) return;
	wavesurfer.value.pause();
}

function ResetPlayer() {
	if (wavesurfer.value == null) return;
	wavesurfer.value.stop();
}

watch(
	() => {
		return props.isPlaying;
	},
	() => {
		if (props.isPlaying) {
			PlaySurfer();
		} else PauseSurfer();
	},
);

watch(
	() => {
		return props.isStopped;
	},
	() => {
		if (props.isStopped) {
			ResetPlayer();
		}
	},
);

watch(
	() => props.scrub,
	(val) => {
		if (!props.isScrubbing || !wavesurfer.value) return;
		const ratio = val / wavesurfer.value.getDuration();
		wavesurfer.value.seekTo(ratio);
	},
);

onMounted(async () => {
	await nextTick();
	if (props.audio && container.value && waveform.value != null) {
		wavesurfer.value = WaveSurfer.create({
			container: container.value,
			media: props.audio,
			peaks: waveform.value.channels,
			duration: waveform.value.duration,
			height: 120,
			minPxPerSec: Math.max(4, (waveform.value.channels[0].length * 4) / waveform.value.duration),
			splitChannels: [
				{
					overlay: true,
					height: 120,
					waveColor: "rgb(181 71 47 / 38%)",
					progressColor: "#b5472f",
				},
				{
					overlay: true,
					height: 120,
					waveColor: "rgb(40 120 165 / 38%)",
					progressColor: "#2878a5",
				},
			],
			hideScrollbar: false,
			autoScroll: true,
			autoCenter: true,
			dragToSeek: true,
		});

		wavesurfer.value.on("timeupdate", (currentTime) => emit("time-change", currentTime));
		wavesurfer.value.once("ready", () => {
			if (waveform.value === wavesurfer.value) status.value = "ready";
		});
		wavesurfer.value.once("error", () => {
			if (waveform.value === wavesurfer.value) status.value = "error";
		});
		PauseSurfer();

		// Wait for WaveSurfer to be ready
		wavesurfer.value.on("ready", () => {
			emit("ready");

			PlaySurfer();
		});

		wavesurfer.value.on("seeking", (ratio: number) => {
			const time = ratio * wavesurfer.value!.getDuration();

			emit("update:scrub", time);
			emit("commit-scrub");
		});
	}
});

onUnmounted(() => {
	if (wavesurfer.value != null) {
		wavesurfer.value.destroy();
		wavesurfer.value = null;
	}
});
</script>

<template>
	<div ref="container" class="absolute z-0" />
</template>
