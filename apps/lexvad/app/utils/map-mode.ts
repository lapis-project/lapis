export const mapModes = ["point", "voronoi", "hexagon"] as const;

export type MapMode = (typeof mapModes)[number];

export const DEFAULT_MAP_MODE: MapMode = "point";

// in metres
export const hexagonRadius = { default: 10000, min: 3000, max: 20000, step: 500 } as const;

export function clampHexagonRadius(radius: number) {
	const stepped = Math.round(radius / hexagonRadius.step) * hexagonRadius.step;
	return Math.min(hexagonRadius.max, Math.max(hexagonRadius.min, stepped));
}
