import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import type { Feature, MultiPolygon, Polygon, Position } from "geojson";

import type { VariantGroup } from "#layers/ui/app/utils/variant-groups";
import type { SurveyResponse } from "@/types/feature-collection";

export type DistributionMode = "region" | "bundesland";

export interface InsightAnswer {
	annotation: string;
	response: string;
	variety: string;
	region?: string;
	bundesland?: string;
}

export function locatePoint(
	coordinates: Position,
	boundaries: Array<Feature<Polygon | MultiPolygon>>,
	nameKey: string,
): string | undefined {
	const feature = boundaries.find((boundary) => booleanPointInPolygon(coordinates, boundary));
	const name: unknown = feature?.properties?.[nameKey];
	return typeof name === "string" ? name : undefined;
}

export function surveyAnswers(
	points: Array<SurveyResponse>,
	locate: (point: SurveyResponse) => Partial<Record<DistributionMode, string>>,
): Array<InsightAnswer> {
	return points.flatMap((point) => {
		const location = locate(point);
		return point.informants.flatMap((informant) =>
			informant.answers.map((answer) => ({
				annotation: answer.annotation,
				response: answer.response,
				variety: answer.variety,
				...location,
			})),
		);
	});
}

export function countGroups(answers: Array<InsightAnswer>, groups: Array<VariantGroup>) {
	const ids = new Map(groups.flatMap((group) => group.variants.map((v) => [v, group.id] as const)));
	const counts = new Map<string, number>();
	for (const answer of answers) {
		const id = ids.get(answer.annotation);
		if (id !== undefined) counts.set(id, (counts.get(id) ?? 0) + 1);
	}
	return Object.fromEntries(counts);
}

export function countRegisters(answers: Array<InsightAnswer>) {
	const counts = new Map<string, number>();
	for (const answer of answers) {
		const register = answer.variety.trim();
		counts.set(register, (counts.get(register) ?? 0) + 1);
	}
	return Object.fromEntries(counts);
}

export function countRegions(
	answers: Array<InsightAnswer>,
	variants: Array<string>,
	mode: DistributionMode,
) {
	const selected = new Set(variants);
	const counts = new Map<string, number>();
	for (const answer of answers) {
		const region = answer[mode];
		if (region !== undefined && selected.has(answer.annotation))
			counts.set(region, (counts.get(region) ?? 0) + 1);
	}
	return Object.fromEntries(counts);
}

export function regionalCooccurrences(
	answers: Array<InsightAnswer>,
	variants: Array<string>,
	mode: DistributionMode,
	groups: Array<VariantGroup>,
) {
	const selected = new Set(variants);
	const regions = new Set(
		answers.filter((answer) => selected.has(answer.annotation)).map((answer) => answer[mode]),
	);
	return countGroups(
		answers.filter(
			(answer) =>
				answer[mode] !== undefined && regions.has(answer[mode]) && !selected.has(answer.annotation),
		),
		groups,
	);
}

export function regionalDistributions(
	answers: Array<InsightAnswer>,
	mode: DistributionMode,
	groups: Array<VariantGroup>,
) {
	const regions = new Map<string, Array<InsightAnswer>>();
	for (const answer of answers) {
		const region = answer[mode];
		if (region === undefined) continue;
		const entries = regions.get(region) ?? [];
		entries.push(answer);
		regions.set(region, entries);
	}
	return [...regions]
		.map(([label, entries]) => ({
			label,
			total: entries.length,
			counts: countGroups(entries, groups),
		}))
		.toSorted((a, b) => b.total - a.total);
}
