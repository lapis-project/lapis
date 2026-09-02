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
	(e: "error", message: string): void;
	(e: "update:scrub", value: number): void;
	(e: "time-change", value: number): void;
}>();

const WAVEFORM_HEIGHT = 120;

const container = ref<HTMLElement | null>(null);
const wavesurfer = shallowRef<WaveSurfer | null>(null);
const status = ref<"loading" | "ready" | "error">("loading");

const {
	response: waveform,
	status: waveformRequestStatus,
	error: waveformRequestError,
} = useAudioWaveform(() => props.id);

function destroyWaveSurfer(instance = wavesurfer.value) {
	if (!instance) return;
	instance.destroy();
	if (wavesurfer.value === instance) wavesurfer.value = null;
}

function playSurfer() {
	void wavesurfer.value?.play().catch(() => {});
}

function pauseSurfer() {
	wavesurfer.value?.pause();
}

function resetPlayer() {
	wavesurfer.value?.stop();
}

watch(
	() => props.isPlaying,
	(isPlaying) => {
		if (isPlaying) {
			playSurfer();
		} else {
			pauseSurfer();
		}
	},
);

watch(
	() => props.isStopped,
	(isStopped) => {
		if (isStopped) resetPlayer();
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

watch(
	waveformRequestStatus,
	(requestStatus) => {
		if (requestStatus !== "error") return;
		status.value = "error";
		emit("error", waveformRequestError.value ?? "Could not load waveform.");
	},
	{ immediate: true },
);

watch(
	[() => props.audio, container, waveform, waveformRequestStatus],
	([media, target, data, requestStatus], _previous, onCleanup) => {
		destroyWaveSurfer();
		status.value = requestStatus === "error" ? "error" : "loading";

		if (!media || !target || !data || requestStatus !== "success") return;

		let instance: WaveSurfer;
		try {
			instance = WaveSurfer.create({
				container: target,
				media,
				peaks: data.channels,
				duration: data.duration,
				height: WAVEFORM_HEIGHT,
				minPxPerSec: Math.max(4, (data.channels[0].length * 4) / data.duration),
				splitChannels: [
					{
						overlay: true,
						height: WAVEFORM_HEIGHT,
						waveColor: "rgb(181 71 47 / 38%)",
						progressColor: "#b5472f",
					},
					{
						overlay: true,
						height: WAVEFORM_HEIGHT,
						waveColor: "rgb(40 120 165 / 38%)",
						progressColor: "#2878a5",
					},
				],
				hideScrollbar: false,
				autoScroll: true,
				autoCenter: true,
				dragToSeek: true,
				autoplay: false,
			});
		} catch (error) {
			status.value = "error";
			emit("error", error instanceof Error ? error.message : "Could not render waveform.");
			return;
		}

		wavesurfer.value = instance;
		onCleanup(() => destroyWaveSurfer(instance));

		instance.on("timeupdate", (currentTime) => {
			if (wavesurfer.value === instance) emit("time-change", currentTime);
		});
		instance.once("ready", () => {
			if (wavesurfer.value !== instance) return;
			status.value = "ready";
			emit("ready");
			if (props.isPlaying) playSurfer();
		});
		instance.once("error", (error) => {
			if (wavesurfer.value !== instance) return;
			status.value = "error";
			emit("error", error instanceof Error ? error.message : "Could not render waveform.");
		});
		instance.on("seeking", (currentTime) => {
			if (wavesurfer.value !== instance) return;
			emit("update:scrub", currentTime);
			emit("commit-scrub");
		});
	},
	{ immediate: true, flush: "post" },
);

onUnmounted(destroyWaveSurfer);
</script>

<template>
	<div ref="container" class="absolute z-0" :data-status="status" />
</template>
