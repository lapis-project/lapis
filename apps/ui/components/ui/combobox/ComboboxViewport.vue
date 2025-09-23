<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { ComboboxViewport, type ComboboxViewportProps, useForwardProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<ComboboxViewportProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
	<ComboboxViewport
		v-bind="forwarded"
		:class="cn('max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto', props.class)"
		data-slot="combobox-viewport"
	>
		<slot />
	</ComboboxViewport>
</template>
