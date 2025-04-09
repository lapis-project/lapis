<script setup lang="ts">
import { Label, type LabelProps } from "reka-ui";
import { computed, type HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<LabelProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});
</script>

<template>
	<!-- eslint-disable-next-line vuejs-accessibility/label-has-for -->
	<Label
		v-bind="delegatedProps"
		:class="
			cn(
				'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
				props.class,
			)
		"
	>
		<slot />
	</Label>
</template>
