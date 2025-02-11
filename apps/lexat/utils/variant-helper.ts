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

interface ProcessedVariant {
	anno: string;
	count: number;
	rawPercentage: number; // exact value (e.g. 12.34)
	floored: number; // Math.floor(rawPercentage)
	remainder: number; // rawPercentage - floored
}

// Utilizes largest remainder method https://www.polyas.com/election-glossary/hare-niemeyer
export const processUniqueVariants = (
	points: Array<SurveyResponse>,
	specialSortOrder?: Record<string, number>,
): Array<{ anno: string; count: number; percentage: string }> => {
	const countedUniqueVariants = countUniqueVariants(points);
	const total = Array.from(countedUniqueVariants.values()).reduce((sum, count) => sum + count, 0);

	// If there are no points, early return.
	if (total === 0) {
		return [];
	}

	const sortedVariants = getSortedVariants(countedUniqueVariants, specialSortOrder);

	// Step 1: Compute the raw percentages and also the floored value
	const processed: Array<ProcessedVariant> = sortedVariants.map(({ anno, count }) => {
		const rawPercentage = (count / total) * 100;
		const floored = Math.floor(rawPercentage);
		const remainder = rawPercentage - floored;
		return { anno, count, rawPercentage, floored, remainder };
	});

	// Step 2: Compute the initial total and the remainder to distribute
	const totalFloored = processed.reduce((sum, variant) => sum + variant.floored, 0);
	let remainderToDistribute = 100 - totalFloored;

	// Step 3: Distribute the remaining percentage points using the largest remainder method
	// Sort by remainder descending. (If equal, preserve the original sorted order)
	const sortedByRemainder = [...processed].sort((a, b) => b.remainder - a.remainder);

	for (const variant of sortedByRemainder) {
		if (remainderToDistribute <= 0) {
			break;
		}
		// Only add if the variant has a nonzero raw percentage
		if (variant.rawPercentage > 0) {
			variant.floored += 1;
			remainderToDistribute--;
		}
	}

	// Step 4: Format the result:
	// If the original raw percentage is > 0 but less than 1, we display "<1".
	// Otherwise, we display the (possibly incremented) floored value.
	return processed.map(({ anno, count, rawPercentage, floored }) => ({
		anno,
		count,
		percentage: rawPercentage > 0 && rawPercentage < 1 ? "<1" : floored.toString(),
	}));
};
