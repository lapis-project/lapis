<script setup lang="ts">
interface Option {
	value: string;
	label: string;
}
defineProps<{
	modes: Array<Option>;
}>();
</script>

<template>
	<ToggleGroup type="single">
		<ToggleGroupItem v-for="mode in modes" :key="mode.value" :value="mode.value">
			{{ mode.label }}
		</ToggleGroupItem>
	</ToggleGroup>
</template>
