<script setup lang="ts">
import WaveSurfer from "wavesurfer.js";

const props = defineProps<{
	audio: HTMLAudioElement | null;
	isPlaying: boolean;
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

onMounted(async () => {
	await nextTick();
	if (props.audio && container.value) {
		console.log(props.audio.src, container.value);
		wavesurfer.value = WaveSurfer.create({
			container: container.value,
			waveColor: "#e7acc5",
			progressColor: "white",
			height: 100,
			barWidth: 2,
			barGap: 0,
			barHeight: 1,
			url: props.audio.src,
		});

		wavesurfer.value.setMuted(true);
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
	<div ref="container" class="absolute pointer-events-none" />
</template>
