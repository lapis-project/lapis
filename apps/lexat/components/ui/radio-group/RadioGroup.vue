<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import {
	RadioGroupRoot,
	type RadioGroupRootEmits,
	type RadioGroupRootProps,
	useForwardPropsEmits,
} from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<RadioGroupRootProps & { class?: HTMLAttributes["class"] }>();
const emits = defineEmits<RadioGroupRootEmits>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<RadioGroupRoot :class="cn('grid gap-3', props.class)" data-slot="radio-group" v-bind="forwarded">
		<slot />
	</RadioGroupRoot>
</template>
