<script lang="ts" setup>
import {
	type MapQueryPosition as MapPosition,
	mapQueryPositions as positions,
} from "@/utils/map-query";
import { type ComparisonMatchMode, locationMatchRadius } from "@/utils/variant-flow";

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

const { variantFlowData } = usePhenomenonComparison(
	comparisonSide("left"),
	comparisonSide("right"),
	comparisonMatchMode,
	comparisonMatchRadius,
);
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

		<div class="container mx-auto min-w-0 flex-1 px-4">
			<div class="flex gap-10 justify-center relative">
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
			<div class="min-w-0 rounded-lg border p-5 mt-5">
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
