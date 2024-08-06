import type { Feature, Geometry, Point, Polygon } from "geojson";

import type { Property, RegionFeature, SurveyResponse } from "@/types/feature-collection";

// import type { EntityFeature } from "@/composables/use-create-entity";

export type GeoJsonFeature = Feature<
	Geometry,
	{
		id: number;
		chartData?: string;
		color?: string;
		colors?: string;
		answerCount?: number;
	}
>;

function countUniqueOccurrences(properties: Array<Property>) {
	const uniqueCounts: Record<string, number> = {};
	properties.forEach((item) => {
		item.answers.forEach((answer) => {
			const anno = answer.anno;
			if (!uniqueCounts[anno]) {
				uniqueCounts[anno] = 0;
			}
			uniqueCounts[anno]++;
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
	const uniqueOccurrenceCounts = countUniqueOccurrences(entity.properties);
	const uniqueColorsArray = Object.keys(uniqueOccurrenceCounts)
		.map((k) => mappedColors[k])
		.join("-");
	return {
		type: "Feature",
		geometry: entity.geometry as Point,
		// properties: {
		// 	_id: entity.properties.name ? entity.properties.name : Date.now().toString(),
		// },
		properties: {
			// properties: entity.properties,
			id: entity.id,
			chartData: generatePercentageString(Object.values(uniqueOccurrenceCounts)),
			colors: uniqueColorsArray,
			answerCount: entity.properties.length,
		},
	};
}

export function createSimpleGeoJsonFeature(entity: RegionFeature): GeoJsonFeature {
	return {
		type: "Feature",
		geometry: entity.geometry as Polygon,
		properties: {
			id: Date.now(),
			color: entity.properties.color,
		},
	};
}
