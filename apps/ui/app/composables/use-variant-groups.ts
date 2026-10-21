import {
	byGroup,
	byVariant,
	countEntriesByGroup,
	groupDisplayLabel,
	normaliseGroups,
} from "../utils/variant-groups";

export function useVariantGroups() {
	return {
		groupDisplayLabel,
		normaliseGroups,
		byGroup,
		byVariant,
		countEntriesByGroup,
	};
}
