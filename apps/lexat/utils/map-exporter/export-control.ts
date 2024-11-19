/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
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

import type { ControlPosition, IControl, Map as MaplibreMap } from "maplibre-gl";

import MapGenerator from "./map-generator";
import { defaultAttributionOptions, defaultMarkerCirclePaint } from "./map-generator-base";
import PrintableAreaManager from "./printable-area-manager";
import {
	type ControlOptions,
	DPI,
	type DPIType,
	Format,
	type FormatType,
	PageOrientation,
	Size,
	type SizeType,
	Unit,
	type UnitType,
} from "./types";

/**
 * Maplibre GL Export Control.
 * @param {Object} targets - Object of layer.id and title
 */
export default class MaplibreExportControl implements IControl {
	protected controlContainer: HTMLElement | undefined;

	protected exportContainer: HTMLElement | undefined;

	protected printableArea: PrintableAreaManager | undefined;

	protected map?: MaplibreMap;

	protected exportButton: HTMLButtonElement | undefined;

	protected includeLegend = true;

	protected options: ControlOptions = {
		PageSize: Size.A4 as SizeType,
		PageOrientation: PageOrientation.Landscape,
		Format: Format.JPEG,
		DPI: DPI[300],
		PrintableArea: false,
		AllowedSizes: Object.keys(Size) as Array<
			"A2" | "A3" | "A4" | "A5" | "A6" | "B2" | "B3" | "B4" | "B5" | "B6" | "LETTER"
		>,
		Filename: "map",
		markerCirclePaint: defaultMarkerCirclePaint,
		attributionOptions: defaultAttributionOptions,
	};

	protected MAPLIB_CSS_PREFIX = "maplibregl";

	constructor(options: ControlOptions) {
		options.attributionOptions = Object.assign(
			defaultAttributionOptions,
			options.attributionOptions,
		);
		this.options = Object.assign(this.options, options);
		this.onDocumentClick = this.onDocumentClick.bind(this);
	}

	public getDefaultPosition(): ControlPosition {
		const defaultPosition = "top-right";
		return defaultPosition;
	}

	public onAdd(map: MaplibreMap): HTMLElement {
		this.map = map;
		this.controlContainer = document.createElement("div");
		this.controlContainer.classList.add(`${this.MAPLIB_CSS_PREFIX}-ctrl`);
		this.controlContainer.classList.add(`${this.MAPLIB_CSS_PREFIX}-ctrl-group`);
		this.exportContainer = document.createElement("div");
		this.exportContainer.classList.add(`${this.MAPLIB_CSS_PREFIX}-export-list`);
		this.exportButton = document.createElement("button");
		this.exportButton.classList.add(`${this.MAPLIB_CSS_PREFIX}-ctrl-icon`);
		this.exportButton.classList.add(`${this.MAPLIB_CSS_PREFIX}-export-control`);
		this.exportButton.type = "button";
		this.exportButton.addEventListener("click", () => {
			this.exportButton.style.display = "none";
			this.exportContainer.style.display = "block";
			this.togglePrintableArea(true);
		});
		document.addEventListener("click", this.onDocumentClick);
		this.controlContainer.appendChild(this.exportButton);
		this.controlContainer.appendChild(this.exportContainer);

		const table = document.createElement("TABLE");
		table.className = "print-table";

		const sizes = {};
		this.options.AllowedSizes?.forEach((size) => {
			sizes[size] = Size[size];
		});
		const tr1 = this.createSelection(
			sizes,
			"Page Size",
			"page-size",
			this.options.PageSize as [number, number],
			(data: Record<string, unknown>, key) => JSON.stringify(data[key]),
		);
		table.appendChild(tr1);

		const tr2 = this.createSelection(
			PageOrientation,
			"Page Orientation",
			"page-orientation",
			this.options.PageOrientation as string,
			(data: Record<string, unknown>, key) => data[key],
		);
		table.appendChild(tr2);

		const tr3 = this.createSelection(
			Format,
			"Format",
			"format-type",
			this.options.Format as string,
			(data: Record<string, unknown>, key) => data[key],
		);
		table.appendChild(tr3);

		const tr4 = this.createSelection(
			DPI,
			"DPI",
			"dpi-type",
			this.options.DPI!,
			(data: Record<string, unknown>, key) => data[key],
		);
		table.appendChild(tr4);

		const tr5 = this.createCheckboxSelection(
			"Include Legend",
			"include-legend",
			this.options.IncludeLegend!,
		);
		table.appendChild(tr5);

		this.exportContainer.appendChild(table);

		const generateButton = document.createElement("button");
		generateButton.type = "button";
		generateButton.classList.add("generate-button");
		generateButton.textContent = "Generate";
		generateButton.addEventListener("click", () => {
			const pageSize: HTMLSelectElement = document.getElementById(
				"mapbox-gl-export-page-size",
			) as HTMLSelectElement;
			const pageOrientation: HTMLSelectElement = document.getElementById(
				"mapbox-gl-export-page-orientation",
			) as HTMLSelectElement;
			const formatType: HTMLSelectElement = document.getElementById(
				"mapbox-gl-export-format-type",
			) as HTMLSelectElement;
			const dpiType: HTMLSelectElement = document.getElementById(
				"mapbox-gl-export-dpi-type",
			) as HTMLSelectElement;
			const orientValue = pageOrientation.value;
			let pageSizeValue = JSON.parse(pageSize.value) as SizeType;
			if (orientValue === PageOrientation.Portrait) {
				pageSizeValue = pageSizeValue.reverse();
			}
			this.generateMap(
				map,
				pageSizeValue,
				Number(dpiType.value) as DPIType,
				formatType.value as FormatType,
				Unit.mm,
				this.options.Filename,
			);
		});
		this.exportContainer.appendChild(generateButton);

		return this.controlContainer;
	}

	protected generateMap(
		map: MaplibreMap,
		size: SizeType,
		dpi: DPIType,
		format: FormatType,
		unit: UnitType,
		filename?: string,
	) {
		const mapGenerator = new MapGenerator(
			map,
			size,
			dpi,
			format,
			unit,
			filename,
			this.options.markerCirclePaint,
			this.options.attributionOptions,
		);
		mapGenerator.generate(this.includeLegend);
	}

	private createSelection(
		data: Record<string, unknown>,
		title: string,
		type: string,
		defaultValue: number | string | [number, number],
		converter: (data: Record<string, unknown>, key: string) => unknown,
	): HTMLElement {
		const label = document.createElement("label");
		label.textContent = title;

		const content = document.createElement("select");
		content.setAttribute("id", `mapbox-gl-export-${type}`);
		content.style.width = "100%";
		Object.keys(data).forEach((key) => {
			const optionLayout = document.createElement("option");
			optionLayout.setAttribute("value", converter(data, key) as string);
			optionLayout.appendChild(document.createTextNode(key));
			optionLayout.setAttribute("name", type);
			if (defaultValue === data[key]) {
				optionLayout.selected = true;
			}
			content.appendChild(optionLayout);
		});
		content.addEventListener("change", () => {
			this.updatePrintableArea();
		});

		const tr1 = document.createElement("TR");
		const tdLabel = document.createElement("TD");
		const tdContent = document.createElement("TD");
		tdLabel.appendChild(label);
		tdContent.appendChild(content);
		tr1.appendChild(tdLabel);
		tr1.appendChild(tdContent);
		return tr1;
	}

	private createCheckboxSelection(title: string, type: string, defaultValue: boolean): HTMLElement {
		// Create label for the row
		const label = document.createElement("label");
		label.textContent = title;

		// Create the checkbox
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.setAttribute("id", `mapbox-gl-export-${type}`);
		checkbox.checked = defaultValue;

		// Add change event listener
		checkbox.addEventListener("change", () => {
			this.includeLegend = checkbox.checked;
		});

		// Create table row with label and checkbox
		const tr = document.createElement("TR");
		const tdLabel = document.createElement("TD");
		const tdContent = document.createElement("TD");

		tdLabel.appendChild(label);
		tdContent.appendChild(checkbox);
		tr.appendChild(tdLabel);
		tr.appendChild(tdContent);

		return tr;
	}

	public onRemove(): void {
		if (!this.controlContainer?.parentNode || !this.map || !this.exportButton) {
			return;
		}
		this.exportButton.removeEventListener("click", this.onDocumentClick);
		this.controlContainer.parentNode.removeChild(this.controlContainer);
		document.removeEventListener("click", this.onDocumentClick);

		if (this.printableArea !== undefined) {
			this.printableArea.destroy();
			this.printableArea = undefined;
		}

		this.map = undefined;
	}

	private onDocumentClick(event: MouseEvent): void {
		if (
			this.controlContainer &&
			!this.controlContainer.contains(event.target as Element) &&
			this.exportContainer &&
			this.exportButton
		) {
			this.exportContainer.style.display = "none";
			this.exportButton.style.display = "block";
			this.togglePrintableArea(false);
		}
	}

	private togglePrintableArea(state: boolean) {
		if (this.options.PrintableArea === true) {
			if (!state) {
				if (this.printableArea !== undefined) {
					this.printableArea.destroy();
					this.printableArea = undefined;
				}
			} else {
				this.printableArea = new PrintableAreaManager(this.map);
				this.updatePrintableArea();
			}
		}
	}

	private updatePrintableArea() {
		if (this.printableArea === undefined) {
			return;
		}
		const pageSize: HTMLSelectElement = document.getElementById(
			"mapbox-gl-export-page-size",
		) as HTMLSelectElement;
		const pageOrientation: HTMLSelectElement = document.getElementById(
			"mapbox-gl-export-page-orientation",
		) as HTMLSelectElement;
		const orientValue = pageOrientation.value;
		let pageSizeValue = JSON.parse(pageSize.value) as SizeType;
		if (orientValue === PageOrientation.Portrait) {
			pageSizeValue = pageSizeValue.reverse();
		}
		this.printableArea.updateArea(pageSizeValue[0], pageSizeValue[1]);
	}
}
