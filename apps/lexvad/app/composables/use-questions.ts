import { booleanContains, point } from "@turf/turf";

import regions from "@/assets/data/dialektregionen-lexat21-optimized.geojson.json";
import _data from "@/assets/data/DWA_Pilot_Variablen.json";

const _regularData = _data.map((entry) => {
	const p = point([Number(entry.Longitude), Number(entry.Latitude)]);
	return {
		...entry,
		region: regions.features.find((region) => booleanContains(region.geometry as never, p))
			?.properties.Dialektregion_Name,
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
		region: regions.features.find((region) => booleanContains(region.geometry as never, p))
			?.properties.Dialektregion_Name,
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

function getRegionsForVariant(question: string, variant: string): Record<string, number> {
	const matchingEntries = filterDataByQuestionAndVariant(question, variant);
	const matchingRegions = matchingEntries
		.map((entry) => entry.region)
		.filter((r) => r !== undefined);
	return Object.fromEntries(
		[...new Set(matchingRegions)].map((entry) => [
			entry,
			matchingRegions.filter((e) => e === entry).length,
		]),
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

function getVariantsForRegion(question: string, region: string) {
	const matchingEntries = filterDataByQuestionAndVariant(question).filter(
		(entry) => entry.region === region,
	);
	const matchingVariants = matchingEntries.flatMap((entry) => entry.variants);
	return Object.fromEntries(
		[...new Set(matchingVariants)].map((entry) => [
			entry,
			matchingVariants.filter((e) => e === entry).length,
		]),
	);
}

export function useQuestions() {
	return {
		allQuestions,
		allRegions,
		getValuesForQuestion,
		countAnswersForQuestion,
		getNotationsForVariant,
		getRegionsForVariant,
		getRegionalCooccurrencesForVariant,
		getVariantsForRegion,
		filterDataByQuestionAndVariant,
	};
}
