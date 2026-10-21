export interface VariantGroup {
	id: string;
	label?: string;
	variants: Array<string>;
}

export function groupDisplayLabel(group: VariantGroup) {
	return group.label ?? group.variants.join(" / ");
}

export function normaliseGroups(
	groups: Array<Omit<VariantGroup, "id">>,
	variants: Array<string>,
): Array<VariantGroup> {
	const available = new Set(variants);
	const scoped = groups
		.map((group) => ({
			...group,
			variants: group.variants.filter((variant) => available.delete(variant)),
		}))
		.filter((group) => group.variants.length > 0);
	return [...scoped, ...[...available].map((variant) => ({ variants: [variant] }))].map(
		(group) => ({
			...group,
			id: group.variants.toSorted().map(encodeURIComponent).join(","),
		}),
	);
}

export function byGroup<T>(
	groups: Array<VariantGroup>,
	value: (group: VariantGroup) => T,
): Record<string, T> {
	return Object.fromEntries(groups.map((group) => [group.id, value(group)]));
}

export function byVariant<T>(
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

export function countEntriesByGroup(
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
