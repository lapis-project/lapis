/*
 * watergis/maplibre-gl-export
 * https://github.com/watergis/maplibre-gl-export
 *
 * I used the source code from the above repository. Thanks so much!
 *
 * -----LICENSE------
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

export interface AttributionStyle {
	textSize: number;
	textHaloColor: string;
	textHaloWidth: number;
	textColor: string;
	fallbackTextFont: Array<string>;
}

export interface AttributionOptions {
	style?: AttributionStyle;
	visibility?: "none" | "visible";
	// TODO: top-left and bottom-left have issues of text-max-width setting
	position?: "bottom-right" | "top-right";
}

export interface CirclePaint {
	"circle-radius"?: number;
	"circle-color"?: string;
	"circle-blur"?: number;
	"circle-opacity"?: number;
	"circle-translate"?: Array<number>;
	"circle-translate-anchor"?: "map" | "viewport";
	"circle-stroke-width": number;
	"circle-stroke-color": string;
}

export interface ControlOptions {
	PageSize?: SizeType;
	PageOrientation?: PageOrientationType;
	Format?: FormatType;
	DPI?: number;
	Crosshair?: boolean;
	PrintableArea?: boolean;
	AllowedSizes?: Array<
		"A2" | "A3" | "A4" | "A5" | "A6" | "B2" | "B3" | "B4" | "B5" | "B6" | "LETTER"
	>;
	Filename?: string;
	IncludeLegend?: boolean;
	markerCirclePaint?: CirclePaint;
	attributionOptions?: AttributionOptions;
}

export const DPI = {
	72: 72,
	96: 96,
	200: 200,
	300: 300,
	400: 400,
} as const;
export type DPIType = (typeof DPI)[keyof typeof DPI];

export const Format = {
	JPEG: "jpg",
	PNG: "png",
	SVG: "svg",
} as const;
export type FormatType = (typeof Format)[keyof typeof Format];

export const PageOrientation = {
	Landscape: "landscape",
	Portrait: "portrait",
} as const;
export type PageOrientationType = (typeof PageOrientation)[keyof typeof PageOrientation];

export const Size = {
	// A0, A1, B0, B1 are not working well.
	// A0: [1189, 841],
	// A1: [841, 594],
	LETTER: [279, 216], // 8.5x11 - works
	//TABLOID: [432,279] // 11x17 - not working currently prints to 11.68x8.27 in landscape
	A2: [594, 420],
	A3: [420, 297],
	A4: [297, 210],
	A5: [210, 148],
	A6: [148, 105],
	// B0: [1414, 1000],
	// B1: [1000, 707],
	B2: [707, 500],
	B3: [500, 353],
	B4: [353, 250],
	B5: [250, 176],
	B6: [176, 125],
} as const;
export type SizeType = (typeof Size)[keyof typeof Size];

export interface Translation {
	PageSize: string;
	PageOrientation: string;
	Format: string;
	DPI: string;
	Generate: string;
	LanguageName: string;
	LanguageCode: string;
}

export const Unit = {
	// don't use inch unit. because page size setting is using mm unit.
	in: "in",
	mm: "mm",
} as const;
export type UnitType = (typeof Unit)[keyof typeof Unit];
