<script setup lang="ts">
const props = defineProps<{
	question: string;
	variant: string;
}>();

const t = useTranslations();
const { getRegionsForVariant } = useQuestions();
const mode = defineModel<"region" | "bundesland">("mode", { default: "region" });

const modeItems = computed(() => [
	{ label: t("VariantDistributionCard.dialectal-region"), value: "region" },
	{ label: t("VariantDistributionCard.state"), value: "bundesland" },
]);

const { getRegionPattern, getRegionPatternFill, getColorForVariant } = useColorStore();

const data = computed(() =>
	Object.entries(getRegionsForVariant(props.question, props.variant, mode.value))
		.toSorted((a, b) => b[1] - a[1])
		.map(([label, value]) => ({ label, value })),
);

const legendItems = computed(() => {
	const total = data.value.reduce((sum, d) => sum + d.value, 0);
	return data.value.map((d) => ({
		label: d.label,
		value: total > 0 ? d.value / total : 0,
		secondary: t("MapsPage.sidebar.places", d.value),
		fill: getRegionPatternFill(d.label),
		color: getRegionPattern(d.label).color,
	}));
});
const mapData = computed(() =>
	Object.fromEntries(legendItems.value.map((entry) => [entry.label, entry.value])),
);
const mapColor = computed(() => getColorForVariant(props.question, props.variant) ?? "#000000");
</script>

<template>
	<div class="rounded-lg p-3.5 border">
		<div
			class="uppercase font-semibold text-muted-foreground text-xs mb-2.5 flex items-center gap-1"
		>
			{{ t("VariantDistributionCard.title") }}

			<USelect
				v-model="mode"
				class="uppercase font-semibold text-muted-foreground text-xs min-h-0"
				:items="modeItems"
				size="sm"
				variant="outline"
			/>
		</div>
		<SimpleHeatMap
			class="w-full h-52"
			:color="mapColor"
			:data="mapData"
			:mode="mode"
		></SimpleHeatMap>
		<div v-for="entry in legendItems" :key="entry.label" class="my-2 text-xs">
			<div class="my-0.5">
				<svg class="inline-block align-[-2px]" height="12" viewBox="0 0 12 12" width="12">
					<circle cx="6" cy="6" r="5.5" :style="{ fill: entry.fill, stroke: entry.color }" />
				</svg>
				<span class="ml-2">{{ entry.label }}</span>
				<span class="float-right">
					<span class="mr-2 text-muted-foreground">{{ entry.secondary }}</span>
					<span class="font-semibold">{{ (entry.value * 100).toFixed(0) }}%</span></span
				>
			</div>
			<svg class="block w-full" height="4">
				<rect height="4" rx="2" :style="{ fill: 'var(--accent)' }" width="100%" />
				<rect
					class="transition-[width] duration-500"
					height="4"
					rx="2"
					:style="{
						width: `${entry.value * 100}%`,
						fill: entry.color,
					}"
				/>
			</svg>
		</div>
	</div>
</template>
