<script lang="ts" setup>
import "maplibre-gl/dist/maplibre-gl.css";

import { assert } from "@acdh-oeaw/lib";
import {
	type GeoJSONSource,
	Map as GeoMap,
	type MapGeoJSONFeature,
	NavigationControl,
	ScaleControl,
} from "maplibre-gl";
import * as THREE from "three";

import { type GeoMapContext, geoMapContextKey } from "@/components/geo-map.context";
import { initialViewState } from "@/config/geo-map.config";
import type { GeoJsonFeature } from "@/utils/create-geojson-feature";
import { DPI, Format, MaplibreExportControl, PageOrientation, Size } from "@/utils/map-exporter";
import { generatePieChartWebGL, parseString } from "@/utils/pie-chart-helper";

import { ResetViewControl } from "./reset-view-control";

const props = defineProps<{
	features: Array<GeoJsonFeature>;
	geoOutline: Array<GeoJsonFeature>;
	locations: Array<GeoJsonFeature>;
	height: number;
	width: number;
	simplifiedView: boolean;
	showRegionNames: boolean;
	showRegions: boolean;
	basemap: string;
	capitalsOnly: boolean;
}>();

const emit = defineEmits<{
	(
		event: "layer-click",
		features: Array<MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">>,
	): void;
}>();

export interface WebGLContext {
	renderer: THREE.WebGLRenderer;
	scene: THREE.Scene;
	camera: THREE.OrthographicCamera;
	canvas: HTMLCanvasElement;
}

let size = 100; // size for pie chart width and height
const canvas = document.createElement("canvas");
canvas.width = size;
canvas.height = size;
let webglcontext: WebGLContext | undefined = undefined;
function initWebGl() {
	webglcontext = {
		renderer: new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true }),
		scene: new THREE.Scene(),
		camera: new THREE.OrthographicCamera(size / -2, size / 2, size / 2, size / -2, 1, 1000),
		canvas: canvas,
	};

	webglcontext.renderer.setSize(size, size);
	webglcontext.camera.position.z = 10;
}
initWebGl();

const pieChartCache = new Map();

const elementRef = ref<HTMLElement | null>(null);

let zoomFactor = 0;

const context: GeoMapContext = {
	map: null,
};
const locationPointsId = "points";
const sourcePolygonsId = "poly";
const sourceOutlineId = "outline";

onMounted(create);
onScopeDispose(dispose);

function getPieChartTexture(
	data: Array<number>,
	colors: Array<string>,
	size: number,
	context: WebGLContext,
	answerCount: number,
) {
	const key = JSON.stringify({ data, colors, answerCount });
	const currentZoomFactor = zoomFactor;
	if (!pieChartCache.has(key)) {
		const pixels = generatePieChartWebGL(
			data,
			colors,
			size,
			context,
			answerCount,
			currentZoomFactor,
		);
		pieChartCache.set(key, pixels);
	}
	return pieChartCache.get(key);
}

async function create() {
	await nextTick();
	assert(elementRef.value != null);

	const map = new GeoMap({
		center: [initialViewState.longitude, initialViewState.latitude],
		container: elementRef.value,
		maxZoom: 11,
		minZoom: 6.5, // a littler bigger than Austria
		pitch: initialViewState.pitch,
		style:
			props.basemap === "plain"
				? {
						version: 8,
						sources: {},
						layers: [
							{
								id: "background",
								type: "background",
								paint: {
									"background-color": "white",
								},
							},
						],
					}
				: props.basemap,
		zoom: initialViewState.zoom,
	});

	context.map = map;

	// reference: https://docs.mapbox.com/mapbox-gl-js/example/add-image-missing-generated/
	map.on("styleimagemissing", (e) => {
		const id = e.id;
		const prefix = "id-";

		if (!id.startsWith(prefix)) {
			return; // Not a custom pie chart icon
		}

		try {
			const result = parseString(id);

			if (webglcontext) {
				const data = getPieChartTexture(
					result.ids,
					result.hexcodes,
					size,
					webglcontext,
					result.answerCount,
				);
				map.addImage(id, { width: size, height: size, data: data });
			}
		} catch (error) {
			console.error(`Failed to parse icon-image id "${id}":`, error.message);
		}
	});

	map.on("load", init);
}

function init() {
	assert(context.map != null);
	const map = context.map;

	const nav = new NavigationControl({});
	map.addControl(nav, "top-left");

	const scale = new ScaleControl({});
	map.addControl(scale, "bottom-left");

	const resetViewControl = new ResetViewControl(
		[initialViewState.longitude, initialViewState.latitude],
		initialViewState.zoom,
	);
	map.addControl(resetViewControl, "top-left");

	// initiate image exporter https://maplibre-gl-export.water-gis.com/
	const exportControl = new MaplibreExportControl({
		PageSize: Size.A4,
		PageOrientation: PageOrientation.Landscape,
		Format: Format.JPEG,
		DPI: DPI[300],
		Crosshair: false,
		PrintableArea: false,
		Filename: "kartierung",
		IncludeLegend: true,
	});
	map.addControl(exportControl, "top-left");
	//

	map.addSource(locationPointsId, {
		type: "geojson",
		data: createFeatureCollection([]),
		// cluster: true,
		// clusterMaxZoom: 14,
		// clusterRadius: 40,
	});

	map.addSource(sourcePolygonsId, {
		type: "geojson",
		data: createFeatureCollection([]),
	});

	map.addSource(sourceOutlineId, {
		type: "geojson",
		data: createFeatureCollection([]),
	});

	// Dialektregionen
	map.addLayer({
		id: "polygons",
		type: "fill",
		source: sourcePolygonsId,
		filter: ["==", "$type", "Polygon"],
		paint: {
			"fill-color": ["get", "color"], // palette https://coolors.co/palette/f8f9fa-e9ecef-dee2e6-ced4da-adb5bd-6c757d-495057-343a40-212529
			"fill-opacity": 0.6,
		},
	});
	map.setLayoutProperty("polygons", "visibility", props.showRegions ? "visible" : "none"); // has to be set once before being toggle-able

	// Umrandung Österreich
	map.addLayer({
		id: "outline",
		type: "line",
		source: sourceOutlineId,
		layout: {},
		paint: {
			"line-color": "#212529",
			"line-width": 2,
		},
	});
	map.setLayoutProperty("outline", "visibility", props.showRegions ? "visible" : "none"); // has to be set once before being toggle-able

	map.addLayer({
		id: "points",
		type: "symbol",
		source: locationPointsId,
		layout: {
			"icon-image": [
				"concat",
				"id-",
				["get", "chartData"],
				";",
				["get", "colors"],
				";",
				["to-string", ["get", "answerCount"]],
				";",
				["to-string", ["get", "zoomFactor"]],
			],
			"icon-size": [
				"interpolate",
				["linear"],
				["/", ["ln", ["max", ["get", "answerCount"], 1]], ["ln", 10]],
				0,
				["+", 0.09, ["get", "zoomFactor"]],
				0.5,
				["+", 0.1, ["get", "zoomFactor"]],
				1,
				["+", 0.2, ["get", "zoomFactor"]],
				2,
				["+", 0.3, ["get", "zoomFactor"]],
				3,
				["+", 0.5, ["get", "zoomFactor"]],
			],
			"icon-allow-overlap": !props.simplifiedView,
			"symbol-sort-key": ["-", ["get", "answerCount"]],
		},
	});

	// bug: multiple labels on certain zoom levels https://github.com/mapbox/mapbox-gl-js/issues/5583#issuecomment-341840524
	map.addLayer({
		id: "polygon-labels",
		type: "symbol",
		source: sourcePolygonsId,
		layout: {
			"text-field": ["get", "name"],
			"text-size": [
				"interpolate",
				["linear"], // Smooth transition
				["zoom"], // Zoom level
				6,
				13, // At zoom level 3, text size is 10
				12,
				24, // At zoom level 8, text size is 14
			],
			"text-anchor": "center",
			// "text-ignore-placement": true,
		},
		paint: {
			"text-color": "#000000",
			"text-halo-color": "#FFFFFF",
			"text-halo-width": 2,
		},
	});
	map.setLayoutProperty("polygon-labels", "visibility", props.showRegionNames ? "visible" : "none");

	map.on("click", "points", (event) => {
		emit(
			"layer-click",
			(event.features ?? []) as Array<MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">>,
		);
	});

	// TODO make this more efficient
	map.on("zoomend", async () => {
		const currentZoom = Math.floor(map.getZoom());
		zoomFactor = 0;
		if (currentZoom >= 9) {
			zoomFactor = 0.3;
		} else if (currentZoom === 8) {
			zoomFactor = 0.1;
		}
		// Get the existing GeoJSON
		const source = map.getSource(locationPointsId) as maplibregl.GeoJSONSource;
		if (!source) return;

		pieChartCache.clear();
		const data = source._data as GeoJSON.FeatureCollection;
		// Update zoomFactor on each feature
		data.features.forEach((feature) => {
			feature.properties.zoomFactor = zoomFactor;
		});
		// Re-set the data -> triggers styleimagemissing for new icon IDs
		source.setData(data);
	});

	// map.on("click", "polygons", (event) => {
	// 	emit(
	// 		"layer-click",
	// 		(event.features ?? []) as Array<MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">>,
	// 	);
	// });

	//

	map.on("mouseenter", "points", () => {
		map.getCanvas().style.cursor = "pointer";
	});

	// map.on("mouseenter", "polygons", () => {
	// 	map.getCanvas().style.cursor = "pointer";
	// });

	map.on("mouseleave", "points", () => {
		map.getCanvas().style.cursor = "";
	});

	// map.on("mouseleave", "polygons", () => {
	// 	map.getCanvas().style.cursor = "";
	// });

	let hoveredPolygonName: string | null = null;

	map.on("mousemove", "polygons", (e) => {
		if (!props.showRegionNames) {
			if (e.features?.length && e.features.length > 0) {
				const newHoveredPolygonName = e.features[0]?.properties.name;

				if (hoveredPolygonName !== newHoveredPolygonName) {
					hoveredPolygonName = newHoveredPolygonName;

					// Update the filter to show the label for the current polygon
					map.setFilter("polygon-labels", ["==", "name", e.features[0]?.properties.name]);
					map.setLayoutProperty("polygon-labels", "visibility", "visible");
				}
			} else {
				// Reset the hovered polygon ID when moving out of any polygon
				hoveredPolygonName = null;

				// Hide the labels when no polygon is under the cursor
				map.setLayoutProperty("polygon-labels", "visibility", "none");
			}
		}
	});

	map.on("mouseleave", "polygons", () => {
		if (!props.showRegionNames) {
			map.getCanvas().style.cursor = "";
			hoveredPolygonName = null;

			// Ensure labels are hidden when leaving the polygon layer
			map.setLayoutProperty("polygon-labels", "visibility", "none");
		}
	});

	updateScope();
}

function dispose() {
	context.map?.remove();
}

watch(() => {
	return props.locations;
}, updateScope);

function updateScope() {
	assert(context.map != null);
	pieChartCache.clear();
	const map = context.map;

	const sourceLocations = map.getSource(locationPointsId) as GeoJSONSource | undefined;
	const sourceRegions = map.getSource(sourcePolygonsId) as GeoJSONSource | undefined;
	const sourceAustria = map.getSource(sourceOutlineId) as GeoJSONSource | undefined;
	const geojsonLocations = createFeatureCollection(props.locations);
	const geojsonRegions = createFeatureCollection(props.features);
	const geojsonAustria = createFeatureCollection(props.geoOutline);
	geojsonLocations.features.forEach((feature) => {
		feature.properties.zoomFactor = zoomFactor;
	});
	sourceLocations?.setData(geojsonLocations);
	sourceRegions?.setData(geojsonRegions);
	sourceAustria?.setData(geojsonAustria);
}

const toggleLayer = (layer: "outline" | "polygon-labels" | "polygons") => {
	assert(context.map != null);
	const map = context.map;
	const visibility = map.getLayoutProperty(layer, "visibility");
	map.setFilter(layer, null);
	if (visibility === "visible") {
		map.setLayoutProperty(layer, "visibility", "none");
	} else {
		map.setLayoutProperty(layer, "visibility", "visible");
	}
};

watch(
	() => {
		return props.simplifiedView;
	},
	async () => {
		dispose();
		pieChartCache.clear();
		await create();
	},
);

watch(
	() => {
		return props.basemap;
	},
	async () => {
		dispose();
		pieChartCache.clear();
		await create();
	},
);

watch(
	() => {
		return props.showRegionNames;
	},
	() => {
		toggleLayer("polygon-labels");
	},
);

watch(
	() => {
		return props.showRegions;
	},
	() => {
		toggleLayer("polygons");
		toggleLayer("outline");
	},
);

watch(
	() => {
		return props.capitalsOnly;
	},
	async (newVal) => {
		// dispose();
		pieChartCache.clear();
		size = newVal ? 250 : 100;
		initWebGl();
		zoomFactor = 0;
		await create();
	},
);

defineExpose(context);
provide(geoMapContextKey, context);
</script>

<template>
	<div class="relative grid size-full text-black">
		<div ref="elementRef" data-geo-map="true" />
		<slot />
	</div>
</template>

<style scopes lang="css">
.maplibregl-marker {
	@apply cursor-pointer;
}
</style>

<style lang="css">
@import "@/assets/css/maplibre-gl-export.css";
</style>
