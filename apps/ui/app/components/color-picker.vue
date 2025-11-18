<script lang="ts" setup>
import { useDebounceFn } from "@vueuse/core";

const modelValue = defineModel<string>({ default: "" });

const emit = defineEmits<{
	(event: "update:modelValue", values: string): void;
}>();

// use a debounce to prevent the map from re-rendering while dragging over the color wheel
const updateColor = useDebounceFn((event) => {
	emit("update:modelValue", event.target.value);
}, 100);
</script>

<template>
	<div>
		<label class="sr-only" for="color-picker">Color Picker</label>
		<input
			id="color-picker"
			class="color-picker cursor-pointer appearance-none border-none bg-transparent"
			type="color"
			:value="modelValue"
			@input="updateColor"
		/>
	</div>
</template>

<style lang="css" scoped>
.color-picker {
	inline-size: 20px;
	block-size: 20px;
}

.color-picker::-webkit-color-swatch-wrapper {
	padding: 0;
}
</style>
