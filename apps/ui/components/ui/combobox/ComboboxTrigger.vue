<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { ComboboxTrigger, type ComboboxTriggerProps, useForwardProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<ComboboxTriggerProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
	<ComboboxTrigger
		v-bind="forwarded"
		:class="cn('', props.class)"
		data-slot="combobox-trigger"
		tabindex="0"
	>
		<slot />
	</ComboboxTrigger>
</template>
