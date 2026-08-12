import {
	PATTERN_BACKGROUND_OPACITY,
	PATTERN_STROKE_WIDTH,
	type RegionPattern,
} from "@/stores/use-color-store";

/**
 * Atlas pixels per pattern unit. The tiles are defined at SVG scale (4-8 units),
 * which is far too coarse to magnify to the tile sizes used on the map.
 */
export const PATTERN_RESOLUTION = 16;

export interface RegionPatternAtlas {
	/** Data url of the sprite sheet, for `fillPatternAtlas`. */
	url: string;
	/** Pattern id to sprite frame, for `fillPatternMapping`. */
	mapping: Record<string, { x: number; y: number; width: number; height: number }>;
}

/**
 * Rasterises the region patterns into a single sprite sheet, laid out as one row
 * of tiles. deck.gl cannot reference the SVG `<pattern>` defs the charts use, so
 * `FillStyleExtension` gets the same shapes rendered to a canvas instead.
 *
 * Every sprite is surrounded by a one-tile gutter holding the wrapped
 * continuation of the pattern. deck samples the atlas with linear filtering and
 * `clamp-to-edge`, so texels along a frame's edge otherwise blend with whatever
 * sits next to it — which shows up as pale seams along the tile grid, one texel
 * wide in the atlas but many pixels wide once magnified on the map.
 *
 * Browser only — returns `null` when there is no 2d context.
 */
export function createRegionPatternAtlas(
	patterns: Array<RegionPattern>,
): RegionPatternAtlas | null {
	const tiles = patterns.map((pattern) => ({
		pattern,
		width: pattern.w * PATTERN_RESOLUTION,
		height: pattern.h * PATTERN_RESOLUTION,
	}));

	const canvas = document.createElement("canvas");
	// One tile of gutter on each side, hence three tiles per cell.
	canvas.width = tiles.reduce((sum, tile) => sum + tile.width * 3, 0);
	canvas.height = Math.max(...tiles.map((tile) => tile.height * 3));

	const context = canvas.getContext("2d");
	if (!context) return null;

	// Drawn white: `fillPatternMask` keeps only the alpha channel and takes the
	// colour from the layer's `getFillColor`.
	context.fillStyle = "#fff";
	context.strokeStyle = "#fff";

	const mapping: RegionPatternAtlas["mapping"] = {};
	let x = 0;

	for (const { pattern, width, height } of tiles) {
		// The frame deck repeats is the middle tile of the cell.
		mapping[pattern.id] = { x: x + width, y: height, width, height };

		context.save();
		context.beginPath();
		context.rect(x, 0, width * 3, height * 3);
		context.clip();
		context.translate(x + width, height);
		context.scale(PATTERN_RESOLUTION, PATTERN_RESOLUTION);

		// A uniform wash over the whole cell — tiling the per-tile background
		// rects would come out the same.
		context.globalAlpha = PATTERN_BACKGROUND_OPACITY;
		context.fillRect(-pattern.w, -pattern.h, pattern.w * 3, pattern.h * 3);
		context.globalAlpha = 1;

		context.lineWidth = PATTERN_STROKE_WIDTH;
		const shape = pattern.circle ? dotPath() : pattern.path && new Path2D(pattern.path);
		if (shape) {
			for (const offsetX of [-pattern.w, 0, pattern.w]) {
				for (const offsetY of [-pattern.h, 0, pattern.h]) {
					context.save();
					context.translate(offsetX, offsetY);
					if (pattern.circle) context.fill(shape);
					else context.stroke(shape);
					context.restore();
				}
			}
		}

		context.restore();
		x += width * 3;
	}

	return { url: canvas.toDataURL(), mapping };
}

function dotPath() {
	const path = new Path2D();
	path.arc(1, 1, 1, 0, 2 * Math.PI);
	return path;
}
