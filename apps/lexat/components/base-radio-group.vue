<script setup lang="ts">
const modelValue = defineModel<string | null>({ default: null });

export interface RadioOption {
	id: string;
	label: string;
	value: string;
}

export interface Props {
	options: Array<RadioOption>;
	orientation?: "horizontal" | "vertical";
}

const props = withDefaults(defineProps<Props>(), {
	orientation: "vertical",
});
</script>

<template>
	<RadioGroup
		v-model="modelValue"
		class="flex"
		:class="props.orientation === 'vertical' ? 'flex-col gap-3' : 'flex-row gap-5'"
		:orientation="props.orientation"
	>
		<div v-for="option in options" :key="option.id" class="flex items-center space-x-2">
			<RadioGroupItem :id="option.id" :value="option.value" />
			<Label :for="option.id">{{ option.label }}</Label>
		</div>
	</RadioGroup>
</template>
