<script setup lang="ts">
import WaveSurfer from "wavesurfer.js";

const props = defineProps<{
	audio: HTMLAudioElement | null;
	scrub: number;
	isScrubbing: boolean;
	isPlaying: boolean;
	isStopped: boolean;
}>();

const emit = defineEmits<{
	(e: "commit-scrub"): void;
	(e: "update:scrub", value: number): void;
	(e: "ready"): void;
}>();

const container = ref<HTMLElement | string>("");
const wavesurfer = ref<WaveSurfer | null>(null);

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
	if (props.audio && container.value) {
		wavesurfer.value = WaveSurfer.create({
			container: container.value,
			waveColor: "grey",
			progressColor: "white",
			height: 100,
			barWidth: 2,
			barGap: 0,
			barHeight: 1,
			backend: "MediaElement",
			url: props.audio.src,
			interact: true,
		});

		PauseSurfer();
		wavesurfer.value.setMuted(true);

		// Wait for WaveSurfer to be ready
		wavesurfer.value.on("ready", () => {
			emit("ready");

			PlaySurfer();
		});

		wavesurfer.value.on("seeking", (ratio: number) => {
			console.log(ratio);
			const time = ratio * wavesurfer.value!.getDuration();
			console.log(time);
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
