// assets/data/static-data.ts

import type { TranslateFn } from "@/composables/use-translations";
import type { DropdownOption } from "@/types/dropdown-option";

export const stateCapitalsList = [
	"Wien",
	"St. Pölten",
	"Graz",
	"Linz",
	"Innsbruck",
	"Klagenfurt",
	"Salzburg",
	"Bregenz",
	"Eisenstadt",
];

// https://medium.com/@go2garret/free-basemap-tiles-for-maplibre-18374fab60cb
export const basemapOptions: Array<DropdownOption> = [
	{
		label: "OpenStreetMaps",
		value:
			"https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/openStreetMap.json",
	},
	{
		label: "Light-themed (Positron)",
		value: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
	},
	{
		label: "Detailed street map (Voyager)",
		value: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
	},
	{
		label: "Dark-themed (Dark Matter)",
		value: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
	},
	// {
	// 	label: "Hypsometry (ICGC)",
	// 	value: "https://geoserveis.icgc.cat/contextmaps/icgc_ombra_hipsometria_corbes.json",
	// },
	{
		label: "Plain white",
		value: "plain",
	},
];

export function getRegisterOptions(t: TranslateFn): Array<DropdownOption> {
	return [
		{
			label: t("MapsPage.selection.register.show-all") || "Alle anzeigen",
			value: "all",
			level: 0,
		},
		{
			label: "Standardsprachliche Register",
			// value: "st",
			value: "1",
			level: 1,
			group: "st",
		},
		{
			label: "Ihr Hochdeutsch",
			// value: "hd",
			value: "4",
			level: 2,
			group: "st",
		},
		{
			label: "Ihr österreichisches Hochdeutsch",
			// value: "oehd",
			value: "5",
			level: 2,
			group: "st",
		},
		{
			label: "Ihr bestes Hochdeutsch",
			// value: "bhd",
			value: "6",
			level: 2,
			group: "st",
		},
		{
			label: "Standardfernere Register",
			// value: "diaf",
			value: "2",
			level: 1,
			group: "dia",
		},
		{
			label: "Dialekt (Mundart)",
			// value: "dia",
			value: "7",
			level: 2,
			group: "dia",
		},
		{
			label: "Umgangssprache (Alltagssprache)",
			// value: "usas",
			value: "8",
			level: 2,
			group: "dia",
		},
	];
}

export const registerGroups = [
	{
		name: "dia",
		values: ["Dialekt (Mundart)", "Umgangssprache (Alltagssprache)"],
	},
	{
		name: "st",
		values: ["Ihr Hochdeutsch", "Ihr bestes Hochdeutsch", "Ihr österreichisches Hochdeutsch"],
	},
];

export const specialOrder = {
	// "keine Angabe": -3, // -3 indicates key to be sorted last
	irrelevant: -2,
	sonstige: -1,
};

export const regions = [
	{
		id: "1740056528195",
		name: "Alemannisch",
		// color: "#070808",
		color: "#6A6B6B", // OPACITY 0.6
	},
	{
		id: "1740056528195",
		name: "Bairisch-Alemannisch",
		// color: "#495057",
		color: "#92969A", // OPACITY 0.6
	},
	{
		id: "1740056528195",
		name: "Südbairisch",
		// color: "#6c757d",
		color: "#A7ACB1", // OPACITY 0.6
	},
	{
		id: "1740056528195",
		name: "Südmittelbairisch",
		// color: "#adb5bd",
		color: "#CED3D7", // OPACITY 0.6
	},
	{
		id: "1740056528195",
		name: "Westmittelbairisch",
		// color: "#ced4da",
		color: "#E2E5E9", // OPACITY 0.6
	},
	{
		id: "1740056528195",
		name: "Ostmittelbairisch",
		// color: "#dee2e6",
		color: "#EBEEF0", // OPACITY 0.6
	},
];
