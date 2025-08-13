<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { ChevronUp } from "lucide-vue-next";
import { SelectScrollUpButton, type SelectScrollUpButtonProps, useForwardProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<SelectScrollUpButtonProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
	<SelectScrollUpButton
		v-bind="forwardedProps"
		:class="cn('flex cursor-default items-center justify-center py-1', props.class)"
		data-slot="select-scroll-up-button"
	>
		<slot>
			<ChevronUp class="size-4" />
		</slot>
	</SelectScrollUpButton>
</template>
