import { assert } from "@acdh-oeaw/lib";
import { defineStore } from "pinia";

export interface RegionPattern {
	id: string;
	/** Tile width and height in user space units. */
	w: number;
	h: number;
	/** Either a stroked path or a dot grid, never both. */
	path?: string;
	circle?: boolean;
	color: string;
}

/** Shared by the SVG `<pattern>` defs and the deck.gl sprite atlas, so both render alike. */
export const PATTERN_BACKGROUND_OPACITY = 0.15;
export const PATTERN_STROKE_WIDTH = 1.2;

export const regionPatterns: Array<RegionPattern> = [
	{
		id: "diag-1",
		w: 4,
		h: 4,
		path: "M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2",
		color: "#bababa",
	},
	{
		id: "diag-2",
		w: 4,
		h: 4,
		path: "M5,-1 l-6,6 M2,6 l6,-6 M-2,2 l4,-4",
		color: "#bababa",
	},
	{ id: "crosshatch", w: 8, h: 8, path: "M0,0 l8,8 M8,0 l-8,8", color: "#aaaaaa" },
	{ id: "vert", w: 4, h: 4, path: "M2,0 l0,4", color: "#9b9b9b" },
	{ id: "horiz", w: 4, h: 4, path: "M0,2 l4,0", color: "#666666" },
	{ id: "grid", w: 8, h: 8, path: "M3,0 l0,6 M0,3 l6,0", color: "#565656" },
	{ id: "zig", w: 6, h: 6, path: "M0,3 l3,-3 l3,3", color: "#9b9b9b" },
	{ id: "wave", w: 8, h: 4, path: "M0,2 q2,-2 4,0 t4,0", color: "#bababa" },
	{ id: "dots", w: 4, h: 4, circle: true, color: "#474747" },
];

const patternsById = new Map(regionPatterns.map((p) => [p.id, p]));

const patternIdByRegion: Record<string, string> = {
	// Dialektregionen
	Alemannisch: "diag-1",
	"Bairisch-Alemannisch": "dots",
	Westmittelbairisch: "crosshatch",
	Ostmittelbairisch: "vert",
	Südmittelbairisch: "horiz",
	Südbairisch: "grid",
	// Bundesländer
	Wien: "dots",
	Vorarlberg: "zig",
	Burgenland: "diag-1",
	Salzburg: "wave",
	Steiermark: "horiz",
	Kärnten: "grid",
	Tirol: "crosshatch",
	Oberösterreich: "dots",
	Niederösterreich: "vert",
};

function hash(value: string) {
	let h = 0;
	for (let i = 0; i < value.length; i++) {
		h = (h * 31 + value.charCodeAt(i)) | 0;
	}
	return Math.abs(h);
}

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

	function getRegionPattern(region: string) {
		const assigned = patternsById.get(patternIdByRegion[region] ?? "");
		return assigned ?? regionPatterns[hash(region) % regionPatterns.length]!;
	}

	function getRegionPatternId(id: string) {
		return `svgPattern-${id}`;
	}

	function getRegionPatternFill(region: string) {
		return `url(#${getRegionPatternId(getRegionPattern(region).id)})`;
	}

	return {
		hasQuestion,
		getColorForVariant,
		getColorsForQuestion,
		setDefaultColorsForQuestion,
		regionPatterns,
		getRegionPattern,
		getRegionPatternId,
		getRegionPatternFill,
	};
});
