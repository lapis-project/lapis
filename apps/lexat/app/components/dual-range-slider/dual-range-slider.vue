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

const thumbLabels = computed(() => {
	const range = props.max - props.min;

	return sliderValue.value.map((value, index) => ({
		value,
		label: `${index === 1 ? "<" : ""}${value}`,
		position: range > 0 ? ((value - props.min) / range) * 100 : 0,
	}));
});
</script>

<template>
	<div class="relative w-full" :class="props.labelPosition === 'top' ? 'pt-6' : 'pb-6'">
		<span
			v-for="thumb in thumbLabels"
			:key="thumb.label"
			class="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-toned"
			:class="props.labelPosition === 'top' ? 'top-0' : 'bottom-0'"
			:style="{ left: `${thumb.position}%` }"
		>
			{{ thumb.label }}
		</span>

		<USlider
			v-model="sliderValue"
			:aria-label="props.accessibilityLabel"
			color="primary"
			:max="props.max"
			:min="props.min"
			size="md"
			:step="props.step"
		/>
	</div>
</template>
