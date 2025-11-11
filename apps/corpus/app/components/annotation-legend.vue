<script setup lang="ts">
export interface LegendItem {
	label: string;
	color: string;
	depth: number;
}

const emit = defineEmits<{
	(e: "updateLegend", legend: Array<LegendItem>): void;
}>();

const legend = ref<Array<LegendItem>>([
	{ label: "G0", color: "#fd9a00", depth: 0 },
	{ label: "G1", color: "#ad46ff", depth: 1 },
	{ label: "G2", color: "#a9326a", depth: 2 },
	{ label: "G3", color: "#009689", depth: 3 },
	{ label: "G4", color: "#104e64", depth: 4 },
]);

function changeColor(depth: number, color: string) {
	const item = legend.value.find((l) => l.depth === depth);
	if (item) {
		item.color = color;
		emit("updateLegend", legend.value);
	}
}
</script>

<template>
	<div class="py-4">
		<Label class="text-sm text-muted-foreground mb-2" for="tags">Legende</Label>
		<div class="flex flex-row gap-2 items-center">
			<div v-for="item in legend" :key="item.depth" class="flex items-center gap-2">
				<ColorPicker
					v-model="item.color"
					class="flex"
					@update:model-value="(val) => changeColor(item.depth, val)"
				/>
				<span class="flex text-sm">{{ item.label }}</span>
			</div>
		</div>
	</div>
</template>
