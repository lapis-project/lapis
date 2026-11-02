import { distance } from "@turf/turf";

import type { LocatedEntry } from "@/utils/dataset";

/** How answers on both sides are paired: by id or by place. */
export type ComparisonMatchMode = "id" | "location";

export type MatchKey = string;

export interface MatchedEntry {
	id: string;
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

function matchedPairs(
	leftKeys: Array<MatchKey>,
	rightKeys: Array<MatchKey>,
	mode: ComparisonMatchMode,
	radius: number,
): Array<[MatchKey, MatchKey]> {
	const known = new Set(rightKeys);
	const neighbours = createNeighbours(mode, radius, rightKeys);
	return leftKeys.flatMap((key) =>
		neighbours(key)
			.filter((neighbour) => known.has(neighbour))
			.map((neighbour): [MatchKey, MatchKey] => [key, neighbour]),
	);
}

function pairWeights(
	left: Array<MatchedEntry>,
	right: Array<MatchedEntry>,
	pairs: Array<[MatchKey, MatchKey]>,
): Array<number> {
	const pairsByEntry = new Map<string, Set<number>>();
	function collect(entries: Array<MatchedEntry>, side: 0 | 1) {
		const pairsByKey = new Map<MatchKey, Array<number>>();
		pairs.forEach((pair, index) => {
			const indices = pairsByKey.get(pair[side]) ?? [];
			indices.push(index);
			pairsByKey.set(pair[side], indices);
		});
		entries.forEach((entry) => {
			const indices = pairsByKey.get(entry.key);
			if (!indices) return;
			const entryPairs = pairsByEntry.get(entry.id) ?? new Set<number>();
			indices.forEach((index) => entryPairs.add(index));
			pairsByEntry.set(entry.id, entryPairs);
		});
	}
	collect(left, 0);
	collect(right, 1);

	const weights = pairs.map(() => 0);
	pairsByEntry.forEach((entryPairs) => {
		entryPairs.forEach((index) => {
			weights[index]! += 1 / entryPairs.size;
		});
	});
	return weights;
}

export function countVariantFlow(
	left: Array<MatchedEntry>,
	right: Array<MatchedEntry>,
	mode: ComparisonMatchMode,
	radius: number = locationMatchRadius.default,
): Array<VariantFlowCount> {
	const leftShares = sharesByKey(left);
	const rightShares = sharesByKey(right);
	const pairs = matchedPairs([...leftShares.keys()], [...rightShares.keys()], mode, radius);
	const entryWeights = pairWeights(left, right, pairs);

	const weights = new Map<string, Map<string, number>>();
	pairs.forEach(([leftKey, rightKey], index) => {
		rightShares.get(rightKey)?.forEach((targetShare, target) => {
			leftShares.get(leftKey)?.forEach((sourceShare, source) => {
				const targets = weights.get(source) ?? new Map<string, number>();
				targets.set(
					target,
					(targets.get(target) ?? 0) + entryWeights[index]! * sourceShare * targetShare,
				);
				weights.set(source, targets);
			});
		});
	});

	return [...weights.entries()].flatMap(([source, targets]) =>
		[...targets.entries()].map(([target, value]) => ({ source, target, value })),
	);
}

export function pairEntries<T>(
	left: Array<T>,
	right: Array<T>,
	keyOf: (entry: T) => MatchKey | undefined,
): Array<{ left: T | undefined; right: T | undefined }> {
	const candidates = new Map<MatchKey, Array<T>>();
	right.forEach((entry) => {
		const key = keyOf(entry);
		if (key !== undefined) candidates.set(key, [...(candidates.get(key) ?? []), entry]);
	});

	const pairs = left.map((entry) => {
		const key = keyOf(entry);
		return { left: entry, right: key === undefined ? undefined : candidates.get(key)?.shift() };
	});
	const paired = new Set(pairs.map((pair) => pair.right));
	return [
		...pairs,
		...right
			.filter((entry) => !paired.has(entry))
			.map((entry) => ({ left: undefined, right: entry })),
	];
}

interface Overlap {
	common: number;
	onlyLeft: number;
	onlyRight: number;
}

export function countEntryOverlap(
	left: Array<MatchedEntry>,
	right: Array<MatchedEntry>,
	mode: ComparisonMatchMode,
	radius: number = locationMatchRadius.default,
): Overlap {
	const pairs = matchedPairs(
		[...new Set(left.map((entry) => entry.key))],
		[...new Set(right.map((entry) => entry.key))],
		mode,
		radius,
	);
	const matchedLeft = new Set(pairs.map(([key]) => key));
	const matchedRight = new Set(pairs.map(([, key]) => key));

	const commonIds = new Set([
		...left.filter((entry) => matchedLeft.has(entry.key)).map((entry) => entry.id),
		...right.filter((entry) => matchedRight.has(entry.key)).map((entry) => entry.id),
	]);
	const countOnly = (entries: Array<MatchedEntry>) =>
		new Set(entries.map((entry) => entry.id).filter((id) => !commonIds.has(id))).size;

	return { common: commonIds.size, onlyLeft: countOnly(left), onlyRight: countOnly(right) };
}

export interface Association {
	/** Undefined unless both sides have at least two groups. */
	cramersV: number | undefined;
	rows: number;
	columns: number;
}

/** Cramér's V: https://en.wikipedia.org/wiki/Cram%C3%A9r%27s_V */
export function variantFlowAssociation(flows: Array<VariantFlowCount>): Association {
	const rowTotals = new Map<string, number>();
	const columnTotals = new Map<string, number>();
	flows.forEach(({ source, target, value }) => {
		rowTotals.set(source, (rowTotals.get(source) ?? 0) + value);
		columnTotals.set(target, (columnTotals.get(target) ?? 0) + value);
	});

	const rows = rowTotals.size;
	const columns = columnTotals.size;
	const degrees = Math.min(rows, columns) - 1;
	if (degrees < 1) return { cramersV: undefined, rows, columns };

	const total = [...rowTotals.values()].reduce((sum, value) => sum + value, 0);
	const phiSquared =
		flows.reduce(
			(sum, { source, target, value }) =>
				sum + (value * value) / (rowTotals.get(source)! * columnTotals.get(target)!),
			0,
		) - 1;
	const cramersV =
		total > 0 ? Math.min(1, Math.sqrt(Math.max(0, phiSquared) / degrees)) : undefined;
	return { cramersV, rows, columns };
}

/** Cohen's conventional thresholds, which strictly apply to tables with one degree of freedom. */
export function associationStrength(cramersV: number): "weak" | "medium" | "strong" {
	if (cramersV < 0.3) return "weak";
	return cramersV < 0.5 ? "medium" : "strong";
}
