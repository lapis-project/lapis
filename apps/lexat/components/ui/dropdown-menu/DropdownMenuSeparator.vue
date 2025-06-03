<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { DropdownMenuSeparator, type DropdownMenuSeparatorProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<
	DropdownMenuSeparatorProps & {
		class?: HTMLAttributes["class"];
	}
>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
	<DropdownMenuSeparator
		v-bind="delegatedProps"
		:class="cn('bg-border -mx-1 my-1 h-px', props.class)"
		data-slot="dropdown-menu-separator"
	/>
</template>
