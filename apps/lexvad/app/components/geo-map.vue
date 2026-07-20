<script setup lang="ts">
import "maplibre-gl/dist/maplibre-gl.css";

import { type Color, Deck } from "@deck.gl/core";
import { MaskExtension } from "@deck.gl/extensions";
import { GeoJsonLayer, PolygonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { featureCollection, point, union, voronoi } from "@turf/turf";
import { Map } from "maplibre-gl";

import regionsJson from "@/assets/data/dialektregionen-lexat21-optimized.geojson.json";

const regions = regionsJson as GeoJSON.FeatureCollection<GeoJSON.Polygon>;

interface MapDataType {
	coordinates: [number, number];
	color: string;
	name: string;
}

interface MapProps {
	data: Array<MapDataType>;
	mode: "point" | "area";
}

const props = defineProps<MapProps>();

const style = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const INITIAL_VIEW_STATE = {
	longitude: 14.0,
	latitude: 47.5,
	zoom: 6,
	pitch: 0,
	bearing: 0,
};

const hexToRgb = (hex: string, alpha = 255): Color => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? [parseInt(result[1]!, 16), parseInt(result[2]!, 16), parseInt(result[3]!, 16), alpha]
		: [0, 0, 0, alpha];
};

const points = computed(() => props.data.map((entry) => point(entry.coordinates, entry)));

const mapContainer = ref<HTMLDivElement | null>(null);
const deckCanvas = ref<HTMLCanvasElement | null>(null);

let map: Map | null = null;
let deck: Deck | null = null;

function createScatterplotLayer() {
	return new ScatterplotLayer<MapDataType>({
		id: "ScatterplotLayer",
		data: props.data,
		getFillColor: (d) => hexToRgb(d.color, 220),
		getLineColor: [255, 255, 255, 200],
		getPosition: (d) => d.coordinates,
		getRadius: 5500,
		lineWidthMinPixels: 1,
		pickable: true,
		radiusMaxPixels: 12,
		radiusMinPixels: 4,
		stroked: true,
	});
}

function createVoronoiLayer() {
	const features = featureCollection(points.value);
	const polygons = voronoi(features);

	return new PolygonLayer({
		id: "VoronoiLayer",
		data: polygons.features.filter((e) => e !== undefined),
		getFillColor: (d: (typeof polygons.features)[0]) => hexToRgb(d.properties?.color, 220),
		filled: true,
		getPolygon: (d: (typeof polygons.features)[0]) => d.geometry.coordinates,
		lineWidthMinPixels: 1,
		getLineColor: [255, 255, 255, 200],
		pickable: true,
		extensions: [new MaskExtension()],
		maskId: "bordermask",
	});
}

function createMaskLayer() {
	const border = union(regions);
	if (!border) return;
	return new GeoJsonLayer({
		id: "bordermask",
		data: border,
		operation: "mask",
	});
}

function createLayers() {
	if (props.mode === "point") {
		return [createScatterplotLayer()];
	}
	return [createMaskLayer(), createVoronoiLayer()];
}

onMounted(() => {
	map = new Map({
		container: mapContainer.value!,
		style,
		center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
		zoom: INITIAL_VIEW_STATE.zoom,
		bearing: INITIAL_VIEW_STATE.bearing,
		pitch: INITIAL_VIEW_STATE.pitch,
		maxZoom: 20,
		interactive: false,
	});

	deck = new Deck({
		canvas: deckCanvas.value!,
		initialViewState: INITIAL_VIEW_STATE,
		controller: true,
		getTooltip: ({ object }) =>
			(object as GeoJSON.Feature | null) && `${(object as GeoJSON.Feature).properties?.name}`,
		onViewStateChange: ({ viewState }) => {
			map?.jumpTo({
				center: [viewState.longitude, viewState.latitude],
				zoom: viewState.zoom,
				bearing: viewState.bearing,
				pitch: viewState.pitch,
			});
		},
		layers: createLayers(),
	});
});

watch(
	() => [props.data, props.mode],
	() => {
		deck?.setProps({ layers: createLayers() });
	},
);

onBeforeUnmount(() => {
	deck?.finalize();
	deck = null;
	map?.remove();
	map = null;
});
</script>

<template>
	<div class="relative size-full">
		<div ref="mapContainer" class="size-full absolute inset-0"></div>
		<canvas ref="deckCanvas" class="size-full absolute inset-0"></canvas>
	</div>
</template>
