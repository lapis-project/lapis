import type { Feature, Geometry, Polygon } from "geojson";

import type { Coalesce, RegionFeature, SurveyResponse } from "@/types/feature-collection";
import { getSortedVariants } from "@/utils/variant-helper";

export type GeoJsonFeature = Feature<
	Geometry,
	{
		id: string;
		chartData?: string;
		color?: string;
		colors?: string;
		answerCount?: number;
		name?: string;
		zoomFactor?: number;
	}
>;

function countUniqueOccurrences(coalesce: Array<Coalesce>) {
	const uniqueCounts = new Map<string, number>();
	coalesce.forEach((item) => {
		item.answers.forEach((answer) => {
			const anno = answer.annotation;
			if (!uniqueCounts.has(anno)) {
				uniqueCounts.set(anno, 0);
			}

			uniqueCounts.set(anno, uniqueCounts.get(anno)! + 1);
		});
	});

	return uniqueCounts;
}

function calculatePercentages(numbers: Array<number>): Array<number> {
	const total = numbers.reduce((acc, num) => acc + num, 0);
	const percentages = numbers.map((num) => Math.round((num / total) * 100));
	return percentages;
}

function generatePercentageString(numbers: Array<number>): string {
	const percentages = calculatePercentages(numbers);
	return percentages.join("-");
}

export function createGeoJsonFeature(
	entity: SurveyResponse,
	mappedColors: Record<string, string>,
): GeoJsonFeature {
	const uniqueOccurrenceCounts = countUniqueOccurrences(entity.coalesce);
	const sortedVariants = getSortedVariants(uniqueOccurrenceCounts);
	const uniqueColorsArray = sortedVariants.map((k) => mappedColors[k.anno]).join("-");
	const answerCount = entity.coalesce.reduce((count, obj) => {
		return count + obj.answers.length;
	}, 0);
	return {
		type: "Feature",
		geometry: { type: "Point", coordinates: [entity.lon, entity.lat] },
		properties: {
			id: entity.id,
			chartData: generatePercentageString(sortedVariants.map((v) => v.count)),
			colors: uniqueColorsArray,
			answerCount,
		},
	};
}

export function createSimpleGeoJsonFeature(entity: RegionFeature): GeoJsonFeature {
	return {
		type: "Feature",
		geometry: entity.geometry as Polygon,
		properties: {
			id: Date.now().toString(),
			color: entity.properties.color,
			name: entity.properties.name,
		},
	};
}

export function createOutlineGeoJsonFeature(entity: RegionFeature): GeoJsonFeature {
	return {
		type: "Feature",
		geometry: entity.geometry as Polygon,
		properties: {
			id: Date.now().toString(),
			name: entity.properties.objektart,
		},
	};
}
