<script setup lang="ts">
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
	<div
		:class="cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', props.class)"
		data-slot="alert-title"
	>
		<slot />
	</div>
</template>
