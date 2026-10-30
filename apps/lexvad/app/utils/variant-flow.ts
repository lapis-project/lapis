import { distance } from "@turf/turf";

import type { LocatedEntry } from "@/utils/dataset";

/** How answers on both sides are paired: by id or by place. */
export type ComparisonMatchMode = "id" | "location";

export type MatchKey = string;

export interface MatchedEntry {
	key: MatchKey;
	groups: Set<string>;
}

export interface VariantFlowCount {
	source: string;
	target: string;
	value: number;
}

const LOCATION_PRECISION = 3;

export function matchKey(entry: LocatedEntry, mode: ComparisonMatchMode): MatchKey | undefined {
	if (mode === "id") return entry.Id;
	return [entry.Latitude, entry.Longitude]
		.map((value) => Number(value).toFixed(LOCATION_PRECISION))
		.join(",");
}

// in metres
export const locationMatchRadius = { default: 0, min: 0, max: 20000, step: 500 } as const;

const METRES_PER_DEGREE_LATITUDE = 111_320;

function coordinates(key: MatchKey): [number, number] {
	const [lat = 0, lon = 0] = key.split(",").map(Number);
	return [lon, lat];
}

function createNeighbours(
	mode: ComparisonMatchMode,
	radius: number,
	rightKeys: Array<MatchKey>,
): (key: MatchKey) => Array<MatchKey> {
	if (mode === "id" || radius <= 0) return (key) => [key];
	const places = rightKeys.map((key) => ({ key, coordinates: coordinates(key) }));
	const cache = new Map<MatchKey, Array<MatchKey>>();
	return (key) => {
		let neighbours = cache.get(key);
		if (!neighbours) {
			const origin = coordinates(key);
			neighbours = places
				.filter(
					(place) =>
						// Cheap latitude check before the exact great-circle distance.
						Math.abs(place.coordinates[1] - origin[1]) * METRES_PER_DEGREE_LATITUDE <= radius &&
						distance(origin, place.coordinates, { units: "meters" }) <= radius,
				)
				.map((place) => place.key);
			cache.set(key, neighbours);
		}
		return neighbours;
	};
}

function sharesByKey(entries: Array<MatchedEntry>): Map<MatchKey, Map<string, number>> {
	const counts = new Map<MatchKey, Map<string, number>>();
	entries.forEach((entry) => {
		const groups = counts.get(entry.key) ?? new Map<string, number>();
		entry.groups.forEach((group) => groups.set(group, (groups.get(group) ?? 0) + 1));
		counts.set(entry.key, groups);
	});
	counts.forEach((groups) => {
		const total = [...groups.values()].reduce((sum, count) => sum + count, 0);
		groups.forEach((count, group) => groups.set(group, count / total));
	});
	return counts;
}

export function countVariantFlow(
	left: Array<MatchedEntry>,
	right: Array<MatchedEntry>,
	mode: ComparisonMatchMode,
	radius: number = locationMatchRadius.default,
): Array<VariantFlowCount> {
	const leftShares = sharesByKey(left);
	const rightShares = sharesByKey(right);
	const neighbours = createNeighbours(mode, radius, [...rightShares.keys()]);

	const weights = new Map<string, Map<string, number>>();
	leftShares.forEach((sources, key) => {
		neighbours(key).forEach((neighbour) => {
			rightShares.get(neighbour)?.forEach((targetShare, target) => {
				sources.forEach((sourceShare, source) => {
					const targets = weights.get(source) ?? new Map<string, number>();
					targets.set(target, (targets.get(target) ?? 0) + sourceShare * targetShare);
					weights.set(source, targets);
				});
			});
		});
	});

	return [...weights.entries()].flatMap(([source, targets]) =>
		[...targets.entries()].map(([target, value]) => ({ source, target, value })),
	);
}
