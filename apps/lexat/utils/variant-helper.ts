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

export const processUniqueVariants = (
	points: Array<SurveyResponse>,
	specialSortOrder?: Record<string, number>,
) => {
	const countedUniqueVariants = countUniqueVariants(points);
	const total = Array.from(countedUniqueVariants.values()).reduce((sum, count) => sum + count, 0);

	const sortedVariants = getSortedVariants(countedUniqueVariants, specialSortOrder);

	// Step 1: Calculate the raw percentages
	const rawVariants = sortedVariants.map(({ anno, count }) => {
		const percentage = (count / total) * 100;
		return {
			anno,
			percentage,
			count,
			rounded:
				Math.round(percentage) < 1 && percentage > 0 ? "<1" : Math.round(percentage).toString(),
		};
	});

	// Step 2: Calculate the total of the rounded values
	const totalRounded = rawVariants.reduce((sum, { rounded }) => {
		return rounded === "<1" ? sum : sum + parseInt(rounded, 10);
	}, 0);

	// Step 3: Calculate how much is left to distribute
	let remaining = 100 - totalRounded;

	// Step 4: Distribute remaining percentage to ensure total equals 100
	for (let i = 0; i < rawVariants.length && remaining > 0; i++) {
		if (rawVariants[i]?.rounded !== "<1") {
			rawVariants[i].rounded = (parseInt(rawVariants[i].rounded, 10) + 1).toString();
			remaining--;
		}
	}

	// Step 5: If any percentage was <1, we should ensure it shows "<1" instead of 0
	rawVariants.forEach((v) => {
		if (parseInt(v.rounded, 10) === 0 && v.percentage > 0) {
			v.rounded = "<1";
		}
	});

	return rawVariants.map(({ anno, count, rounded }) => ({
		anno,
		count,
		percentage: rounded,
	}));
};
