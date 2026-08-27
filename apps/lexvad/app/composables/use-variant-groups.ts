import { defineStore } from "pinia";

export interface VariantGroup {
	id: string;
	label?: string;
	variants: Array<string>;
}

function groupId(variants: Array<string>) {
	return variants.toSorted().map(encodeURIComponent).join(",");
}

function groupDisplayLabel(group: VariantGroup) {
	return group.label ?? group.variants.join(" / ");
}

function normaliseGroups(
	groups: Array<VariantGroup>,
	variants: Array<string>,
): Array<VariantGroup> {
	const known = new Set(variants);
	const scoped = groups
		.map((group) => ({ ...group, variants: group.variants.filter((v) => known.has(v)) }))
		.filter((group) => group.variants.length > 0);
	const grouped = new Set(scoped.flatMap((group) => group.variants));
	const loose = variants
		.filter((variant) => !grouped.has(variant))
		.map((variant) => ({
			variants: [variant],
		}));
	return [...scoped, ...loose].map((group) => ({ ...group, id: groupId(group.variants) }));
}

function byGroup<T>(
	groups: Array<VariantGroup>,
	value: (group: VariantGroup) => T,
): Record<string, T> {
	return Object.fromEntries(groups.map((group) => [group.id, value(group)]));
}

function byVariant<T>(
	groups: Array<VariantGroup>,
	value: (group: VariantGroup) => T,
): Record<string, T> {
	return Object.fromEntries(
		groups.flatMap((group) => {
			const groupValue = value(group);
			return group.variants.map((variant) => [variant, groupValue]);
		}),
	);
}

function countEntriesByGroup(
	entries: Array<{ variants: Array<string> }>,
	groups: Array<VariantGroup>,
): Record<string, number> {
	const ids = byVariant(groups, (group) => group.id);
	const counts: Record<string, number> = {};
	entries.forEach((entry) => {
		const named = new Set(entry.variants.map((variant) => ids[variant] ?? variant));
		named.forEach((id) => {
			counts[id] = (counts[id] ?? 0) + 1;
		});
	});
	return counts;
}

const useVariantGroupStore = defineStore("variantGroups", () => {
	const groupsByMap = ref<Record<string, Record<string, Array<VariantGroup>>>>({});

	/** Empty for a map or question without a grouping, which reads as "nothing is grouped". */
	function getGroupsForMap(mapId: string, question: string) {
		return groupsByMap.value[mapId]?.[question] ?? [];
	}

	function setGroupsForMap(mapId: string, question: string, groups: Array<VariantGroup>) {
		const groupsByQuestion = (groupsByMap.value[mapId] ??= {});
		groupsByQuestion[question] = groups;
	}

	return {
		getGroupsForMap,
		setGroupsForMap,
	};
});

export function useVariantGroups() {
	function groupsForMap(mapId: string, question: () => string) {
		const store = useVariantGroupStore();

		return computed({
			get() {
				return store.getGroupsForMap(mapId, question());
			},
			set(groups: Array<VariantGroup>) {
				store.setGroupsForMap(mapId, question(), groups);
			},
		});
	}

	return {
		groupDisplayLabel,
		normaliseGroups,
		byGroup,
		byVariant,
		countEntriesByGroup,
		groupsForMap,
	};
}
