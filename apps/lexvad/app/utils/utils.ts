import type { Color } from "@deck.gl/core";

export function hexToRgb(hex: string, alpha = 255): Color {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? [parseInt(result[1]!, 16), parseInt(result[2]!, 16), parseInt(result[3]!, 16), alpha]
		: [0, 0, 0, alpha];
}
