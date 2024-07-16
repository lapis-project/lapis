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

import { Map as MaplibreMap, type StyleSpecification } from "maplibre-gl";

import {
	defaultAttributionOptions,
	defaultMarkerCirclePaint,
	MapGeneratorBase,
} from "./map-generator-base";
import {
	type DPIType,
	Format,
	type FormatType,
	Size,
	type SizeType,
	Unit,
	type UnitType,
} from "./types";

export default class MapGenerator extends MapGeneratorBase {
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
		markerCirclePaint = defaultMarkerCirclePaint,
		attributionOptions = defaultAttributionOptions,
	) {
		super(
			map,
			size,
			dpi,
			format,
			unit,
			fileName,
			"maplibregl-marker",
			markerCirclePaint,
			"maplibregl-ctrl-attrib-inner",
			attributionOptions,
		);
	}

	protected getRenderedMap(container: HTMLElement, style: StyleSpecification) {
		// Render map
		const renderMap: MaplibreMap = new MaplibreMap({
			container,
			style,
			center: this.map.getCenter(),
			zoom: this.map.getZoom(),
			bearing: this.map.getBearing(),
			pitch: this.map.getPitch(),
			interactive: false,
			preserveDrawingBuffer: true,
			fadeDuration: 0,
			// attributionControl: false,
			// hack to read transfrom request callback function
			transformRequest: this.map._requestManager._transformRequestFn,
		});

		const terrain = this.map.getTerrain();
		if (terrain) {
			// if terrain is enabled, restore pitch correctly
			renderMap.setMaxPitch(85);
			renderMap.setPitch(this.map.getPitch());
		}

		// the below code was added by https://github.com/watergis/maplibre-gl-export/pull/18.
		const images = this.map.style.imageManager.images;
		Object.keys(images).forEach((key) => {
			renderMap.addImage(key, images[key].data);
		});

		return renderMap;
	}

	protected override renderMapPost(renderMap: MaplibreMap) {
		const terrain = this.map.getTerrain();
		if (terrain) {
			// if terrain is enabled, set terrain for rendered map object
			renderMap.setTerrain({
				source: terrain.source,
				exaggeration: terrain.exaggeration,
			});
		}

		return renderMap;
	}
}
