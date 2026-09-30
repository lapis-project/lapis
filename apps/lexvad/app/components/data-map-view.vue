<script lang="ts" setup>
import { X } from "@lucide/vue";

import {
	type MapQueryPosition as MapPosition,
	mapQueryKeys,
	mapQueryPositions as positions,
	type MapQueryState,
	parseMapQuery,
	serializeMapQuery,
} from "@/utils/map-query";

interface SidebarState {
	open: boolean;
	question: string;
	variant: string;
	selectedVariants: Array<string>;
}

const t = useTranslations();
const datasetStore = useDatasetStore();
const colorStore = useColorStore();
const { groupsForMap, normaliseGroups } = useVariantGroups();
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
	const datasetId = datasetStore.datasetForMap(position);
	const known = [...new Set(questions[position].getValuesForQuestion(question))];
	groupsForMap(position, () => question).value = normaliseGroups(state.groups, known);
	colorStore.setCustomColors(
		datasetId,
		question,
		Object.fromEntries(Object.entries(state.colors).filter(([variant]) => known.includes(variant))),
	);
	return state.variants.filter((variant) => known.includes(variant));
}

function createSidebarState(position: MapPosition): SidebarState {
	const allQuestions = questions[position].allQuestions.value;
	const urlState = takeUrlState(position);
	const question =
		urlState?.question !== undefined && allQuestions.includes(urlState.question)
			? urlState.question
			: (allQuestions[0] ?? "");
	return {
		open: false,
		question,
		variant: defaultVariant(position, question),
		selectedVariants: urlState ? restoreUrlState(position, urlState, question) : [],
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

function closeSplitMode() {
	splitMode.value = false;
	sidebars.value.right.open = false;
}

positions.forEach((position) => {
	watch(
		() => datasetStore.datasetForMap(position),
		() => {
			sidebars.value[position] = createSidebarState(position);
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
});

watch(
	() => datasetStore.restored,
	() => {
		positions.forEach((position) => {
			const dataset = pendingUrlState[position]?.dataset;
			if (dataset !== undefined && !datasetStore.has(dataset))
				sidebars.value[position] = createSidebarState(position);
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
	const { question, selectedVariants } = sidebars.value[position];
	const dataset = datasetStore.datasetForMap(position);
	return {
		dataset,
		question,
		variants: selectedVariants,
		groups: storedGroups[position].value,
		colors: colorStore.getCustomColors(dataset, question),
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
</script>

<template>
	<div class="flex min-h-0">
		<AppSidebar
			v-if="splitMode"
			v-model:open="sidebars.left.open"
			:active-question="sidebars.left.question"
			:active-variant="sidebars.left.variant"
			side="left"
			map-id="left"
		></AppSidebar>

		<div class="container mx-auto min-w-0 flex-1 px-4">
			<div class="flex gap-5 justify-center relative">
				<SingleMapView
					class="min-w-0 flex-1"
					:split-mode="splitMode"
					@toggle-compare-mode="splitMode = true"
					@toggle-sidebar="(question, variant) => updateSidebar('left', question, variant)"
					v-model:question="sidebars.left.question"
					v-model:variants="sidebars.left.selectedVariants"
					map-id="left"
				/>
				<template v-if="splitMode">
					<div class="divide-accent border-l h-150 self-end"></div>
					<SingleMapView
						class="min-w-0 flex-1"
						:split-mode="splitMode"
						@toggle-sidebar="(question, variant) => updateSidebar('right', question, variant)"
						v-model:question="sidebars.right.question"
						v-model:variants="sidebars.right.selectedVariants"
						map-id="right"
					/>
					<UButton
						class="absolute right-0 top-0 size-6 p-1 m-1 text-muted-foreground"
						variant="ghost"
						@click="closeSplitMode"
					>
						<X></X>
						<span class="sr-only">{{ t("MapsPage.controls.close-split-view") }}</span>
					</UButton>
				</template>
			</div>
		</div>

		<AppSidebar
			v-if="splitMode"
			v-model:open="sidebars.right.open"
			:active-question="sidebars.right.question"
			:active-variant="sidebars.right.variant"
			map-id="right"
			side="right"
		></AppSidebar>
		<AppSidebar
			v-else
			v-model:open="sidebars.left.open"
			:active-question="sidebars.left.question"
			:active-variant="sidebars.left.variant"
			map-id="left"
			side="right"
		></AppSidebar>
	</div>
</template>
