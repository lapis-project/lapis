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
