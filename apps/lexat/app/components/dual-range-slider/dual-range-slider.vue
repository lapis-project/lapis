<script setup lang="ts">
export interface Props {
	accessibilityLabel: string;
	labelPosition?: "top" | "bottom";
	min?: number;
	max?: number;
	step?: number;
	value?: Array<number>;
}

const props = withDefaults(defineProps<Props>(), {
	labelPosition: "top",
	min: 10,
	max: 100,
	step: 1,
});

const emit = defineEmits<{
	"update:value": [value: Array<number>];
}>();

const sliderValue = computed<Array<number>>({
	get() {
		return Array.isArray(props.value) ? props.value : [props.min, props.max];
	},
	set(value) {
		emit("update:value", value);
	},
});
</script>

<template>
	<div class="relative w-full" :class="props.labelPosition === 'top' ? 'pt-6' : 'pb-6'">
		<USlider
			v-model="sliderValue"
			:aria-label="props.accessibilityLabel"
			color="primary"
			:max="props.max"
			:min="props.min"
			size="md"
			:step="props.step"
			:ui="{
				thumb: [
					'after:pointer-events-none after:absolute after:left-1/2 after:z-10 after:-translate-x-1/2 after:whitespace-nowrap after:text-xs after:font-medium after:text-toned',
					props.labelPosition === 'top'
						? 'after:bottom-full after:mb-1'
						: 'after:top-full after:mt-1',
				],
			}"
		/>
	</div>
</template>

<style scoped>
/* Anchor labels to the thumbs so they share the slider's in-bounds positioning. */
:deep([data-slot="thumb"])::after {
	content: attr(aria-valuenow);
}

:deep(:nth-child(2 of [data-slot="thumb"]))::after {
	content: "<" attr(aria-valuenow);
}
</style>
