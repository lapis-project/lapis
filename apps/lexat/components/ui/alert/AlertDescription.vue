<script setup lang="ts">
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
	<div
		:class="
			cn(
				'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
				props.class,
			)
		"
		data-slot="alert-description"
	>
		<slot />
	</div>
</template>
