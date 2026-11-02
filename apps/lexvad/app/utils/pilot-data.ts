import pilotVariables from "@/assets/data/DWA_Pilot_Variablen.json";
import { type DataEntry, locateEntry } from "@/utils/dataset";

export const PILOT_DATASET_ID = "dwa-pilot";

function shiftEntry(entry: DataEntry, dLong: number, dLat: number): DataEntry {
	return {
		...entry,
		Latitude: String(Number(entry.Latitude) + dLat),
		Longitude: String(Number(entry.Longitude) + dLong),
	};
}

/** Seeded so server and client scatter the points alike — `Math.random()` breaks hydration. */
function createRandom(seed: number) {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function hashString(value: string) {
	let hash = 0;
	for (const char of value) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
	return hash;
}

export const pilotEntries = (pilotVariables as Array<DataEntry>)
	.flatMap((entry) => {
		const random = createRandom(hashString(`${entry.Latitude},${entry.Longitude}`));
		const id = String(entry.iddoc);
		return [
			{ ...entry, Id: id },
			...Array.from({ length: 15 }, (_, copy) => ({
				...shiftEntry(entry, 0.5 * (random() - 0.5), 0.5 * (random() - 0.5)),
				Id: `${id}-${String(copy + 1)}`,
			})),
		];
	})
	.map((entry) => locateEntry(entry))
	.filter((entry) => entry.region !== undefined);
