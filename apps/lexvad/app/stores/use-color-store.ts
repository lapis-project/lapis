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

export type ColorPaletteId = "tableau20" | "tableauColorBlind" | "okabeIto";

interface ColorPalette {
	id: ColorPaletteId;
	name: string;
	colors: Array<string>;
}

export const colorPalettes: Array<ColorPalette> = [
	{
		id: "tableau20",
		name: "Tableau 20",
		colors: [
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
		],
	},
	{
		id: "tableauColorBlind",
		name: "Tableau Color Blind",
		colors: [
			"#006BA4",
			"#FF800E",
			"#ABABAB",
			"#595959",
			"#5F9ED1",
			"#C85200",
			"#898989",
			"#A2C8EC",
			"#FFBC79",
			"#CFCFCF",
		],
	},
	{
		id: "okabeIto",
		name: "Okabe–Ito",
		colors: [
			"#E69F00",
			"#56B4E9",
			"#009E73",
			"#F0E442",
			"#0072B2",
			"#D55E00",
			"#CC79A7",
			"#000000",
		],
	},
];

export const useColorStore = defineStore("colors", () => {
	const activePaletteId = ref<ColorPaletteId>(colorPalettes[0]!.id);

	const palette = computed(
		() =>
			colorPalettes.find((entry) => entry.id === activePaletteId.value)?.colors ??
			colorPalettes[0]!.colors,
	);

	function paletteColors(variants: Array<string>) {
		return Object.fromEntries(
			variants.map((variant, idx) => [variant, palette.value[idx % palette.value.length]!]),
		);
	}

	const colors = ref<Record<string, Record<string, string>>>({});

	function setDefaultColorsForQuestion(
		datasetId: string,
		question: string,
		variants: Array<string>,
	) {
		colors.value[datasetScopedKey(datasetId, question)] = paletteColors(variants);
	}

	function setPalette(id: ColorPaletteId) {
		activePaletteId.value = id;
		Object.entries(colors.value).forEach(([key, colorsByVariant]) => {
			colors.value[key] = paletteColors(Object.keys(colorsByVariant));
		});
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
		activePaletteId,
		setPalette,
		getColorForVariant,
		getColorForGroup,
		getColorsForQuestion,
		setDefaultColorsForQuestion,
		setColorForVariant,
		getRegionColor,
		DEFAULT_REGION_COLOR,
	};
});
