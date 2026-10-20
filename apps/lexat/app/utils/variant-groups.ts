export interface VariantGroup {
	id: string;
	label?: string;
	variants: Array<string>;
}

export function groupDisplayLabel(group: VariantGroup) {
	return group.label ?? group.variants.join(" / ");
}

export function normaliseGroups(groups: Array<VariantGroup>, variants: Array<string>) {
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
