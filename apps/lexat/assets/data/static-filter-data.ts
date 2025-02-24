// assets/data/static-data.ts

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

export const registerOptions: Array<DropdownOption> = [
	{
		label: "Show All",
		value: "all",
		level: 0,
	},
	{
		label: "Standardsprachliche Register",
		value: "st",
		level: 1,
		group: "st",
	},
	{
		label: "Ihr Hochdeutsch",
		value: "hd",
		level: 2,
		group: "st",
	},
	{
		label: "Ihr österreichisches Hochdeutsch",
		value: "oehd",
		level: 2,
		group: "st",
	},
	{
		label: "Ihr bestes Hochdeutsch",
		value: "bhd",
		level: 2,
		group: "st",
	},
	{
		label: "Standardfernere Register",
		value: "diaf",
		level: 1,
		group: "dia",
	},
	{
		label: "Dialekt (Mundart)",
		value: "dia",
		level: 2,
		group: "dia",
	},
	{
		label: "Umgangssprache oder Alltagssprache",
		value: "usas",
		level: 2,
		group: "dia",
	},
];

export const registerGroups = [
	{
		name: "dia",
		values: ["Dialekt (Mundart)", "Umgangssprache oder Alltagssprache"],
	},
	{
		name: "st",
		values: ["Ihr Hochdeutsch", "Ihr bestes Hochdeutsch", "Ihr österreichisches Hochdeutsch"],
	},
];

export const specialOrder = {
	// "keine Angabe": -3, // -3 indicates key to be sorted last
	Irrelevant: -2,
	Sonstige: -1,
};

export const regions = [
	{
		id: "1740056528195",
		name: "Alemannisch",
		color: "#212529",
	},
	{
		id: "1740056528195",
		name: "Bairisch-Alemannisch",
		color: "#495057",
	},
	{
		id: "1740056528195",
		name: "Südbairisch",
		color: "#6c757d",
	},
	{
		id: "1740056528195",
		name: "Südmittelbairisch",
		color: "#adb5bd",
	},
	{
		id: "1740056528195",
		name: "Westmittelbairisch",
		color: "#ced4da",
	},
	{
		id: "1740056528195",
		name: "Ostmittelbairisch",
		color: "#dee2e6",
	},
];
