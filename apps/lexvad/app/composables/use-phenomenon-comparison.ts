import type { VariantGroup } from "#layers/ui/app/utils/variant-groups";
import {
	type ComparisonMatchMode,
	countVariantFlow,
	locationMatchRadius,
	type MatchedEntry,
	matchKey,
} from "@/utils/variant-flow";

interface ComparisonSide {
	question: string;
	groups: Array<VariantGroup>;
	colors: Record<string, string>;
	datasetId: string;
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
	matchBy: MaybeRefOrGetter<ComparisonMatchMode> = "id",
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
	): Array<MatchedEntry> {
		const ids = byVariant(side.groups, (group) => group.id);
		return filter(
			side.question,
			side.groups.flatMap((group) => group.variants),
		).flatMap((entry) => {
			const key = matchKey(entry, mode);
			if (key === undefined) return [];
			return [{ key, groups: new Set(entry.variants.map((variant) => ids[variant] ?? variant)) }];
		});
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

		const leftNodes = flowNodes(l);
		const rightNodes = flowNodes(r);

		return countVariantFlow(
			groupedEntries(l, filterLeft, mode),
			groupedEntries(r, filterRight, mode),
			mode,
			toValue(matchRadius),
		).map(({ source, target, value }) => ({
			source: leftNodes[source] ?? { id: source, label: source },
			target: rightNodes[target] ?? { id: target, label: target },
			value,
		}));
	});

	return { variantFlowData };
}
