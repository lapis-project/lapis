<script lang="ts" setup>
import "maplibre-gl/dist/maplibre-gl.css";
import "@watergis/maplibre-gl-export/dist/maplibre-gl-export.css";

import { assert } from "@acdh-oeaw/lib";
import {
	DPI,
	Format,
	MaplibreExportControl,
	PageOrientation,
	Size,
} from "@watergis/maplibre-gl-export";
import {
	FullscreenControl,
	type GeoJSONSource,
	Map as GeoMap,
	type MapGeoJSONFeature,
	NavigationControl,
	ScaleControl,
} from "maplibre-gl";
import * as THREE from "three";

import { type GeoMapContext, geoMapContextKey } from "@/components/geo-map.context";
import { initialViewState } from "@/config/geo-map.config";
// import { project } from "@/config/project.config";
import type { GeoJsonFeature } from "@/utils/create-geojson-feature";
import { generatePieChartWebGL, parseString } from "@/utils/pie-chart-helper";

const props = defineProps<{
	features: Array<GeoJsonFeature>;
	points: Array<GeoJsonFeature>;
	height: number;
	width: number;
	showAllPoints: boolean;
	showRegions: boolean;
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

const size = 45;
const canvas = document.createElement("canvas");
canvas.width = size;
canvas.height = size;
const webglcontext: WebGLContext = {
	renderer: new THREE.WebGLRenderer({ canvas: canvas, alpha: true }),
	scene: new THREE.Scene(),
	camera: new THREE.OrthographicCamera(size / -2, size / 2, size / 2, size / -2, 1, 1000),
	canvas: canvas,
};

webglcontext.renderer.setSize(size, size);
webglcontext.camera.position.z = 10;
const pieChartCache = new Map();

// const env = useRuntimeConfig();
// const theme = useColorMode();

// const colors = {
// 	default: project.colors.geojson,
// };

// const mapStyle = computed(() => {
// 	return theme.value === "dark"
// 		? env.public.NUXT_PUBLIC_MAP_BASELAYER_URL_DARK
// 		: env.public.NUXT_PUBLIC_MAP_BASELAYER_URL_LIGHT;
// });

const elementRef = ref<HTMLElement | null>(null);

const context: GeoMapContext = {
	map: null,
};
const sourcePointsId = "points";
const sourcePolygonsId = "poly";

onMounted(create);
onScopeDispose(dispose);

function getPieChartTexture(
	data: Array<number>,
	colors: Array<string>,
	size: number,
	context: WebGLContext,
) {
	const key = JSON.stringify({ data, colors });
	if (!pieChartCache.has(key)) {
		const pixels = generatePieChartWebGL(data, colors, size, context);
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
		style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
		zoom: initialViewState.zoom,
	});

	context.map = map;

	// reference: https://docs.mapbox.com/mapbox-gl-js/example/add-image-missing-generated/
	map.on("styleimagemissing", (e) => {
		const id = e.id; // id of the missing image

		// // Check if this missing icon is
		// // one this function can generate.
		const prefix = "id-";
		if (!id.includes(prefix) || id === prefix) return;
		// // Get the color from the id.
		// const uniqueCountsArray = id.replace(prefix, "").split("-").map(Number);
		// const cleanId = id.replace(prefix, "");

		const result = parseString(id);

		const data = getPieChartTexture(result.ids, result.hexcodes, size, webglcontext);
		map.addImage(id, { width: size, height: size, data: data });
	});

	map.on("load", init);
}

function init() {
	assert(context.map != null);
	const map = context.map;

	//

	const nav = new NavigationControl({});
	map.addControl(nav, "top-left");
	//

	const fullscreen = new FullscreenControl({});
	map.addControl(fullscreen, "top-right");

	//

	const scale = new ScaleControl({});
	map.addControl(scale, "bottom-left");

	// initiate image exporter https://maplibre-gl-export.water-gis.com/
	const exportControl = new MaplibreExportControl({
		PageSize: Size.A4,
		PageOrientation: PageOrientation.Landscape,
		Format: Format.SVG,
		DPI: DPI[96],
		Crosshair: false,
		PrintableArea: false,
		Local: "en",
		Filename: "kartierung",
	});
	map.addControl(exportControl, "top-right");
	//

	map.addSource(sourcePointsId, {
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

	//

	map.addLayer({
		id: "polygons",
		type: "fill",
		source: sourcePolygonsId,
		filter: ["==", "$type", "Polygon"],
		paint: {
			"fill-color": "#6495ED",
			"fill-opacity": 0.3,
		},
	});
	map.setLayoutProperty("polygons", "visibility", "visible"); // has to be set once before being toggle-able

	map.addLayer({
		id: "outline",
		type: "line",
		source: sourcePolygonsId,
		layout: {},
		paint: {
			"line-color": "#6495ED",
			"line-width": 1,
		},
	});
	map.setLayoutProperty("outline", "visibility", "visible"); // has to be set once before being toggle-able

	map.addLayer({
		id: "points",
		type: "symbol",
		source: sourcePointsId,
		layout: {
			"icon-image": ["concat", ["concat", "id-", ["get", "chartData"]], ["get", "colors"]],
			"icon-size": ["interpolate", ["linear"], ["get", "answerCount"], 1, 0.35, 20, 1],
			"icon-allow-overlap": props.showAllPoints,
		},
	});

	map.on("click", "points", (event) => {
		emit(
			"layer-click",
			(event.features ?? []) as Array<MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">>,
		);
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

	//

	map.on("mouseleave", "points", () => {
		map.getCanvas().style.cursor = "";
	});

	// map.on("mouseleave", "polygons", () => {
	// 	map.getCanvas().style.cursor = "";
	// });

	// map.on("zoom", () => {
	// 	const zoom = map.getZoom();
	// 	pointsData.forEach((pointData) => {
	// 		const size = calculateIconSize(zoom, pointData.answerCount);
	// 		pointData.mesh.scale.set(size, size, size);
	// 	});
	// });

	updateScope();
}

function dispose() {
	context.map?.remove();
}

watch(() => {
	return props.points;
}, updateScope);

function updateScope() {
	assert(context.map != null);
	const map = context.map;

	// const points = [
	// 	{
	// 		type: "Feature",
	// 		id: "2",
	// 		geometry: { type: "Point", coordinates: [9.74012588924973, 47.50305295] },
	// 		properties: {
	// 			chartData: "15,25,35,25",
	// 			"0": {
	// 				gender: "weiblich",
	// 				age: "1992",
	// 				under50: true,
	// 				answers: [
	// 					{ reg: "Dialekt (Mundart)", answer: "Zündhölzle", anno: "Zündholz" },
	// 					{ reg: "Ihr österreichisches Hochdeutsch", answer: "Zündholz", anno: "Zündholz" },
	// 				],
	// 			},
	// 			"1": {
	// 				gender: "männlich",
	// 				age: "1996",
	// 				under50: true,
	// 				answers: [
	// 					{ reg: "Dialekt (Mundart)", answer: "Streichholz", anno: "Streichholz" },
	// 					{ reg: "Ihr Hochdeutsch", answer: "Streichholz", anno: "Streichholz" },
	// 				],
	// 			},
	// 			"2": {
	// 				gender: "weiblich",
	// 				age: "1989",
	// 				under50: true,
	// 				answers: [
	// 					{ reg: "Dialekt (Mundart)", answer: "strichholz", anno: "Streichholz" },
	// 					{ reg: "Ihr österreichisches Hochdeutsch", answer: "streichholz", anno: "Streichholz" },
	// 				],
	// 			},
	// 			"3": {
	// 				gender: "weiblich",
	// 				age: "1990",
	// 				under50: true,
	// 				answers: [
	// 					{ reg: "Dialekt (Mundart)", answer: "Streichhölzle", anno: "Streichholz" },
	// 					{ reg: "Ihr Hochdeutsch", answer: "Streichholz", anno: "Streichholz" },
	// 				],
	// 			},
	// 			"4": {
	// 				gender: "männlich",
	// 				age: "1990",
	// 				under50: true,
	// 				answers: [
	// 					{ reg: "Dialekt (Mundart)", answer: "Zündhölzle", anno: "Zündholz" },
	// 					{ reg: "Ihr Hochdeutsch", answer: "Zündhölzchen", anno: "Zündholz" },
	// 				],
	// 			},
	// 			"5": {
	// 				gender: "weiblich",
	// 				age: "1980",
	// 				under50: true,
	// 				answers: [
	// 					{
	// 						reg: "Umgangssprache oder Alltagssprache",
	// 						answer: "Streichholz",
	// 						anno: "Streichholz",
	// 					},
	// 					{ reg: "bestes Hochdeutsch", answer: "Streichholz", anno: "Streichholz" },
	// 				],
	// 			},
	// 			"6": {
	// 				gender: "weiblich",
	// 				age: "1992",
	// 				under50: true,
	// 				answers: [
	// 					{ reg: "Dialekt (Mundart)", answer: "Striechholz", anno: "Streichholz" },
	// 					{ reg: "bestes Hochdeutsch", answer: "Streichholz", anno: "Streichholz" },
	// 				],
	// 			},
	// 			id: 134,
	// 		},
	// 	},
	// ];

	const source = map.getSource(sourcePointsId) as GeoJSONSource | undefined;
	const source2 = map.getSource(sourcePolygonsId) as GeoJSONSource | undefined;
	const geojson = createFeatureCollection(props.points);
	const geojson2 = createFeatureCollection(props.features);
	source?.setData(geojson);
	source2?.setData(geojson2);

	// STILL LAGGY :(
	// if (geojson.features.length > 0) {
	// 	const bounds = turf.bbox(geojson);
	// 	map.fitBounds(bounds, { padding: 50 });
	// }
}

const toggleLayer = (layer: "outline" | "polygons") => {
	assert(context.map != null);
	const map = context.map;
	const visibility = map.getLayoutProperty(layer, "visibility");
	if (visibility === "visible") {
		map.setLayoutProperty(layer, "visibility", "none");
	} else {
		map.setLayoutProperty(layer, "visibility", "visible");
	}
};

watch(() => {
	return props.showAllPoints;
}, create);

watch(
	() => {
		return props.showRegions;
	},
	() => {
		toggleLayer("polygons");
		toggleLayer("outline");
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
