import { assert } from "@acdh-oeaw/lib";
import { defineStore } from "pinia";

export const useColorStore = defineStore("colors", () => {
	const palette = [
		"#1F77B4",
		"#AEC7E8",
		"#FF7F0E",
		"#FFBB78",
		"#2CA02C",
		"#98DF8A",
		"#D62728",
		"#FF9896",
		"#9467BD",
		"#C5B0D5",
		"#8C564B",
		"#C49C94",
		"#E377C2",
		"#F7B6D2",
		"#797F7F",
		"#C7C7C7",
		"#BCBD22",
		"#DBDB8D",
		"#17BECF",
		"#9EDAE5",
	];

	const colors = ref<Record<string, Record<string, string>>>({});

	function setDefaultColorsForQuestion(question: string, variants: Array<string>) {
		if (!(question in colors.value)) colors.value[question] = {};
		assert(colors.value[question] !== undefined);
		variants.forEach((v, idx) => {
			colors.value[question]![v] = palette[idx % palette.length]!;
		});
	}

	function getColorForVariant(question: string, variant: string) {
		return colors.value[question]?.[variant];
	}

	function getColorsForQuestion(question: string) {
		return colors.value[question];
	}

	function hasQuestion(question: string) {
		return question in colors.value && colors.value[question] !== undefined;
	}

	return {
		hasQuestion,
		getColorForVariant,
		getColorsForQuestion,
		setDefaultColorsForQuestion,
	};
});
