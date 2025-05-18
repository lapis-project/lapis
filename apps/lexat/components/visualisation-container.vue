<script lang="ts" setup>
import { useElementSize } from "@vueuse/core";
import { ref } from "vue";

const props = defineProps<{
	fullscreen: boolean;
}>();

const elementRef = ref<HTMLElement | null>(null);

const { width, height } = useElementSize(elementRef);
</script>

<template>
	<div
		ref="elementRef"
		class="isolate grid size-full overflow-hidden"
		:class="props.fullscreen ? 'fixed z-50 top-0 left-0' : 'relative'"
		data-visualisation-container
	>
		<slot v-if="width && height" :height="height" :width="width" />
	</div>
</template>
