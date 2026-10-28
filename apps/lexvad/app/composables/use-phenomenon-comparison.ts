import { distance } from "@turf/turf";

import type { VariantGroup } from "#layers/ui/app/utils/variant-groups";
import type { LocatedEntry } from "@/utils/dataset";

interface ComparisonSide {
	question: string;
	groups: Array<VariantGroup>;
	colors: Record<string, string>;
	datasetId: string;
}

/** How answers on both sides are paired: by document id or by place. */
export type ComparisonMatchMode = "iddoc" | "location";

type MatchKey = string;

const LOCATION_PRECISION = 3;

function matchKey(entry: LocatedEntry, mode: ComparisonMatchMode): MatchKey {
	if (mode === "iddoc") return String(entry.iddoc);
	return [entry.Latitude, entry.Longitude]
		.map((value) => Number(value).toFixed(LOCATION_PRECISION))
		.join(",");
}

// in metres; 0 only matches places with the same (rounded) coordinates
export const locationMatchRadius = { default: 0, min: 0, max: 20000, step: 500 } as const;

const METRES_PER_DEGREE_LATITUDE = 111_320;

function coordinates(key: MatchKey): [number, number] {
	const [lat = 0, lon = 0] = key.split(",").map(Number);
	return [lon, lat];
}

/** Right-hand keys each left-hand key is matched with, computed lazily and cached per run. */
function createNeighbours(
	mode: ComparisonMatchMode,
	radius: number,
	rightKeys: Array<MatchKey>,
): (key: MatchKey) => Array<MatchKey> {
	if (mode === "iddoc" || radius <= 0) return (key) => [key];
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

export interface VariantFlowNode {
	id: string;
	label: string;
	color?: string;
}

export interface VariantFlowLink {
	source: VariantFlowNode;
	target: VariantFlowNode;
	value: number;
}

export function usePhenomenonComparison(
	left: MaybeRefOrGetter<ComparisonSide>,
	right: MaybeRefOrGetter<ComparisonSide>,
	matchBy: MaybeRefOrGetter<ComparisonMatchMode> = "iddoc",
	/** Only used when matching by location. */
	matchRadius: MaybeRefOrGetter<number> = locationMatchRadius.default,
) {
	const { byGroup, byVariant, groupDisplayLabel } = useVariantGroups();
	const { filterDataByQuestionAndVariant: filterLeft } = useQuestions(
		() => toValue(left).datasetId,
	);
	const { filterDataByQuestionAndVariant: filterRight } = useQuestions(
		() => toValue(right).datasetId,
	);

	function groupedEntries(
		side: ComparisonSide,
		filter: typeof filterLeft,
		mode: ComparisonMatchMode,
	): Array<{ key: MatchKey; groups: Set<string> }> {
		const ids = byVariant(side.groups, (group) => group.id);
		return filter(
			side.question,
			side.groups.flatMap((group) => group.variants),
		).map((entry) => ({
			key: matchKey(entry, mode),
			groups: new Set(entry.variants.map((variant) => ids[variant] ?? variant)),
		}));
	}

	function flowNodes(side: ComparisonSide): Record<string, VariantFlowNode> {
		return byGroup(side.groups, (group) => ({
			id: group.id,
			label: groupDisplayLabel(group),
			color: side.colors[group.variants[0] ?? ""] || undefined,
		}));
	}

	const variantFlowData = computed<Array<VariantFlowLink>>(() => {
		const l = toValue(left);
		const r = toValue(right);
		if (!l.question || !r.question) return [];
		const mode = toValue(matchBy);

		const rightGroupsByKey = new Map<MatchKey, Array<string>>();
		groupedEntries(r, filterRight, mode).forEach((entry) => {
			const groups = rightGroupsByKey.get(entry.key) ?? [];
			groups.push(...entry.groups);
			rightGroupsByKey.set(entry.key, groups);
		});

		const keysByLeftGroup = new Map<string, Set<MatchKey>>();
		groupedEntries(l, filterLeft, mode).forEach((entry) => {
			entry.groups.forEach((group) => {
				const keys = keysByLeftGroup.get(group) ?? new Set();
				keys.add(entry.key);
				keysByLeftGroup.set(group, keys);
			});
		});

		const neighbours = createNeighbours(mode, toValue(matchRadius), [...rightGroupsByKey.keys()]);
		const leftNodes = flowNodes(l);
		const rightNodes = flowNodes(r);

		return [...keysByLeftGroup.entries()].flatMap(([source, keys]) => {
			const matchedKeys = new Set([...keys].flatMap(neighbours));
			const counts = new Map<string, number>();
			matchedKeys.forEach((key) => {
				rightGroupsByKey.get(key)?.forEach((target) => {
					counts.set(target, (counts.get(target) ?? 0) + 1);
				});
			});
			return [...counts.entries()].map(([target, value]) => ({
				source: leftNodes[source] ?? { id: source, label: source },
				target: rightNodes[target] ?? { id: target, label: target },
				value,
			}));
		});
	});

	return { variantFlowData };
}
