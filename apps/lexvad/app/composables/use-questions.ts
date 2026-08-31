import type { VariantGroup } from "@/composables/use-variant-groups";
import type { LocatedEntry } from "@/utils/dataset";

function splitVariants(value: string) {
	return value.split(";").map((variant) => variant.trim());
}

export function useQuestions(datasetId: MaybeRefOrGetter<string>) {
	const datasetStore = useDatasetStore();

	const data = computed(() => datasetStore.entriesFor(toValue(datasetId)));

	function uniqueValues(select: (entry: LocatedEntry) => string | undefined) {
		return computed(() => [...new Set(data.value.map(select).filter((v) => v !== undefined))]);
	}

	const allQuestions = uniqueValues((entry) => entry.Item);
	const allRegions = uniqueValues((entry) => entry.region);
	const allBundeslaender = uniqueValues((entry) => entry.bundesland);

	function entriesForQuestion(question: string) {
		return data.value.filter((entry) => entry.Item === question);
	}

	function filterDataByQuestionAndVariant(question: string, variant?: string | Array<string>) {
		return entriesForQuestion(question)
			.map((entry) => ({
				...entry,
				variants: splitVariants(entry.Benennungsvariante).filter(
					(v) => !variant || (Array.isArray(variant) ? variant : [variant]).includes(v),
				),
			}))
			.filter((entry) => entry.variants.length > 0);
	}

	function getValuesForQuestion(question: string) {
		return entriesForQuestion(question).flatMap((entry) => splitVariants(entry.Benennungsvariante));
	}

	function countAnswersForQuestion(question: string) {
		const allAnswers = getValuesForQuestion(question);
		const countAnswers = [...new Set(allAnswers)].map((answer) => {
			const filteredAnswers = allAnswers.filter((a) => a === answer);
			return {
				abs: filteredAnswers.length,
				rel: filteredAnswers.length / allAnswers.length,
				label: answer,
			};
		});
		return countAnswers;
	}

	function getNotationsForVariant(question: string, variant: string | Array<string>) {
		return filterDataByQuestionAndVariant(question, variant).flatMap((entry) =>
			splitVariants(entry.Variante ?? ""),
		);
	}

	function getRegionsForVariant(
		question: string,
		variant: string | Array<string>,
		key: "region" | "bundesland",
	): Record<string, number> {
		const matchingEntries = filterDataByQuestionAndVariant(question, variant);
		const matchingRegions = matchingEntries
			.map((entry) => entry[key])
			.filter((r) => r !== undefined);
		return Object.fromEntries(
			[...new Set(matchingRegions)].map((entry) => [
				entry,
				matchingRegions.filter((e) => e === entry).length,
			]),
		);
	}

	function countAnswersForGroups(question: string, groups: Array<VariantGroup>) {
		const { countEntriesByGroup } = useVariantGroups();
		return countEntriesByGroup(filterDataByQuestionAndVariant(question), groups);
	}

	function getRegionalCooccurrencesForVariant(
		question: string,
		variant: string | Array<string>,
		key: "region" | "bundesland",
		groups: Array<VariantGroup>,
	) {
		const { countEntriesByGroup } = useVariantGroups();
		const variants = Array.isArray(variant) ? variant : [variant];
		const matchingEntries = filterDataByQuestionAndVariant(question, variants);
		const matchingRegions = new Set(matchingEntries.map((entry) => entry[key]));
		const cooccurrences = filterDataByQuestionAndVariant(question)
			.filter((entry) => matchingRegions.has(entry[key]))
			.map((entry) => ({ variants: entry.variants.filter((v) => !variants.includes(v)) }));
		return countEntriesByGroup(cooccurrences, groups);
	}

	function getVariantsForRegion(
		question: string,
		region: string,
		key: "region" | "bundesland",
		groups: Array<VariantGroup>,
	) {
		const { countEntriesByGroup } = useVariantGroups();
		const matchingEntries = filterDataByQuestionAndVariant(question).filter(
			(entry) => entry[key] === region,
		);
		return countEntriesByGroup(matchingEntries, groups);
	}

	return {
		allQuestions,
		allRegions,
		allBundeslaender,
		getValuesForQuestion,
		countAnswersForQuestion,
		countAnswersForGroups,
		getNotationsForVariant,
		getRegionsForVariant,
		getRegionalCooccurrencesForVariant,
		getVariantsForRegion,
		filterDataByQuestionAndVariant,
	};
}
