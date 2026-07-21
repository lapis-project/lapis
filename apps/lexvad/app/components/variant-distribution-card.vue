<script setup lang="ts">
import { VisDonut, VisSingleContainer } from "@unovis/vue";

const props = defineProps<{
	data: Array<{ label: string; value: number }>;
}>();

const t = useTranslations();
const mode = ref("region");

const modeItems = computed(() => [
	{ label: t("VariantDistributionCard.dialectal-region"), value: "region" },
	{ label: t("VariantDistributionCard.state"), value: "state" },
]);

const { getRegionPattern, getRegionPatternFill } = useColorStore();

const color = (d: (typeof props.data)[0]) => getRegionPatternFill(d.label);

const legendItems = computed(() => {
	const total = props.data.reduce((sum, d) => sum + d.value, 0);
	return props.data.map((d) => ({
		label: d.label,
		value: total > 0 ? d.value / total : 0,
		secondary: t("MapsPage.sidebar.places", d.value),
		fill: getRegionPatternFill(d.label),
		color: getRegionPattern(d.label).color,
	}));
});
</script>

<template>
	<div class="rounded-lg p-3.5 border">
		<div
			class="uppercase font-semibold text-muted-foreground text-xs mb-2.5 flex items-center gap-1"
		>
			{{ t("VariantDistributionCard.title") }}

			<USelect
				v-model="mode"
				class="uppercase font-semibold text-muted-foreground text-xs min-h-0 py-0 px-0"
				:items="modeItems"
				size="sm"
				variant="none"
			/>
		</div>
		<VisSingleContainer class="w-full h-52" :data="data">
			<VisDonut
				:arc-width="30"
				:color="color"
				:pad-angle="0.025"
				:radius="80"
				:value="(d: (typeof data)[0]) => d.value"
			/>
		</VisSingleContainer>
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
