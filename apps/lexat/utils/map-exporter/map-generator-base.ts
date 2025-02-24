/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-floating-promises */
/*
 * watergis/maplibre-gl-export
 * https://github.com/watergis/maplibre-gl-export
 * mpetroff/print-maps
 * https://github.com/mpetroff/print-maps
 *
 * I used the source code from the above repositories. Thanks so much!
 *
 * -----LICENSE------
 * Print Maps - High-resolution maps in the browser, for printing
 * Copyright (c) 2015-2020 Matthew Petroff
 *
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

import html2canvas from "html2canvas";
import type {
	Map as MaplibreMap,
	PointLike,
	SourceSpecification,
	StyleSpecification,
	SymbolLayerSpecification,
} from "maplibre-gl";

import {
	type AttributionOptions,
	type CirclePaint,
	type DPIType,
	Format,
	type FormatType,
	Size,
	type SizeType,
	Unit,
	type UnitType,
} from "./types";

export const defaultMarkerCirclePaint: CirclePaint = {
	"circle-radius": 8,
	"circle-color": "red",
	"circle-stroke-width": 1,
	"circle-stroke-color": "black",
};

export const defaultAttributionOptions: AttributionOptions = {
	style: {
		textSize: 14,
		textHaloColor: "#FFFFFF",
		textHaloWidth: 0.8,
		textColor: "#000000",
		fallbackTextFont: ["Open Sans Regular"],
	},
	visibility: "visible",
	position: "bottom-right",
};

export abstract class MapGeneratorBase {
	protected map: MaplibreMap;

	protected width: number;

	protected height: number;

	protected dpi: number;

	protected format: FormatType;

	protected unit: UnitType;

	protected fileName: string;

	protected markerClassName: string;

	protected markerCirclePaint: CirclePaint;

	protected attributionClassName: string;

	protected attributionOptions: AttributionOptions;

	/**
	 * Constructor
	 * @param map MaplibreMap object
	 * @param size layout size. default is A4
	 * @param dpi dpi value. deafult is 300
	 * @param format image format. default is PNG
	 * @param unit length unit. default is mm
	 * @param fileName file name. default is 'map'
	 */
	constructor(
		map: MaplibreMap,
		size: SizeType = Size.A4,
		dpi: DPIType = 300,
		format: FormatType = Format.PNG,
		unit: UnitType = Unit.mm,
		fileName = "map",
		markerClassName = "maplibregl-marker",
		markerCirclePaint = defaultMarkerCirclePaint,
		attributionClassName = "maplibregl-ctrl-attrib-inner",
		attributionOptions = defaultAttributionOptions,
	) {
		this.map = map;
		this.width = size[0];
		this.height = size[1];
		this.dpi = dpi;
		this.format = format;
		this.unit = unit;
		this.fileName = fileName;
		this.markerClassName = markerClassName;
		this.markerCirclePaint = markerCirclePaint;
		this.attributionClassName = attributionClassName;
		this.attributionOptions = attributionOptions;
	}

	protected abstract getRenderedMap(container: HTMLElement, style: StyleSpecification): MaplibreMap;

	protected renderMapPost(renderMap: MaplibreMap) {
		return renderMap;
	}

	private getMarkers() {
		return this.map.getCanvasContainer().getElementsByClassName(this.markerClassName);
	}

	protected renderMarkers(renderMap: MaplibreMap) {
		const markers = this.getMarkers();
		for (let i = 0; i < markers.length; i++) {
			const marker = markers.item(i);
			if (!marker) continue;
			const style = marker.getAttribute("style");
			if (!style) continue;
			// eslint-disable-next-line regexp/no-super-linear-backtracking
			const translateRegex = /translate\(([^,]+)px,\s*([^,]+)px\)/;
			const match = translateRegex.exec(style);
			if (!match) continue;
			const translateX = parseInt(match[1]);
			const translateY = parseInt(match[2]);

			const lngLat = this.map.unproject([translateX, translateY]);

			const markerId = `point${i}`;
			renderMap.addSource(markerId, {
				type: "geojson",
				data: {
					type: "Point",
					coordinates: [lngLat.lng, lngLat.lat],
				},
			});

			renderMap.addLayer({
				id: markerId,
				source: markerId,
				type: "circle",
				paint: this.markerCirclePaint,
			});
		}
		return renderMap;
	}

	/**
	 * Generate and download Map image
	 */
	generate(includeLegend: boolean) {
		// eslint-disable-next-line
		const this_ = this;

		const mapCanvas = document.querySelector(".maplibregl-map");

		if (mapCanvas) {
			// Create the overlay div
			const overlay = document.createElement("div");
			overlay.className = "overlay";

			// Create the spinner div
			const spinner = document.createElement("div");
			spinner.className = "spinner";

			// Append the spinner to the overlay
			overlay.appendChild(spinner);

			// Append the overlay to the map canvas parent element
			mapCanvas.appendChild(overlay);
		}

		// Calculate pixel ratio
		const actualPixelRatio: number = window.devicePixelRatio;
		Object.defineProperty(window, "devicePixelRatio", {
			get() {
				return this_.dpi / 96;
			},
		});
		// Create map container
		const hidden = document.createElement("div");
		hidden.className = "hidden-map";
		document.body.appendChild(hidden);
		const container = document.createElement("div");
		container.style.width = this.toPixels(this.width);
		container.style.height = this.toPixels(this.height);
		hidden.appendChild(container);

		const style = this.map.getStyle();

		const sources = style.sources;
		Object.keys(sources).forEach((name) => {
			const src = sources[name];
			Object.keys(src).forEach((key) => {
				// delete properties if value is undefined.
				// for instance, raster-dem might has undefined value in "url" and "bounds"
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				if (!src[key]) delete src[key];
			});
		});

		// Render map
		let renderMap = this.getRenderedMap(container, style);

		this.addLegend(renderMap, includeLegend, "variant").then(() => {
			renderMap.once("idle", () => {
				this.addLegend(renderMap, includeLegend, "region").then(() => {
					renderMap.once("idle", () => {
						const isAttributionAdded = this.addAttributions(renderMap);
						if (isAttributionAdded) {
							renderMap.once("idle", () => {
								renderMap = this.renderMapPost(renderMap);
								const markers = this.getMarkers();
								if (markers.length === 0) {
									this.exportImage(renderMap, hidden, actualPixelRatio);
								} else {
									renderMap = this.renderMarkers(renderMap);
									renderMap.once("idle", () => {
										this.exportImage(renderMap, hidden, actualPixelRatio);
									});
								}
							});
						} else {
							renderMap = this.renderMapPost(renderMap);
							const markers = this.getMarkers();
							if (markers.length === 0) {
								this.exportImage(renderMap, hidden, actualPixelRatio);
							} else {
								renderMap = this.renderMarkers(renderMap);

								renderMap.once("idle", () => {
									this.exportImage(renderMap, hidden, actualPixelRatio);
								});
							}
						}
					});
				});
			});
		});
	}

	private stripHtml(htmlString: string) {
		const tempElement = document.createElement("div");
		tempElement.innerHTML = htmlString;
		return (tempElement.textContent ?? tempElement.innerText) || "";
	}

	/**
	 * Get icon width against exported map size by using fraction rate
	 * @param renderMap Map object
	 * @param fraction adjust icon size by using this fraction rate. Default is 8%
	 * @returns Icon width calculated
	 */
	private getIconWidth(renderMap: MaplibreMap, fraction: number) {
		const containerDiv = renderMap.getContainer();
		const width = parseInt(containerDiv.style.width.replace("px", ""));

		return parseInt(`${width * fraction}`);
	}

	/**
	 * Get element position's pixel values based on selected position setting
	 * @param renderMap Map object
	 * @param position Position of element inserted
	 * @param offset Offset value to adjust position
	 * @returns Pixels [width, height]
	 */
	private getElementPosition(
		renderMap: MaplibreMap,
		position: "bottom-left" | "bottom-right-append" | "bottom-right" | "top-left" | "top-right",
		offset = 0,
	) {
		const containerDiv = renderMap.getContainer();
		let width = 0;
		let height = 0;

		switch (position) {
			case "top-left":
				width = 0 + offset;
				height = 0 + offset;
				break;
			case "top-right":
				width = parseInt(containerDiv.style.width.replace("px", "")) - offset;
				height = 0 + offset;
				break;
			case "bottom-left":
				width = 0 + offset;
				height = parseInt(containerDiv.style.height.replace("px", "")) - offset;
				break;
			case "bottom-right":
				width = parseInt(containerDiv.style.width.replace("px", "")) - offset;
				height = parseInt(containerDiv.style.height.replace("px", "")) - offset;
				break;
			case "bottom-right-append":
				width = parseInt(containerDiv.style.width.replace("px", "")) - 8;
				height = parseInt(containerDiv.style.height.replace("px", "")) - offset;
				break;
			default:
				break;
		}

		const pixels = [width, height] as PointLike;
		return pixels;
	}

	private addAttributions(renderMap: MaplibreMap) {
		const glyphs = this.map.getStyle().glyphs;
		// skip if glyphs is not available in style.
		if (!glyphs) return false;

		const containerDiv = renderMap.getContainer();
		const elementPosition = this.attributionOptions.position ?? "bottom-right";
		const pixels = this.getElementPosition(renderMap, elementPosition, 8);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const width = pixels[0];
		const lngLat = renderMap.unproject(pixels);

		const attrElements = containerDiv.getElementsByClassName(this.attributionClassName);
		const attributions: Array<string> = [];
		if (attrElements.length > 0) {
			// try getting attribution from html elements
			const attrs = attrElements.item(0);
			if (attrs) {
				for (let i = 0; i < attrs.children.length; i++) {
					const child = attrs.children.item(i);
					if (!child) continue;
					attributions.push(this.stripHtml(child.outerHTML));
				}
			}
		} else {
			// if not, try to make attribution from style
			const sources = this.map.getStyle().sources;
			Object.keys(sources).forEach((key) => {
				const src: SourceSpecification = sources[key]!;
				if ("attribution" in src) {
					const attribution = src.attribution!;
					attributions.push(this.stripHtml(attribution));
				}
			});
		}

		if (attributions.length === 0) return false;

		const attributionText = attributions.join(" | ");

		const attributionId = `attribution`;
		renderMap.addSource(attributionId, {
			type: "geojson",
			data: {
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [lngLat.lng, lngLat.lat],
				},
				properties: {
					attribution: attributionText,
				},
			},
		});

		const fontLayers = this.map
			.getStyle()
			.layers.filter(
				(l) => l.type === "symbol" && l.layout && "text-font" in l.layout,
			) as Array<SymbolLayerSpecification>;
		const font: Array<string> | undefined =
			fontLayers.length > 0 && fontLayers[0].layout
				? (fontLayers[0].layout["text-font"] as Array<string>)
				: this.attributionOptions.style?.fallbackTextFont;

		let visibility: "none" | "visible" = this.attributionOptions.visibility ?? "visible";
		if (renderMap.getZoom() < 2 && this.width > this.height) {
			// if zoom level is less than 2, it will appear twice.
			visibility = "none";
		}

		const attrStyle = this.attributionOptions.style!;
		renderMap.addLayer({
			id: attributionId,
			source: attributionId,
			type: "symbol",
			layout: {
				"text-field": ["get", "attribution"],
				"text-font": font,

				"text-max-width": parseInt(`${width / attrStyle.textSize}`),
				"text-anchor": elementPosition,
				"text-justify": ["top-right", "bottom-right"].includes(elementPosition) ? "right" : "left",
				"text-size": attrStyle.textSize,
				"text-allow-overlap": true,
				visibility: visibility,
			},
			paint: {
				"text-halo-color": attrStyle.textHaloColor,
				"text-halo-width": attrStyle.textHaloWidth,
				"text-color": attrStyle.textColor,
			},
		});

		return true;
	}

	/**
	 * Add HTMLElement with ID "legend" to map object
	 * @param renderMap Map object
	 * @returns void
	 */
	private addLegend(renderMap: MaplibreMap, includeLegend: boolean, mode: "variant" | "region") {
		if (!includeLegend) {
			return Promise.resolve();
		}

		// Determine which element and settings to use based on mode
		const elementId = mode === "variant" ? "variantLegend" : "regionLegend";
		const legendElement = document.getElementById(elementId);
		if (!legendElement) {
			console.error(`Element with ID "${elementId}" not found`);
			return Promise.resolve();
		}

		// Define position and offset based on mode
		const elementPosition = mode === "variant" ? "bottom-right-append" : "bottom-left";
		const offset = mode === "variant" ? 40 : 8;

		// Capture the element with html2canvas
		return new Promise<void>((resolve) => {
			html2canvas(legendElement, {
				useCORS: true, // Enable CORS support
				allowTaint: true, // Allow cross-origin images
				scrollX: 0, // Adjust if capturing a scrolled element
				scrollY: 0, // Adjust if capturing a scrolled element
				scale: 3, // Capture at a higher scale for better resolution
			}).then((canvas) => {
				const imageDataUrl = canvas.toDataURL("image/png");
				renderMap.loadImage(imageDataUrl).then((image) => {
					// Determine the position for the legend image on the map
					const pixels = this.getElementPosition(renderMap, elementPosition, offset);
					const lngLat = renderMap.unproject(pixels);

					// Use the mode to define the image name
					const imageName = elementId;
					renderMap.addImage(imageName, image.data, { pixelRatio: 3 });

					// Add a geojson source for the point
					const sourceId = `${mode}-single-point`;
					renderMap.addSource(sourceId, {
						type: "geojson",
						data: {
							type: "FeatureCollection",
							features: [
								{
									type: "Feature",
									geometry: {
										type: "Point",
										coordinates: [lngLat.lng, lngLat.lat],
									},
								},
							],
						},
					});

					// Add a symbol layer to display the legend image
					renderMap.addLayer({
						id: `${mode}-legend-layer`,
						type: "symbol",
						source: sourceId,
						layout: {
							"icon-image": imageName,
							"icon-size": 1,
							"icon-anchor": mode === "variant" ? "bottom-right" : "bottom-left",
							"icon-allow-overlap": true,
							"icon-ignore-placement": true,
						},
					});
					resolve();
				});
			});
		});
	}

	private exportImage(renderMap: MaplibreMap, hiddenDiv: HTMLElement, actualPixelRatio: number) {
		const canvas = renderMap.getCanvas();

		const fileName = `${this.fileName}.${this.format}`;
		switch (this.format) {
			case Format.PNG:
				this.toPNG(canvas, fileName);
				break;
			case Format.JPEG:
				this.toJPEG(canvas, fileName);
				break;
			case Format.SVG:
				this.toSVG(canvas, fileName);
				break;
			default:
				console.error(`Invalid file format: ${this.format}`);
				break;
		}

		renderMap.remove();
		hiddenDiv.parentNode?.removeChild(hiddenDiv);
		Object.defineProperty(window, "devicePixelRatio", {
			get() {
				return actualPixelRatio;
			},
		});
		hiddenDiv.remove();

		const overlay = document.querySelector(".overlay");
		if (overlay?.parentNode) {
			overlay.parentNode.removeChild(overlay);
		}
	}

	/**
	 * Convert canvas to PNG
	 * @param canvas Canvas element
	 * @param fileName file name
	 */
	private toPNG(canvas: HTMLCanvasElement, fileName: string) {
		const a = document.createElement("a");
		a.href = canvas.toDataURL();
		a.download = fileName;
		a.click();
		a.remove();
	}

	/**
	 * Convert canvas to JPEG
	 * @param canvas Canvas element
	 * @param fileName file name
	 */
	private toJPEG(canvas: HTMLCanvasElement, fileName: string) {
		const uri = canvas.toDataURL("image/jpeg", 0.85);
		const a = document.createElement("a");
		a.href = uri;
		a.download = fileName;
		a.click();
		a.remove();
	}

	/**
	 * Convert canvas to SVG
	 * @param canvas Canvas element
	 * @param fileName file name
	 */
	private toSVG(canvas: HTMLCanvasElement, fileName: string) {
		const uri = canvas.toDataURL("image/png");

		const pxWidth = Number(this.toPixels(this.width, this.dpi).replace("px", ""));
		const pxHeight = Number(this.toPixels(this.height, this.dpi).replace("px", ""));

		const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      version="1.1"
      width="${pxWidth}"
      height="${pxHeight}"
      viewBox="0 0 ${pxWidth} ${pxHeight}"
      xml:space="preserve">
        <image style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;"
      xlink:href="${uri}" width="${pxWidth}" height="${pxHeight}"></image>
    </svg>`;

		const a = document.createElement("a");
		a.href = `data:application/xml,${encodeURIComponent(svg)}`;
		a.download = fileName;
		a.click();
		a.remove();
	}

	/**
	 * Convert mm/inch to pixel
	 * @param length mm/inch length
	 * @param conversionFactor DPI value. default is 96.
	 */
	private toPixels(length: number, conversionFactor = 96) {
		let pixels = conversionFactor;
		if (this.unit === Unit.mm) {
			pixels /= 25.4;
		}
		return `${pixels * length}px`;
	}
}
