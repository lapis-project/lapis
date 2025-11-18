<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { TabsRoot, type TabsRootEmits, type TabsRootProps, useForwardPropsEmits } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<TabsRootProps & { class?: HTMLAttributes["class"] }>();
const emits = defineEmits<TabsRootEmits>();

const delegatedProps = reactiveOmit(props, "class");
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<TabsRoot v-bind="forwarded" :class="cn('flex flex-col gap-2', props.class)" data-slot="tabs">
		<slot />
	</TabsRoot>
</template>
