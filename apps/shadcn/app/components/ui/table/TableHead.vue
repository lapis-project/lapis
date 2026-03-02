<script setup lang="ts">
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
	<th
		:class="
			cn(
				'text-muted-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
				props.class,
			)
		"
		data-slot="table-head"
	>
		<slot />
	</th>
</template>
