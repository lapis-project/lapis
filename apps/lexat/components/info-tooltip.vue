<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const props = defineProps<{
	content: string;
}>();
</script>

<template>
	<TooltipProvider :delay-duration="100">
		<Tooltip>
			<TooltipTrigger><slot></slot></TooltipTrigger>
			<TooltipContent>
				<p>{{ props.content }}</p>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
</template>
