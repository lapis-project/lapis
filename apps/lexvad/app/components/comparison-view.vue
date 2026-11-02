<script lang="ts" setup>
import { InfoIcon } from "@lucide/vue";

import {
	type MapQueryPosition as MapPosition,
	mapQueryPositions as positions,
} from "@/utils/map-query";
import {
	associationStrength,
	type ComparisonMatchMode,
	locationMatchRadius,
} from "@/utils/variant-flow";

const t = useTranslations();
const datasetStore = useDatasetStore();
const colorStore = useColorStore();
const { byVariant, normaliseGroups } = useVariantGroups();

const { sidebars, storedGroups, allGroups, allVariants, updateSidebar, matchColors } =
	useMapSidebars({ split: true });

function activeVariants(position: MapPosition) {
	const { selectedVariants } = sidebars.value[position];
	return selectedVariants.length > 0 ? selectedVariants : allVariants(position);
}

function comparisonSide(position: MapPosition) {
	return () => {
		const { question } = sidebars.value[position];
		const datasetId = datasetStore.datasetForMap(position);
		// Colours are resolved on the unscoped groups so they match the map,
		// even when only part of a group is selected.
		const colors = byVariant(allGroups(position), (group) =>
			colorStore.getColorForGroup(datasetId, question, group),
		);
		return {
			question,
			groups: normaliseGroups(storedGroups[position].value, activeVariants(position)),
			colors,
			datasetId,
		};
	};
}

const comparisonMatchMode = ref<ComparisonMatchMode>("location");
const comparisonMatchRadius = ref<number>(locationMatchRadius.default);
const idsAvailable = computed(() =>
	positions.every(
		(position) => datasetStore.datasetInfo(datasetStore.datasetForMap(position)).hasIds,
	),
);
const comparisonMatchItems = computed(() => [
	{
		label: idsAvailable.value
			? t("Comparison.match-by-id")
			: t("Comparison.match-by-id-unavailable"),
		value: "id",
		disabled: !idsAvailable.value,
	},
	{ label: t("Comparison.match-by-location"), value: "location" },
]);
watch(idsAvailable, (available) => {
	if (!available && comparisonMatchMode.value === "id") comparisonMatchMode.value = "location";
});

const { association, entryOverlap, variantFlowData } = usePhenomenonComparison(
	comparisonSide("left"),
	comparisonSide("right"),
	comparisonMatchMode,
	comparisonMatchRadius,
);

const { locale } = useI18n();

const comparisonStats = computed(() => {
	const { common, onlyLeft, onlyRight } = entryOverlap.value;
	const { cramersV, rows, columns } = association.value;
	return [
		{
			label: t("Comparison.common-entries"),
			value: common,
			detail: t("Comparison.only-left-right", {
				left: onlyLeft,
				leftPhenomenon: sidebars.value.left.question,
				right: onlyRight,
				rightPhenomenon: sidebars.value.right.question,
			}),
		},
		{
			label: t("Comparison.cramers-v"),
			tooltip: t("Comparison.cramers-v-tooltip"),
			value:
				cramersV?.toLocaleString(locale.value, {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				}) ?? "–",
			detail:
				cramersV === undefined
					? t("Comparison.cramers-v-unavailable")
					: t(`Comparison.association-${associationStrength(cramersV)}`),
		},
		{
			label: t("Comparison.variants"),
			value: `${String(rows)} → ${String(columns)}`,
			detail: t("Comparison.in-common-entries"),
		},
	];
});

function swapQuestions() {
	sidebars.value = {
		left: sidebars.value.right,
		right: sidebars.value.left,
	};
}
</script>

<template>
	<div class="flex min-h-0">
		<AppSidebar
			v-model:open="sidebars.left.open"
			:active-question="sidebars.left.question"
			:active-variant="sidebars.left.variant"
			side="left"
			map-id="left"
		></AppSidebar>

		<div class="container mx-auto min-w-0 flex flex-col flex-1 px-4 gap-5">
			<div class="flex gap-5 justify-center relative">
				<div class="relative flex flex-1 flex-col gap-5">
					<PhenomenonSelection
						map-id="left"
						:split-mode="true"
						v-model:question="sidebars.left.question"
						v-model:variants="sidebars.left.selectedVariants"
						@match-colors="matchColors('left')"
						@toggle-sidebar="(question, variant) => updateSidebar('left', question, variant)"
					></PhenomenonSelection>
				</div>
				<div class="my-auto">
					<UButton icon="i-lucide-arrow-left-right" size="sm" @click="swapQuestions"></UButton>
				</div>
				<div class="relative flex flex-1 flex-col gap-5">
					<PhenomenonSelection
						map-id="right"
						:split-mode="true"
						v-model:question="sidebars.right.question"
						v-model:variants="sidebars.right.selectedVariants"
						@match-colors="matchColors('right')"
						@toggle-sidebar="(question, variant) => updateSidebar('right', question, variant)"
					></PhenomenonSelection>
				</div>
			</div>
			<div class="flex justify-between relative gap-5">
				<div
					v-for="stat in comparisonStats"
					:key="stat.label"
					class="rounded-lg bg-card p-3.5 border flex-1"
				>
					<div
						class="flex items-center gap-1 uppercase font-semibold text-muted-foreground text-xs"
					>
						{{ stat.label }}
						<UTooltip
							v-if="stat.tooltip"
							:content="{ side: 'top' }"
							:ui="{ content: 'h-auto max-w-72 py-1.5' }"
						>
							<InfoIcon :aria-label="stat.tooltip" class="size-4" tabindex="0"></InfoIcon>
							<template #content>{{ stat.tooltip }}</template>
						</UTooltip>
					</div>
					<div class="uppercase font-bold text-lg">{{ stat.value }}</div>
					<div class="text-xs text-muted-foreground">{{ stat.detail }}</div>
				</div>
			</div>
			<div class="min-w-0 rounded-lg border p-5">
				<div class="mb-1 flex items-center gap-1 text-sm font-semibold text-muted-foreground">
					{{ t("Comparison.variant-flow") }}
					<template v-if="comparisonMatchMode === 'location'">
						<span class="ml-auto uppercase text-xs">Radius</span>
						<USlider
							v-model="comparisonMatchRadius"
							class="w-36"
							color="neutral"
							:max="locationMatchRadius.max"
							:min="locationMatchRadius.min"
							size="xs"
							:step="locationMatchRadius.step"
						/>
						<span class="mr-2 font-normal text-sm"
							>{{ (comparisonMatchRadius / 1000).toFixed(1) }} km</span
						>
					</template>
					<USelect
						v-model="comparisonMatchMode"
						:class="{ 'ml-auto': comparisonMatchMode !== 'location' }"
						:items="comparisonMatchItems"
						size="sm"
						variant="outline"
					/>
				</div>
				<VariantFlowCard
					:data="variantFlowData"
					:left="sidebars.left.question"
					:right="sidebars.right.question"
				></VariantFlowCard>
			</div>
		</div>

		<AppSidebar
			v-model:open="sidebars.right.open"
			:active-question="sidebars.right.question"
			:active-variant="sidebars.right.variant"
			map-id="right"
			side="right"
		></AppSidebar>
	</div>
</template>
