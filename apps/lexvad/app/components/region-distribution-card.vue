<script setup lang="ts">
const props = defineProps<{
	question: string;
	colors: Record<string, string>;
}>();

const t = useTranslations();
const { getVariantsForRegion, allRegions, allBundeslaender } = useQuestions();
const mode = defineModel<"region" | "bundesland">("mode", { default: "region" });

const data = computed(() => {
	const keys = mode.value === "region" ? allRegions : allBundeslaender;
	return keys.map((label) => ({
		label,
		entries: Object.entries(getVariantsForRegion(props.question, label, mode.value)).map(
			([entryLabel, value]) => ({ label: entryLabel, value }),
		),
	}));
});

const orderedVariants = computed(() => {
	const totals = new Map<string, number>();
	for (const region of data.value) {
		for (const entry of region.entries) {
			totals.set(entry.label, (totals.get(entry.label) ?? 0) + entry.value);
		}
	}
	return [...totals.keys()].toSorted((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0));
});

const colorFor = (label: string) => props.colors[label];

const legend = computed(() =>
	orderedVariants.value.map((label) => ({ label, color: colorFor(label) })),
);

const rows = computed(() =>
	data.value
		.map((region) => {
			const values = new Map(region.entries.map((e) => [e.label, e.value]));
			const total = region.entries.reduce((sum, e) => sum + e.value, 0);
			return {
				label: region.label,
				total,
				segments: orderedVariants.value
					.map((label) => ({ label, value: values.get(label) ?? 0, color: colorFor(label) }))
					.filter((segment) => segment.value > 0),
			};
		})
		.toSorted((a, b) => b.total - a.total),
);
</script>

<template>
	<div class="rounded-lg p-3.5 border">
		<div
			class="uppercase font-semibold text-muted-foreground text-xs mb-2.5 flex items-center gap-1"
		>
			{{ t("RegionDistributionCard.title") }}
		</div>

		<div class="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs">
			<div v-for="item in legend" :key="item.label" class="flex items-center gap-1.5">
				<span class="rounded-[3px] size-3 shrink-0" :style="{ backgroundColor: item.color }"></span>
				<span>{{ item.label }}</span>
			</div>
		</div>

		<div v-for="row in rows" :key="row.label" class="mb-2.5 text-xs">
			<div class="flex justify-between items-baseline mb-1">
				<span class="font-semibold">{{ row.label }}</span>
				<span class="font-semibold">{{ row.total }}</span>
			</div>
			<div class="w-full">
				<div class="flex h-4 rounded overflow-hidden w-full">
					<div
						v-for="segment in row.segments"
						:key="segment.label"
						class="h-full text-center text-white content-center text-nowrap overflow-hidden px-1"
						:style="{
							width: `${(segment.value / row.total) * 100}%`,
							backgroundColor: segment.color,
							fontSize: '10px',
						}"
						:title="`${segment.label}: ${segment.value}`"
					>
						{{ ((segment.value / row.total) * 100).toFixed(0) }}% ({{ segment.value }})
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
