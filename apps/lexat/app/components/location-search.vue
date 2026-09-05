<script setup lang="ts">
import type { LocationOption } from "@/types/location-option";

const modelValue = defineModel<Array<LocationOption>>({ default: [] });

export interface Props {
	options: Array<LocationOption>;
	placeholder?: string;
	dataTestid?: string;
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: "Select an option",
});

const selectionLabel = computed(() => {
	const firstSelection = modelValue.value[0]?.label;
	if (!firstSelection) return props.placeholder;

	const additionalSelections = modelValue.value.length - 1;
	return additionalSelections > 0 ? `${firstSelection} +${additionalSelections}` : firstSelection;
});
</script>

<template>
	<USelectMenu
		v-model="modelValue"
		by="value"
		class="w-64"
		clear
		:data-testid="props.dataTestid"
		icon="i-lucide-map-pin"
		:items="props.options"
		multiple
		:placeholder="props.placeholder"
		:search-input="{ placeholder: props.placeholder }"
		size="lg"
		virtualize
	>
		<span class="truncate">{{ selectionLabel }}</span>
	</USelectMenu>
</template>
