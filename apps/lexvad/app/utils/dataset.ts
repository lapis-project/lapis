import { booleanPointInPolygon, point } from "@turf/turf";

import bundeslaender from "#layers/ui/app/assets/data/bundeslaender.json";
import regions from "#layers/ui/app/assets/data/dialektregionen-lexat21-optimized.geojson.json";

export interface DataEntry {
	iddoc: number | string;
	Id?: string;
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

type Location = Pick<LocatedEntry, "region" | "bundesland">;

const locations = new Map<string, Location>();

function locate(longitude: string, latitude: string): Location {
	const key = `${longitude},${latitude}`;
	let location = locations.get(key);
	if (!location) {
		const p = point([Number(longitude), Number(latitude)]);
		location = {
			region: regions.features.find((region) => booleanPointInPolygon(p, region.geometry as never))
				?.properties.Dialektregion_Name,
			bundesland: bundeslaender.features.find((region) =>
				booleanPointInPolygon(p, region.geometry as never),
			)?.properties.name,
		};
		locations.set(key, location);
	}
	return location;
}

export function locateEntry<T extends DataEntry>(entry: T): T & LocatedEntry {
	return { ...entry, ...locate(entry.Longitude, entry.Latitude) };
}

export function datasetScopedKey(datasetId: string, question: string) {
	return `${datasetId}::${question}`;
}
