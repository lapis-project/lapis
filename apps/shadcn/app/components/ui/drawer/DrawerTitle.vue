<script lang="ts" setup>
import { reactiveOmit } from "@vueuse/core";
import { DrawerTitle, type DrawerTitleProps } from "vaul-vue";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<DrawerTitleProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
	<DrawerTitle
		v-bind="delegatedProps"
		:class="cn('text-foreground font-semibold', props.class)"
		data-slot="drawer-title"
	>
		<slot />
	</DrawerTitle>
</template>
