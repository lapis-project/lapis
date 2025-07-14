<script setup lang="ts">
definePageMeta({
	layout: "tool",
});

function getRandomWord() {
	const min = 4; // minimum length of the word
	const max = 12; // maximum length of the word
	const length = Math.floor(Math.random() * (max - min + 1)) + min;

	let result = "";
	while (result.length < length) {
		result += Math.random().toString(36).substring(2);
	}
	return result.substring(0, length);
}

const containerElementWidth = ref(0);
const tokenColHeight = ref(0);

const speakerContainers = computed(() => {
	console.log(containerElementWidth.value, tokenColHeight.value);
	return Math.floor(containerElementWidth.value / tokenColHeight.value);
});

function handleResize() {
	const element = document.getElementById("eventContainer");
	if (element != null) {
		containerElementWidth.value = element.getBoundingClientRect().height;
	}
}

onMounted(async () => {
	window.addEventListener("resize", handleResize, { passive: true });

	await nextTick();
	const element = document.getElementById("eventContainer");
	if (element != null) {
		containerElementWidth.value = element.getBoundingClientRect().height;
	}

	const tokenElement = document.getElementById("tokenCol");
	if (tokenElement != null) {
		tokenColHeight.value = tokenElement.getBoundingClientRect().height;
	}
});

onUnmounted(() => {
	window.removeEventListener("resize", handleResize);
});
</script>

<template>
	<div class="container border border-accent-foreground p-0">
		<div class="grid grid-rows-[auto_1fr]">
			<div></div>
			<div class="grid grid-cols-[160px_1fr] gap-2">
				<div>
					<div>{{ speakerContainers }}</div>
				</div>
				<div id="eventContainer" class="flex flex-wrap bg-amber-100">
					<div v-for="i in 100" :key="i" class="">
						<div id="tokenCol">
							<div class="p-2 bg-amber-200 border border-amber-500">{{ getRandomWord() }}</div>
							<div class="p-2 bg-amber-300 border border-amber-500">{{ getRandomWord() }}</div>
							<div class="p-2 bg-amber-400 border border-amber-500">{{ getRandomWord() }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
