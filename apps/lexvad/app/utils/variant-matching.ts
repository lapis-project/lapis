import type { VariantGroup } from "#layers/ui/app/utils/variant-groups";

/** Minimum similarity (0–1) for two differently spelled variants to count as a match. */
export const VARIANT_MATCH_THRESHOLD = 0.8;

function clean(name: string) {
	return name
		.normalize("NFC")
		.toLowerCase()
		.replaceAll(/[^\p{L}\p{N}\s]/gu, "")
		.replaceAll(/\s+/g, " ")
		.trim();
}

/**
 * Spellings a variant name can stand for. Parentheses mark optional parts, so "Augen(g)lid" covers
 * both "Augenlid" and "Augenglid".
 */
export function variantForms(name: string): Array<string> {
	const forms = new Set([clean(name.replaceAll(/\([^)]*\)/g, "")), clean(name)]);
	forms.delete("");
	return [...forms];
}

function levenshtein(a: string, b: string) {
	let previous = Array.from({ length: b.length + 1 }, (_, idx) => idx);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost);
		}
		previous = current;
	}
	return previous[b.length]!;
}

/** Similarity of two variant names from 0 (unrelated) to 1 (same name). */
export function variantSimilarity(a: string, b: string): number {
	let best = 0;
	variantForms(a).forEach((formA) => {
		variantForms(b).forEach((formB) => {
			const length = Math.max(formA.length, formB.length);
			best = Math.max(best, 1 - levenshtein(formA, formB) / length);
		});
	});
	return best;
}

function groupNames(group: VariantGroup) {
	return group.label === undefined ? group.variants : [group.label, ...group.variants];
}

function groupSimilarity(a: VariantGroup, b: VariantGroup) {
	return Math.max(
		...groupNames(a).flatMap((nameA) =>
			groupNames(b).map((nameB) => variantSimilarity(nameA, nameB)),
		),
	);
}

/**
 * Pairs each target group with at most one source group, preferring the most similar names. Returns
 * the matched source group by target group id.
 */
export function matchVariantGroups(
	targets: Array<VariantGroup>,
	sources: Array<VariantGroup>,
	threshold: number = VARIANT_MATCH_THRESHOLD,
): Map<string, VariantGroup> {
	const candidates = targets
		.flatMap((target) =>
			sources.map((source) => ({ target, source, score: groupSimilarity(target, source) })),
		)
		.filter(({ score }) => score >= threshold)
		.toSorted((a, b) => b.score - a.score);

	const matches = new Map<string, VariantGroup>();
	const usedSources = new Set<string>();
	candidates.forEach(({ target, source }) => {
		if (matches.has(target.id) || usedSources.has(source.id)) return;
		matches.set(target.id, source);
		usedSources.add(source.id);
	});
	return matches;
}

/**
 * Colours for the target groups, keyed by each group's first variant: matched groups take the
 * colour of their source group, the rest get palette colours not taken by a match.
 */
export function matchVariantColors(
	targets: Array<VariantGroup>,
	sources: Array<VariantGroup>,
	sourceColor: (group: VariantGroup) => string,
	palette: Array<string>,
): Record<string, string> {
	const matches = matchVariantGroups(targets, sources);
	const matchedColors = new Map(
		[...matches].map(([targetId, source]) => [targetId, sourceColor(source)]),
	);
	const taken = new Set([...matchedColors.values()].map((color) => color.toLowerCase()));
	const free = palette.filter((color) => !taken.has(color.toLowerCase()));
	const fallback = free.length > 0 ? free : palette;

	let next = 0;
	return Object.fromEntries(
		targets.map((group) => {
			const color = matchedColors.get(group.id) || fallback[next++ % fallback.length]!;
			return [group.variants[0]!, color];
		}),
	);
}
