import { booleanContains, point } from "@turf/turf";

import regions from "@/assets/data/dialektregionen-lexat21-optimized.geojson.json";
import _data from "@/assets/data/DWA_Pilot_Variablen.json";

const data = _data.map((entry) => {
	const p = point([Number(entry.Longitude), Number(entry.Latitude)]);
	return {
		...entry,
		region: regions.features.find((region) => booleanContains(region.geometry as never, p))
			?.properties.Dialektregion_Name,
	};
});

const allQuestions = [...new Set(data.map((entry) => entry.Item))];

function filterDataByQuestionAndVariant(question: string, variant?: string) {
	return data
		.filter((entry) => entry.Item === question)
		.map((entry) => ({
			...entry,
			variants: entry.Benennungsvariante.split(";").map((v) => v.trim()),
		}))
		.filter((entry) => !variant || entry.variants.includes(variant));
}

function getValuesForQuestion(question: string) {
	return data
		.filter((entry) => entry.Item === question)
		.flatMap((entry) => entry.Benennungsvariante.split(";"))
		.map((val) => val.trim());
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

function getNotationsForVariant(question: string, variant: string) {
	return filterDataByQuestionAndVariant(question, variant).flatMap((entry) =>
		entry.Variante?.split(";").map((v) => v.trim()),
	);
}

function getRegionalCooccurrencesForVariant(question: string, variant: string) {
	const matchingEntries = filterDataByQuestionAndVariant(question, variant);
	const matchingRegions = new Set(matchingEntries.map((entry) => entry.region));
	const cooccurrences = filterDataByQuestionAndVariant(question)
		.filter((entry) => matchingRegions.has(entry.region))
		.flatMap((entry) => entry.variants)
		.filter((v) => v !== variant);
	return Object.fromEntries(
		[...new Set(cooccurrences)].map((entry) => [
			entry,
			cooccurrences.filter((e) => e === entry).length,
		]),
	);
}

export function useQuestions() {
	return {
		allQuestions,
		getValuesForQuestion,
		countAnswersForQuestion,
		getNotationsForVariant,
		getRegionalCooccurrencesForVariant,
	};
}
