<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { ComboboxSeparator, type ComboboxSeparatorProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<ComboboxSeparatorProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
	<ComboboxSeparator
		v-bind="delegatedProps"
		:class="cn('bg-border -mx-1 h-px', props.class)"
		data-slot="combobox-separator"
	>
		<slot />
	</ComboboxSeparator>
</template>
