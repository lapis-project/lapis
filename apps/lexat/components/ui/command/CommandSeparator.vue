<script setup lang="ts">
import { ComboboxSeparator, type ComboboxSeparatorProps } from "radix-vue";
import { computed, type HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<ComboboxSeparatorProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});
</script>

<template>
	<ComboboxSeparator v-bind="delegatedProps" :class="cn('-mx-1 h-px bg-border', props.class)">
		<slot />
	</ComboboxSeparator>
</template>
