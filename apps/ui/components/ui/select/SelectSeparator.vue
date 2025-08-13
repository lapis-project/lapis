<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { SelectSeparator, type SelectSeparatorProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<SelectSeparatorProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
	<SelectSeparator
		v-bind="delegatedProps"
		:class="cn('bg-border pointer-events-none -mx-1 my-1 h-px', props.class)"
		data-slot="select-separator"
	/>
</template>
