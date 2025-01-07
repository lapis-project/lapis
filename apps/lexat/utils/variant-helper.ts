import type { SurveyResponse } from "@/types/feature-collection";

export const countUniqueVariants = (points: Array<SurveyResponse>) => {
	const annoCounts = new Map<string, number>();

	points.forEach((p) => {
		p.coalesce.forEach((property) => {
			property.answers.forEach((answer) => {
				const anno = answer.annotation;
				if (annoCounts.has(anno)) {
					annoCounts.set(anno, annoCounts.get(anno)! + 1);
				} else {
					annoCounts.set(anno, 1);
				}
			});
		});
	});

	return annoCounts;
};

export const getSortedVariants = (
	variants: Map<string, number>,
	specialSortOrder?: Record<string, number>,
) => {
	// Convert the Map entries to an array
	const unsortedVariants = Array.from(variants.entries()).map(([anno, count]) => ({ anno, count }));

	// Apply special sort order if provided
	const sortedVariants = unsortedVariants.sort((a, b) => {
		// If special order exists, use it to sort
		if (specialSortOrder) {
			const aSpecialOrder = specialSortOrder[a.anno] ?? 0;
			const bSpecialOrder = specialSortOrder[b.anno] ?? 0;

			// First, sort by the special order if it exists
			if (aSpecialOrder !== bSpecialOrder) {
				return bSpecialOrder - aSpecialOrder; // Higher special order first
			}
		}

		// If special orders are equal, sort by the count in descending order
		return b.count - a.count;
	});

	return sortedVariants;
};
