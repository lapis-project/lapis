<script setup lang="ts">
import type { VariantGroup } from "@/composables/use-variant-groups";

const props = defineProps<{
	datasetId: string;
	question: string;
	colors: Record<string, string>;
	groups: Array<VariantGroup>;
}>();

const t = useTranslations();
const { byGroup, groupDisplayLabel } = useVariantGroups();
const { getVariantsForRegion, allRegions, allBundeslaender } = useQuestions(() => props.datasetId);
const mode = defineModel<"region" | "bundesland">("mode", { default: "region" });

const labelById = computed(() => byGroup(props.groups, groupDisplayLabel));

function labelFor(id: string) {
	return labelById.value[id] ?? id;
}

const data = computed(() => {
	const keys = mode.value === "region" ? allRegions.value : allBundeslaender.value;
	return keys.map((label) => ({
		label,
		entries: Object.entries(
			getVariantsForRegion(props.question, label, mode.value, props.groups),
		).map(([id, value]) => ({ id, value })),
	}));
});

const orderedGroups = computed(() => {
	const totals = new Map<string, number>();
	for (const region of data.value) {
		for (const entry of region.entries) {
			totals.set(entry.id, (totals.get(entry.id) ?? 0) + entry.value);
		}
	}
	return [...totals.keys()].toSorted((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0));
});

const legend = computed(() =>
	orderedGroups.value.map((id) => ({ id, label: labelFor(id), color: props.colors[id] })),
);

const rows = computed(() =>
	data.value
		.map((region) => {
			const values = new Map(region.entries.map((e) => [e.id, e.value]));
			const total = region.entries.reduce((sum, e) => sum + e.value, 0);
			return {
				label: region.label,
				total,
				segments: orderedGroups.value
					.map((id) => ({
						id,
						label: labelFor(id),
						value: values.get(id) ?? 0,
						color: props.colors[id],
					}))
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
			<div v-for="item in legend" :key="item.id" class="flex items-center gap-1.5">
				<span class="rounded-[3px] size-3 shrink-0" :style="{ backgroundColor: item.color }"></span>
				<span>{{ item.label }}</span>
			</div>
		</div>

		<div v-for="row in rows" :key="row.label" class="mb-2.5 text-xs">
			<div class="flex justify-between items-baseline mb-1">
				<span>{{ row.label }}</span>
				<span>{{ t("MapsPage.sidebar.places", row.total) }}</span>
			</div>
			<div class="w-full">
				<div class="flex h-4 rounded overflow-hidden w-full">
					<div
						v-for="segment in row.segments"
						:key="segment.id"
						tabindex="0"
						class="h-full text-center text-white content-center text-nowrap overflow-hidden px-1 hover:min-w-fit focus:min-w-fit"
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
