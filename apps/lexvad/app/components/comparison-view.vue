<script lang="ts" setup>
import { X } from "@lucide/vue";

import { DEFAULT_MAP_MODE, hexagonRadius, type MapMode } from "@/utils/map-mode";
import {
	type MapQueryPosition as MapPosition,
	mapQueryKeys,
	mapQueryPositions as positions,
	type MapQueryState,
	parseMapQuery,
	serializeMapQuery,
} from "@/utils/map-query";
import { PILOT_DATASET_ID } from "@/utils/pilot-data";
import { type ComparisonMatchMode, locationMatchRadius } from "@/utils/variant-flow";
import { matchVariantColors } from "@/utils/variant-matching";
import { usePhenomenonComparison } from "~/composables/use-phenomenon-comparison";
import type { StoredSelection } from "~/composables/use-phenomenon-selection";

interface SidebarState {
	open: boolean;
	question: string;
	variant: string;
	selectedVariants: Array<string>;
	mode: MapMode;
	radius: number;
}

const t = useTranslations();
const datasetStore = useDatasetStore();
const colorStore = useColorStore();
const { groupsForMap } = useVariantGroupStore();
const { getSelection, setSelection } = usePhenomenonSelection();
const route = useRoute();
const router = useRouter();

const questions: Record<MapPosition, ReturnType<typeof useQuestions>> = {
	left: useQuestions(() => datasetStore.datasetForMap("left")),
	right: useQuestions(() => datasetStore.datasetForMap("right")),
};

const urlQuery = parseMapQuery(route.query);
const pendingUrlState = { ...urlQuery.maps };
if (urlQuery.palette) colorStore.setPalette(urlQuery.palette);
const splitMode = ref(urlQuery.maps.right !== undefined);

function defaultVariant(position: MapPosition, question: string) {
	return questions[position].getValuesForQuestion(question)[0] ?? "";
}

function takeUrlState(position: MapPosition) {
	const state = pendingUrlState[position];
	if (state === undefined) return undefined;
	const missing = datasetStore.restored && !datasetStore.has(state.dataset);
	if (!missing && state.dataset !== datasetStore.datasetForMap(position)) return undefined;
	delete pendingUrlState[position];
	return state;
}

function restoreUrlState(position: MapPosition, state: MapQueryState, question: string) {
	return restoreMapState(
		position,
		datasetStore.datasetForMap(position),
		question,
		questions[position].getValuesForQuestion(question),
		state,
	);
}

function restoreStoredVariants(position: MapPosition, question: string, stored?: StoredSelection) {
	if (stored?.question !== question) return [];
	const known = questions[position].getValuesForQuestion(question);
	return stored.variants.filter((variant) => known.includes(variant));
}

function createSidebarState(position: MapPosition, previous?: SidebarState): SidebarState {
	const allQuestions = questions[position].allQuestions.value;
	const urlState = takeUrlState(position);
	const stored = urlState
		? undefined
		: getSelection(position, datasetStore.datasetForMap(position));
	const requested = urlState?.question ?? stored?.question;
	const question =
		requested !== undefined && allQuestions.includes(requested)
			? requested
			: (allQuestions[0] ?? "");
	return {
		open: false,
		question,
		variant: defaultVariant(position, question),
		selectedVariants: urlState
			? restoreUrlState(position, urlState, question)
			: restoreStoredVariants(position, question, stored),
		mode: urlState?.mode ?? previous?.mode ?? DEFAULT_MAP_MODE,
		radius: urlState?.radius ?? previous?.radius ?? hexagonRadius.default,
	};
}

watchEffect(() => {
	positions.forEach((position) => {
		const dataset = pendingUrlState[position]?.dataset;
		if (dataset !== undefined) datasetStore.setDatasetForMap(position, dataset);
	});
});

const sidebars = ref<Record<MapPosition, SidebarState>>({
	left: createSidebarState("left"),
	right: createSidebarState("right"),
});

function updateSidebar(position: MapPosition, question: string | null, variant?: string) {
	const sidebar = sidebars.value[position];
	const selectedQuestion = question ?? sidebar.question;
	const selectedVariant = variant ?? defaultVariant(position, selectedQuestion);
	if (!sidebar.open) {
		sidebar.question = selectedQuestion;
		sidebar.variant = selectedVariant;
		sidebar.open = true;
		return;
	}
	if (sidebar.question !== selectedQuestion || sidebar.variant !== selectedVariant) {
		sidebar.question = selectedQuestion;
		sidebar.variant = selectedVariant;
		return;
	}
	sidebar.open = false;
}

positions.forEach((position) => {
	watch(
		() => datasetStore.datasetForMap(position),
		() => {
			sidebars.value[position] = createSidebarState(position, sidebars.value[position]);
		},
	);

	watch(
		() => sidebars.value[position].question,
		(question) => {
			const sidebar = sidebars.value[position];
			const known = questions[position].getValuesForQuestion(question);
			sidebar.variant = defaultVariant(position, question);
			sidebar.selectedVariants = sidebar.selectedVariants.filter((v) => known.includes(v));
		},
	);

	watch(
		() => [sidebars.value[position].question, sidebars.value[position].selectedVariants] as const,
		([question, variants]) => {
			setSelection(position, datasetStore.datasetForMap(position), {
				question,
				variants,
			});
		},
		{ deep: true, immediate: true },
	);
});

watch(
	() => datasetStore.restored,
	() => {
		positions.forEach((position) => {
			const dataset = pendingUrlState[position]?.dataset;
			if (dataset !== undefined && !datasetStore.has(dataset))
				sidebars.value[position] = createSidebarState(position, sidebars.value[position]);
		});
	},
);

const storedGroups = Object.fromEntries(
	positions.map((position) => [
		position,
		groupsForMap(position, () => sidebars.value[position].question),
	]),
) as Record<MapPosition, ReturnType<typeof groupsForMap>>;

function currentState(position: MapPosition): MapQueryState {
	const { question, selectedVariants, mode, radius } = sidebars.value[position];
	const dataset = datasetStore.datasetForMap(position);
	return {
		dataset,
		question,
		variants: selectedVariants,
		groups: storedGroups[position].value,
		colors: colorStore.getCustomColors(dataset, question),
		mode,
		radius,
	};
}

const currentQuery = computed(() =>
	serializeMapQuery({
		palette: colorStore.activePaletteId,
		maps: {
			left: currentState("left"),
			right: splitMode.value ? currentState("right") : undefined,
		},
	}),
);

onMounted(() => {
	watch(
		currentQuery,
		(query) => {
			const unrelated = Object.entries(route.query).filter(([key]) => !mapQueryKeys.has(key));
			void router.replace({ query: { ...Object.fromEntries(unrelated), ...query } });
		},
		{ immediate: true },
	);
});

function allVariants(position: MapPosition) {
	return [...new Set(questions[position].getValuesForQuestion(sidebars.value[position].question))];
}

const activeVariants = computed(
	() =>
		Object.fromEntries(
			positions.map((position) => {
				const { selectedVariants } = sidebars.value[position];
				return [position, selectedVariants.length > 0 ? selectedVariants : allVariants(position)];
			}),
		) as Record<MapPosition, Array<string>>,
);

const { byVariant, normaliseGroups } = useVariantGroups();

function allGroups(position: MapPosition) {
	return normaliseGroups(storedGroups[position].value, allVariants(position));
}

function matchColors(position: MapPosition) {
	const other = position === "left" ? "right" : "left";
	const otherDataset = datasetStore.datasetForMap(other);
	const otherQuestion = sidebars.value[other].question;
	colorStore.setCustomColors(
		datasetStore.datasetForMap(position),
		sidebars.value[position].question,
		matchVariantColors(
			allGroups(position),
			allGroups(other),
			(group) => colorStore.getColorForGroup(otherDataset, otherQuestion, group),
			colorStore.palette,
		),
	);
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
			groups: normaliseGroups(storedGroups[position].value, activeVariants.value[position]),
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
				<div class="relative flex flex-col gap-5">
					<PhenomenonSelection
						map-id="left"
						:split-mode="true"
						v-model:question="sidebars.left.question"
						v-model:variants="sidebars.left.selectedVariants"
						@match-colors="matchColors('left')"
						@toggle-sidebar="(question, variant) => updateSidebar('left', question, variant)"
					></PhenomenonSelection>
				</div>
				<div class="relative flex flex-col gap-5">
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
