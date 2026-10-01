import type { MapQueryState } from "@/utils/map-query";

export function useMapData(
	mapId: string,
	datasetId: MaybeRefOrGetter<string>,
	question: MaybeRefOrGetter<string>,
	activeVariants: MaybeRefOrGetter<Array<string>>,
) {
	const { setDefaultColorsForQuestion, resetColorsForQuestion, hasQuestion, getColorForGroup } =
		useColorStore();
	const { byVariant, normaliseGroups, groupsForMap } = useVariantGroups();
	const { allQuestions, countAnswersForQuestion, filterDataByQuestionAndVariant } =
		useQuestions(datasetId);

	const uniqueVariants = computed(() =>
		countAnswersForQuestion(toValue(question))
			.map((v) => ({
				anno: v.label,
				value: v.label,
				label: v.label,
				count: v.abs,
			}))
			.toSorted((a, b) => b.count - a.count),
	);

	const storedGroups = groupsForMap(mapId, () => toValue(question));
	const variantGroups = computed(() =>
		normaliseGroups(
			storedGroups.value,
			uniqueVariants.value.map((v) => v.value),
		),
	);

	const variantColors = computed(() =>
		byVariant(variantGroups.value, (group) =>
			getColorForGroup(toValue(datasetId), toValue(question), group),
		),
	);

	function resetColors() {
		resetColorsForQuestion(
			toValue(datasetId),
			toValue(question),
			uniqueVariants.value.map((v) => v.label),
		);
	}

	function ensureColors() {
		if (toValue(question) && !hasQuestion(toValue(datasetId), toValue(question)))
			setDefaultColorsForQuestion(
				toValue(datasetId),
				toValue(question),
				uniqueVariants.value.map((v) => v.label),
			);
	}

	onMounted(ensureColors);

	watch([() => toValue(question), () => toValue(datasetId)], ensureColors);

	const data = computed(() => {
		const selected = toValue(activeVariants);
		const variantsInUse = selected.length ? selected : uniqueVariants.value.map((v) => v.value);
		return filterDataByQuestionAndVariant(toValue(question), variantsInUse).map((entry) => ({
			coordinates: [Number(entry.Longitude), Number(entry.Latitude)] as [number, number],
			color:
				variantColors.value[entry.variants.filter((v) => variantsInUse.includes(v))[0] ?? ""] ?? "",
			name: entry.Ort,
			...entry,
		}));
	});

	return {
		allQuestions,
		data,
		resetColors,
		uniqueVariants,
		variantColors,
		variantGroups,
	};
}

export function restoreMapState(
	mapId: string,
	datasetId: string,
	question: string,
	knownVariants: Array<string>,
	state: MapQueryState,
) {
	const { groupsForMap, normaliseGroups } = useVariantGroups();
	const known = [...new Set(knownVariants)];
	groupsForMap(mapId, () => question).value = normaliseGroups(state.groups, known);
	useColorStore().setCustomColors(
		datasetId,
		question,
		Object.fromEntries(Object.entries(state.colors).filter(([variant]) => known.includes(variant))),
	);
	return state.variants.filter((variant) => known.includes(variant));
}
