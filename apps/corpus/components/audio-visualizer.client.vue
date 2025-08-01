<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
// import { AudioMotionAnalyzer } from "audiomotion-analyzer";

const props = defineProps<{
	audio: HTMLAudioElement | null;
	isPlaying: boolean;
	isStopped: boolean;
}>();

const container = ref<HTMLDivElement | null>(null);

let analyzerInstance: any = null;

function PlaySurfer() {
	if (analyzerInstance.value == null) return;
	analyzerInstance.value.play();
}

function PauseSurfer() {
	if (analyzerInstance.value == null) return;
	analyzerInstance.value.pause();
}

function ResetPlayer() {
	if (analyzerInstance.value == null) return;
	analyzerInstance.value.stop();
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

function onResize() {
	if (analyzerInstance && container.value && typeof analyzerInstance._setCanvas === "function") {
		const width = container.value.offsetWidth;
		const height = container.value.offsetHeight;

		analyzerInstance.setCanvasSize(width, height);
	}
}

onMounted(async () => {
	await nextTick();

	window.addEventListener("resize", onResize);

	const mod = await import("~/public/index.js");
	const AudioMotionAnalyzer = mod.default;
	if (!AudioMotionAnalyzer) {
		console.error("AudioMotionAnalyzer class not found in module!");
		return;
	}

	if (props.audio && container.value) {
		if (analyzerInstance) {
			analyzerInstance.disconnectInput();
			analyzerInstance.destroy();
			analyzerInstance = null;
		}

		analyzerInstance = new AudioMotionAnalyzer(container.value, {
			mode: 10, // 1 --> lines, 8 --> bars, 10 --> wave
			barSpace: 2,
			smoothing: 0.7,
			height: container.value.clientHeight,
			showPeaks: false,
			showScaleX: false,
			frequencyScale: "log",
			width: container.value.clientWidth,
		});

		analyzerInstance.registerGradient("custom", {
			colorStops: [
				{ pos: 0, color: "#FFFFFF" },
				{ pos: 0.5, color: "#FFFFFF" },
				{ pos: 1, color: "#FFFFFF" },
			],
			bgColor: "#00000", //"#B03267" --> pink
		});
		analyzerInstance.gradient = "custom";
		analyzerInstance.connectInput(props.audio);
	}
});

onUnmounted(() => {
	if (analyzerInstance) {
		analyzerInstance.disconnectInput();
		analyzerInstance.destroy();
		analyzerInstance = null;
	}
	window.removeEventListener("resize", onResize);
});
</script>

<template>
	<div ref="container" class="absolute h-full inset-0 z-0 pointer-events-none" />
</template>
