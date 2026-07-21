<script setup lang="ts">
import "maplibre-gl/dist/maplibre-gl.css";

import { HexagonLayer } from "@deck.gl/aggregation-layers";
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
	colors: Array<string>;
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
	return new ScatterplotLayer<GeoJSON.Feature<GeoJSON.Point>>({
		id: "ScatterplotLayer",
		data: points.value,
		getFillColor: (d) => hexToRgb(d.properties?.color, 220),
		getLineColor: [255, 255, 255, 200],
		getPosition: (d) => d.geometry.coordinates as [number, number],
		getRadius: 5500,
		lineWidthMinPixels: 1,
		pickable: true,
		radiusMaxPixels: 12,
		radiusMinPixels: 4,
		stroked: true,
	});
}

function _createVoronoiLayer() {
	const features = featureCollection(points.value);
	const polygons = voronoi(features);

	return new PolygonLayer<(typeof polygons.features)[0]>({
		id: "VoronoiLayer",
		data: polygons.features.filter((e) => e !== undefined),
		getFillColor: (d) => hexToRgb(d.properties?.color, 220),
		filled: true,
		getPolygon: (d) => d.geometry.coordinates,
		lineWidthMinPixels: 1,
		getLineColor: [255, 255, 255, 200],
		pickable: true,
		extensions: [new MaskExtension()],
		//@ts-expect-error - unrecognized key "maskId"
		maskId: "bordermask",
	});
}

const radius = ref(5000);
function createHexagonLayer() {
	return new HexagonLayer<GeoJSON.Feature<GeoJSON.Point>>({
		id: "HexagonLayer",
		data: points.value,
		gpuAggregation: false,
		coverage: 0.92,
		getPosition: (d) => d.geometry.coordinates as [number, number],
		radius: radius.value,
		elevationScale: 1,
		extruded: false,
		colorScaleType: "quantize",
		getColorValue: (d) =>
			props.colors.findIndex((c) => {
				return d[0]?.properties?.color === c;
			}),
		colorDomain: [0, props.colors.length - 1],
		colorRange: props.colors.map((c) => hexToRgb(c)),
		pickable: true,
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
	return [createMaskLayer(), createHexagonLayer()];
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
		getTooltip: ({ object }) => {
			if (!object) return null;
			if ("points" in object) return `${object.points[0].properties.name}`;
			return `${(object as GeoJSON.Feature).properties?.name}`;
		},
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
	() => [props.data, props.mode, radius.value],
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
		<div
			v-if="mode === 'area'"
			class="absolute top-4 left-1/2 h-12 z-20 bg-card p-4 border border-border rounded-lg flex gap-2 text-xs -translate-x-1/2 items-center"
		>
			<span class="uppercase text-muted-foreground font-semibold">Radius</span>
			<USlider
				v-model="radius"
				class="w-36"
				color="neutral"
				:max="20000"
				:min="3000"
				size="xs"
				:step="500"
			>
			</USlider>
			<span class="text-muted-foreground">{{ (radius / 1000).toFixed(1) }} km</span>
		</div>

		<div ref="mapContainer" class="size-full absolute inset-0"></div>
		<canvas ref="deckCanvas" class="size-full absolute inset-0"></canvas>
	</div>
</template>
