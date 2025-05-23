<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from "reka-ui";

export interface Props {
	accessibilityLabel: string;
	labelPosition?: string;
	min?: number;
	max?: number;
	value?: Array<number>;
}

const props = withDefaults(defineProps<Props>(), {
	labelPosition: "top",
	min: 10,
	max: 100,
});

const { labelPosition, value } = toRefs(props);
const sliderRef = ref(null);
const initialValue = computed(() => {
	return Array.isArray(props.value) ? props.value : [props.min, props.max];
});
const emit = defineEmits(["update:value", "toggle"]);
const emitValueChange = (newValue: Array<number> | undefined) => {
	emit("update:value", newValue);
};
</script>

<template>
	<SliderRoot
		ref="sliderRef"
		class="relative flex w-full touch-none select-none items-center"
		:max="props.max"
		:min="props.min"
		:model-value="value"
		@update:model-value="emitValueChange"
	>
		<SliderTrack class="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
			<SliderRange class="absolute h-full bg-primary" />
		</SliderTrack>

		<SliderThumb
			v-for="(initial, index) in initialValue"
			:key="index"
			:aria-label="accessibilityLabel"
			class="relative block size-4 cursor-pointer rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
		>
			<span
				:class="[
					'absolute flex w-full justify-center text-sm',
					labelPosition === 'top' ? '-top-6' : '',
					labelPosition === 'bottom' ? 'top-4' : '',
				]"
			>
				{{ index === 1 ? "<" : "" }}{{ initial }}
			</span>
		</SliderThumb>
	</SliderRoot>
</template>
