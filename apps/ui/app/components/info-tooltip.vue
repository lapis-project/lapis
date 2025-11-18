<script setup lang="ts">
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
