import type { LocationQuery, LocationQueryRaw } from "vue-router";

import type { VariantGroup } from "@/composables/use-variant-groups";
import { type ColorPaletteId, colorPalettes } from "@/stores/use-color-store";
import {
	clampHexagonRadius,
	DEFAULT_MAP_MODE,
	hexagonRadius,
	type MapMode,
	mapModes,
} from "@/utils/map-mode";
import { PILOT_DATASET_ID } from "@/utils/pilot-data";

export const mapQueryPositions = ["left", "right"] as const;

export type MapQueryPosition = (typeof mapQueryPositions)[number];

export interface MapQueryState {
	dataset: string;
	question?: string;
	variants: Array<string>;
	groups: Array<Omit<VariantGroup, "id">>;
	colors: Record<string, string>;
	mode: MapMode;
	radius: number;
}

export interface MapQuery {
	palette?: ColorPaletteId;
	maps: Partial<Record<MapQueryPosition, MapQueryState>>;
}

const mapKeys = {
	dataset: "dataset",
	question: "q",
	variants: "v",
	groups: "g",
	colors: "c",
	mode: "m",
	radius: "r",
} as const;

const PALETTE_KEY = "p";

function key(position: MapQueryPosition, name: keyof typeof mapKeys) {
	return position === "left" ? mapKeys[name] : `${mapKeys[name]}2`;
}

export const mapQueryKeys = new Set([
	PALETTE_KEY,
	...mapQueryPositions.flatMap((position) =>
		(Object.keys(mapKeys) as Array<keyof typeof mapKeys>).map((name) => key(position, name)),
	),
]);

function values(query: LocationQuery, key: string): Array<string> {
	const value = query[key];
	return (Array.isArray(value) ? value : [value]).filter(
		(entry): entry is string => typeof entry === "string" && entry !== "",
	);
}

function escapePart(value: string) {
	return value.replace(/[%,:]/g, encodeURIComponent);
}

function serializeGroup(group: Omit<VariantGroup, "id">) {
	const variants = group.variants.map(escapePart).join(",");
	return group.label === undefined ? variants : `${escapePart(group.label)}:${variants}`;
}

function parseGroup(value: string): Omit<VariantGroup, "id"> | undefined {
	const separator = value.indexOf(":");
	const label = separator === -1 ? undefined : value.slice(0, separator);
	try {
		return {
			label: label === undefined ? undefined : decodeURIComponent(label),
			variants: value
				.slice(separator + 1)
				.split(",")
				.map((variant) => decodeURIComponent(variant)),
		};
	} catch {
		return undefined;
	}
}

function serializeColor(variant: string, color: string) {
	return `${color.replace(/^#/, "")}:${variant}`;
}

function parseColor(value: string): [string, string] | undefined {
	const match = /^([0-9a-f]{3,8}):(.+)$/is.exec(value);
	return match ? [match[2]!, `#${match[1]!}`] : undefined;
}

function parseRadius(value: string | undefined) {
	const radius = Number(value);
	return value !== undefined && Number.isFinite(radius)
		? clampHexagonRadius(radius)
		: hexagonRadius.default;
}

function parseMap(query: LocationQuery, position: MapQueryPosition): MapQueryState | undefined {
	const has = (name: keyof typeof mapKeys) => values(query, key(position, name)).length > 0;
	if (!(Object.keys(mapKeys) as Array<keyof typeof mapKeys>).some(has)) return undefined;
	return {
		dataset: values(query, key(position, "dataset"))[0] ?? PILOT_DATASET_ID,
		question: values(query, key(position, "question"))[0],
		variants: values(query, key(position, "variants")),
		groups: values(query, key(position, "groups"))
			.map(parseGroup)
			.filter((group) => group !== undefined),
		colors: Object.fromEntries(
			values(query, key(position, "colors"))
				.map(parseColor)
				.filter((color) => color !== undefined),
		),
		mode:
			mapModes.find((mode) => mode === values(query, key(position, "mode"))[0]) ?? DEFAULT_MAP_MODE,
		radius: parseRadius(values(query, key(position, "radius"))[0]),
	};
}

export function parseMapQuery(query: LocationQuery): MapQuery {
	const palette = values(query, PALETTE_KEY)[0];
	return {
		palette: colorPalettes.find((entry) => entry.id === palette)?.id,
		maps: Object.fromEntries(
			mapQueryPositions.map((position) => [position, parseMap(query, position)]),
		),
	};
}

export function serializeMapQuery({ palette, maps }: MapQuery): LocationQueryRaw {
	const query: LocationQueryRaw = {};
	if (palette !== undefined && palette !== colorPalettes[0]!.id) query[PALETTE_KEY] = palette;
	mapQueryPositions.forEach((position) => {
		const state = maps[position];
		if (!state) return;
		if (state.dataset !== PILOT_DATASET_ID) query[key(position, "dataset")] = state.dataset;
		if (state.question) query[key(position, "question")] = state.question;
		if (state.variants.length > 0) query[key(position, "variants")] = state.variants;
		const groups = state.groups.filter((group) => group.variants.length > 1);
		if (groups.length > 0) query[key(position, "groups")] = groups.map(serializeGroup);
		if (state.mode !== DEFAULT_MAP_MODE) query[key(position, "mode")] = state.mode;
		if (state.mode === "hexagon" && state.radius !== hexagonRadius.default)
			query[key(position, "radius")] = String(state.radius);
		const colors = Object.entries(state.colors);
		if (colors.length > 0)
			query[key(position, "colors")] = colors.map(([variant, color]) =>
				serializeColor(variant, color),
			);
	});
	return query;
}
