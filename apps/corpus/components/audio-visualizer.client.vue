<script setup lang="ts">
import { AudioMotionAnalyzer } from "audiomotion-analyzer";

const props = defineProps<{
	audio: HTMLAudioElement | null;
}>();

let analyzerInstance: AudioMotionAnalyzer | null = null;
const container = ref<HTMLDivElement | null>(null);

onMounted(async () => {
	await nextTick();
	if (props.audio && container.value) {
		analyzerInstance = new AudioMotionAnalyzer(container.value, {
			source: props.audio,
			mode: 0,
			gradient: "none",
			colorMode: "solid" as AudioMotionAnalyzer["colorMode"],
			barSpace: 2,
			smoothing: 0.7,
			mirror: 1,
			showBgColor: true,
			bgAlpha: 1,
			alphaBars: false,
			outlineBars: false,
			ledBars: false,
			roundBars: false,
			reflexRatio: 0,
			waveColor: "#ffffff",
			height: 100,
			width: container.value.offsetWidth,
		});

		analyzerInstance.connectInput(props.audio);
	}
});

onBeforeUnmount(() => {
	if (analyzerInstance) {
		analyzerInstance.disconnectInput();
		analyzerInstance.destroy();
		analyzerInstance = null;
	}
});
</script>

<template>
	<div ref="container" class="absolute inset-0 z-0 pointer-events-none" />
</template>
