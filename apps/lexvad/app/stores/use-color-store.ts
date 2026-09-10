import { defineStore } from "pinia";

import type { VariantGroup } from "@/composables/use-variant-groups";
import { datasetScopedKey } from "@/utils/dataset";

const DEFAULT_REGION_COLOR = "#adb5bd";

const colorByRegion: Record<string, string> = {
	// Dialektregionen
	Alemannisch: "#070808",
	"Bairisch-Alemannisch": "#495057",
	Westmittelbairisch: "#ced4da",
	Ostmittelbairisch: "#dee2e6",
	Südmittelbairisch: "#adb5bd",
	Südbairisch: "#6c757d",
	// Bundesländer
	Vorarlberg: "#070808",
	Tirol: "#495057",
	Salzburg: "#adb5bd",
	Kärnten: "#6c757d",
	Oberösterreich: "#dee2e6",
	Steiermark: "#ced4da",
	Niederösterreich: "#E9ECEF",
	Burgenland: "#F8F9FA",
	Wien: "#212529",
};

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

	function setDefaultColorsForQuestion(
		datasetId: string,
		question: string,
		variants: Array<string>,
	) {
		colors.value[datasetScopedKey(datasetId, question)] = Object.fromEntries(
			variants.map((v, idx) => [v, palette[idx % palette.length]!]),
		);
	}

	function setColorForVariant(datasetId: string, question: string, variant: string, color: string) {
		if (!colors.value[datasetScopedKey(datasetId, question)])
			colors.value[datasetScopedKey(datasetId, question)] = {
				[variant]: color,
			};
		else colors.value[datasetScopedKey(datasetId, question)]![variant] = color;
	}

	function getColorForVariant(datasetId: string, question: string, variant: string) {
		return colors.value[datasetScopedKey(datasetId, question)]?.[variant];
	}

	function getColorsForQuestion(datasetId: string, question: string) {
		return colors.value[datasetScopedKey(datasetId, question)];
	}

	function getColorForGroup(datasetId: string, question: string, group: VariantGroup) {
		return getColorForVariant(datasetId, question, group.variants[0] ?? "") ?? "";
	}

	function hasQuestion(datasetId: string, question: string) {
		return colors.value[datasetScopedKey(datasetId, question)] !== undefined;
	}

	function getRegionColor(region: string) {
		return colorByRegion[region] ?? DEFAULT_REGION_COLOR;
	}

	return {
		hasQuestion,
		getColorForVariant,
		getColorForGroup,
		getColorsForQuestion,
		setDefaultColorsForQuestion,
		setColorForVariant,
		getRegionColor,
		DEFAULT_REGION_COLOR,
	};
});
