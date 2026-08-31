import { booleanPointInPolygon, point } from "@turf/turf";

import bundeslaender from "@/assets/data/bundeslaender.json";
import regions from "@/assets/data/dialektregionen-lexat21-optimized.geojson.json";

export interface DataEntry {
	iddoc: number | string;
	PLZ?: number | string;
	Ort: string;
	Kreis?: string;
	Land?: string;
	Latitude: string;
	Longitude: string;
	Item: string;
	Variante?: string;
	Benennungsvariante: string;
}

export type LocatedEntry = DataEntry & { region?: string; bundesland?: string };

export function locateEntry<T extends DataEntry>(entry: T): T & LocatedEntry {
	const p = point([Number(entry.Longitude), Number(entry.Latitude)]);
	return {
		...entry,
		region: regions.features.find((region) => booleanPointInPolygon(p, region.geometry as never))
			?.properties.Dialektregion_Name,
		bundesland: bundeslaender.features.find((region) =>
			booleanPointInPolygon(p, region.geometry as never),
		)?.properties.name,
	};
}

export function datasetScopedKey(datasetId: string, question: string) {
	return `${datasetId}::${question}`;
}
