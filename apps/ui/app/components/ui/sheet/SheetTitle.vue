<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { DialogTitle, type DialogTitleProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<DialogTitleProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
	<DialogTitle
		:class="cn('text-foreground font-semibold', props.class)"
		data-slot="sheet-title"
		v-bind="delegatedProps"
	>
		<slot />
	</DialogTitle>
</template>
