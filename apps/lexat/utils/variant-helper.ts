import type { SurveyResponse } from "@/types/feature-collection";

export const countUniqueVariants = (points: Array<SurveyResponse>) => {
	const annoCounts = new Map<string, number>();

	points.forEach((p) => {
		p.properties.forEach((property) => {
			property.answers.forEach((answer) => {
				const anno = answer.anno;
				if (annoCounts.has(anno)) {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					annoCounts.set(anno, annoCounts.get(anno)! + 1);
				} else {
					annoCounts.set(anno, 1);
				}
			});
		});
	});

	return annoCounts;
};

export const getSortedVariants = (variants: Map<string, number>, specialSortOrder = {}) => {
	const unsortedVariants = variants;

	// Apply special sort order if provided
	for (const [key, value] of Object.entries(specialSortOrder)) {
		if (unsortedVariants.has(key)) {
			unsortedVariants.set(key, value as number);
		}
	}

	// Convert the Map entries to an array and sort it by count in descending order
	const sortedVariants = Array.from(unsortedVariants.entries())
		.sort((a, b) => b[1] - a[1])
		.map((entry) => ({ anno: entry[0], count: entry[1] }));

	return sortedVariants;
};
