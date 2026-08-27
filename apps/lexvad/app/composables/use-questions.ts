import { booleanPointInPolygon, point } from "@turf/turf";

import bundeslaender from "@/assets/data/bundeslaender.json";
import regions from "@/assets/data/dialektregionen-lexat21-optimized.geojson.json";
import _data from "@/assets/data/DWA_Pilot_Variablen.json";
import type { VariantGroup } from "@/composables/use-variant-groups";

const _regularData = _data.map((entry) => {
	const p = point([Number(entry.Longitude), Number(entry.Latitude)]);
	return {
		...entry,
		region: regions.features.find((region) => booleanPointInPolygon(p, region.geometry as never))
			?.properties.Dialektregion_Name,
		bundesland: bundeslaender.features.find((region) =>
			booleanPointInPolygon(p, region.geometry as never),
		)?.properties.name,
	};
});

function _createShiftedPointFromEntry(entry: (typeof _data)[0], dLong: number, dLat: number) {
	const clonedEntry = {
		...entry,
		Latitude: String(Number(entry.Latitude) + dLat),
		Longitude: String(Number(entry.Longitude) + dLong),
	};
	const p = point([Number(clonedEntry.Longitude), Number(clonedEntry.Latitude)]);
	return {
		...clonedEntry,
		region: regions.features.find((region) => booleanPointInPolygon(p, region.geometry as never))
			?.properties.Dialektregion_Name,
		bundesland: bundeslaender.features.find((region) =>
			booleanPointInPolygon(p, region.geometry as never),
		)?.properties.name,
	};
}

const _mockData = _data.flatMap((entry) => {
	const shiftedPoints = [_createShiftedPointFromEntry(entry, 0, 0)];
	for (let i = 0; i < 15; i++) {
		const deltaX = 0.5 * (Math.random() - 0.5);
		const deltaY = 0.5 * (Math.random() - 0.5);
		shiftedPoints.push(_createShiftedPointFromEntry(entry, deltaX, deltaY));
	}
	return shiftedPoints.filter((point) => point.region !== undefined);
});

const data = _mockData;

export type PilotDataType = (typeof data)[0];

const allQuestions = [...new Set(data.map((entry) => entry.Item))];
const allRegions = [...new Set(data.map((entry) => entry.region).filter((r) => r !== undefined))];
const allBundeslaender = [
	...new Set(data.map((entry) => entry.bundesland).filter((b) => b !== undefined)),
];

function filterDataByQuestionAndVariant(question: string, variant?: string | Array<string>) {
	return data
		.filter((entry) => entry.Item === question)
		.map((entry) => ({
			...entry,
			variants: entry.Benennungsvariante.split(";")
				.map((v) => v.trim())
				.filter((v) => !variant || (Array.isArray(variant) ? variant : [variant]).includes(v)),
		}))
		.filter((entry) => entry.variants.length > 0);
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

function getNotationsForVariant(question: string, variant: string | Array<string>) {
	return filterDataByQuestionAndVariant(question, variant).flatMap((entry) =>
		entry.Variante?.split(";").map((v) => v.trim()),
	);
}

function getRegionsForVariant(
	question: string,
	variant: string | Array<string>,
	key: "region" | "bundesland",
): Record<string, number> {
	const matchingEntries = filterDataByQuestionAndVariant(question, variant);
	const matchingRegions = matchingEntries.map((entry) => entry[key]).filter((r) => r !== undefined);
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

export function useQuestions() {
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
