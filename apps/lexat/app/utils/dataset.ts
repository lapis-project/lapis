import type { Coalesce, SurveyResponse } from "@/types/feature-collection";

/** One uploaded answer; informantId may repeat across answers and phenomena. */
export interface DatasetEntry {
	iddoc: number;
	informantId: string;
	Item: string;
	Benennungsvariante: string;
	Latitude: string;
	Longitude: string;
	Ort: string;
	PLZ?: string;
	Kreis?: string;
	Land?: string;
	Variante?: string;
	age: string;
	gender: string;
	register: string;
}

export function datasetQuestions(entries: Array<DatasetEntry>) {
	return [...new Set(entries.map((entry) => entry.Item))].map((label, index) => ({
		id: index + 1,
		value: String(index + 1),
		label,
	}));
}

/** Custom links always resolve within their own dataset, with a deterministic default. */
export function resolveDatasetQuestion(
	questions: ReturnType<typeof datasetQuestions>,
	questionId: unknown,
) {
	return questions.find((question) => question.value === questionId) ?? questions[0];
}

/** Adapt flat answers to the location/informant structure used throughout the LexAT map. */
export function datasetResponses(
	entries: Array<DatasetEntry>,
	item: string,
): Array<SurveyResponse> {
	const places = new Map<string, SurveyResponse>();
	const informants = new Map<string, Coalesce>();
	for (const entry of entries) {
		if (entry.Item !== item) continue;
		const placeKey = JSON.stringify([entry.PLZ, entry.Ort, entry.Latitude, entry.Longitude]);
		let place = places.get(placeKey);
		if (!place) {
			place = {
				id: placeKey,
				place_name: entry.Ort,
				plz: Number(entry.PLZ) || 0,
				lat: Number(entry.Latitude),
				lon: Number(entry.Longitude),
				informants: [],
			};
			places.set(placeKey, place);
		}
		const informantKey = JSON.stringify([placeKey, entry.informantId, entry.age, entry.gender]);
		let informant = informants.get(informantKey);
		if (!informant) {
			informant = {
				informant_id: informants.size + 1,
				age: entry.age,
				gender: entry.gender,
				answers: [],
			};
			informants.set(informantKey, informant);
			place.informants.push(informant);
		}
		for (const annotation of entry.Benennungsvariante.split(";")
			.map((value) => value.trim())
			.filter(Boolean)) {
			informant.answers.push({
				annotation,
				response: entry.Variante ?? annotation,
				phenomenon: item,
				variety: entry.register,
			});
		}
	}
	return [...places.values()];
}

/** Missing ages remain visible in the unfiltered map without inventing demographic data. */
export function matchesDatasetAge(age: string, min: number, max: number) {
	if (min === 0 && max === 100) return true;
	const match = /^(\d+)(?:\s*[-–]\s*(\d+))?$/.exec(age.trim());
	if (!match) return false;
	return Number(match[1]) >= min && Number(match[2] ?? match[1]) < max;
}
