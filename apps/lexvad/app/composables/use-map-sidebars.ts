import { DEFAULT_MAP_MODE, hexagonRadius, type MapMode } from "@/utils/map-mode";
import {
	type MapQueryPosition as MapPosition,
	mapQueryKeys,
	mapQueryPositions as positions,
	type MapQueryState,
	parseMapQuery,
	serializeMapQuery,
} from "@/utils/map-query";
import { matchVariantColors } from "@/utils/variant-matching";

interface StoredSelection {
	dataset: string;
	question: string;
	variants: Array<string>;
}

interface SidebarState {
	open: boolean;
	question: string;
	variant: string;
	selectedVariants: Array<string>;
	mode: MapMode;
	radius: number;
}

/**
 * State of the left and right map, restored from the URL (or else the last selection) and kept in
 * sync with it. With `split`, both maps are always shown; otherwise the URL decides.
 */
export function useMapSidebars(options: { split?: boolean } = {}) {
	const datasetStore = useDatasetStore();
	const colorStore = useColorStore();
	const { groupsForMap, swapGroups } = useVariantGroupStore();
	// Survives page changes, so the map and comparison views start from the same selection.
	const storedSelections = useState<Partial<Record<MapPosition, StoredSelection>>>(
		"map-selections",
		() => ({}),
	);
	const { normaliseGroups } = useVariantGroups();
	const route = useRoute();
	const router = useRouter();

	const questions: Record<MapPosition, ReturnType<typeof useQuestions>> = {
		left: useQuestions(() => datasetStore.datasetForMap("left")),
		right: useQuestions(() => datasetStore.datasetForMap("right")),
	};

	const urlQuery = parseMapQuery(route.query);
	const pendingUrlState = { ...urlQuery.maps };
	if (urlQuery.palette) colorStore.setPalette(urlQuery.palette);
	const splitMode = ref(options.split ?? urlQuery.maps.right !== undefined);

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

	/** The last selection on this map, as long as it was made on the current dataset. */
	function storedSelection(position: MapPosition) {
		const stored = storedSelections.value[position];
		return stored?.dataset === datasetStore.datasetForMap(position) ? stored : undefined;
	}

	function restoreStoredVariants(
		position: MapPosition,
		question: string,
		stored?: StoredSelection,
	) {
		if (stored?.question !== question) return [];
		const known = questions[position].getValuesForQuestion(question);
		return stored.variants.filter((variant) => known.includes(variant));
	}

	function createSidebarState(position: MapPosition, previous?: SidebarState): SidebarState {
		const allQuestions = questions[position].allQuestions.value;
		const urlState = takeUrlState(position);
		const stored = urlState ? undefined : storedSelection(position);
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
				storedSelections.value[position] = {
					dataset: datasetStore.datasetForMap(position),
					question,
					variants: [...variants],
				};
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
		return [
			...new Set(questions[position].getValuesForQuestion(sidebars.value[position].question)),
		];
	}

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

	function swapMaps() {
		const { left, right } = sidebars.value;
		const leftDataset = datasetStore.datasetForMap("left");
		const rightDataset = datasetStore.datasetForMap("right");
		storedSelections.value = {
			left: {
				dataset: rightDataset,
				question: right.question,
				variants: [...right.selectedVariants],
			},
			right: {
				dataset: leftDataset,
				question: left.question,
				variants: [...left.selectedVariants],
			},
		};
		datasetStore.setDatasetForMap("left", rightDataset);
		datasetStore.setDatasetForMap("right", leftDataset);
		swapGroups("left", "right");
		sidebars.value = { left: right, right: left };
	}

	return {
		allGroups,
		allVariants,
		currentState,
		matchColors,
		sidebars,
		splitMode,
		storedGroups,
		swapMaps,
		updateSidebar,
	};
}
