<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { ComboboxItemIndicator, type ComboboxItemIndicatorProps, useForwardProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<ComboboxItemIndicatorProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
	<ComboboxItemIndicator
		v-bind="forwarded"
		:class="cn('ml-auto', props.class)"
		data-slot="combobox-item-indicator"
	>
		<slot />
	</ComboboxItemIndicator>
</template>
