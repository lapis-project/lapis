<script setup lang="ts">
defineProps<{
	color?: string;
	secondary?: string;
	/** Share of all answers, between 0 and 1. */
	value: number;
}>();
</script>

<template>
	<div class="my-2 text-xs">
		<div class="my-0.5 flex items-center gap-2">
			<span
				class="rounded-full size-2 inline-block shrink-0"
				:style="{ backgroundColor: color }"
			></span>
			<slot name="label"></slot>
			<span class="ml-auto flex shrink-0 items-center gap-2">
				<span class="text-muted-foreground">{{ secondary }}</span>
				<span>{{ (value * 100).toFixed(0) }}%</span>
				<slot name="actions"></slot>
			</span>
		</div>
		<svg class="block w-full" height="4">
			<rect height="4" rx="2" :style="{ fill: 'var(--accent)' }" width="100%" />
			<rect
				class="transition-[width] duration-500"
				height="4"
				rx="2"
				:style="{ width: `${value * 100}%`, fill: color }"
			/>
		</svg>
	</div>
</template>
