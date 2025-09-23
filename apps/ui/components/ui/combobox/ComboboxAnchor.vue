<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { ComboboxAnchor, type ComboboxAnchorProps, useForwardProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<ComboboxAnchorProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardProps(delegatedProps);
</script>

<template>
	<ComboboxAnchor
		v-bind="forwarded"
		:class="cn('w-[200px]', props.class)"
		data-slot="combobox-anchor"
	>
		<slot />
	</ComboboxAnchor>
</template>
