<script lang="ts" setup>
import type { HtmlHTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<{
	class?: HtmlHTMLAttributes["class"];
}>();
</script>

<template>
	<div :class="cn('mt-auto flex flex-col gap-2 p-4', props.class)" data-slot="drawer-footer">
		<slot />
	</div>
</template>
