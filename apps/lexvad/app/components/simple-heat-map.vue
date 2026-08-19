<script setup lang="ts">
import { Deck } from "@deck.gl/core";
import { GeoJsonLayer, type GeoJsonLayerProps } from "@deck.gl/layers";

import bundeslaenderJson from "@/assets/data/bundeslaender.json";
import regionsJson from "@/assets/data/dialektregionen-lexat21-optimized.geojson.json";
import type { BundeslandFeature, RegionFeature } from "@/components/geo-map.vue";

const regions = regionsJson as GeoJSON.FeatureCollection<GeoJSON.Polygon>;
const bundeslaender = bundeslaenderJson as GeoJSON.FeatureCollection<GeoJSON.Polygon>;

const props = defineProps<{
	mode: "region" | "bundesland";
	data: Record<string, number>;
	color: string;
}>();

const deckCanvas = ref<HTMLCanvasElement | null>(null);
let deck: Deck | null = null;

function createPatternLayer<F extends GeoJSON.Feature<GeoJSON.Polygon>>(
	id: string,
	data: GeoJSON.FeatureCollection<GeoJSON.Polygon>,
	getName: (feature: F) => string,
) {
	const layerProps: GeoJsonLayerProps = {
		id,
		data,
		filled: true,
		stroked: true,
		lineWidthMinPixels: 1,
		getFillColor: (d) => hexToRgb(props.color, (props.data[getName(d as F)] ?? 0) * 255),
		getLineColor: () => hexToRgb("#cccccc", 220),
		updateTriggers: {
			getFillColor: [props.data, props.color],
		},
	};

	return new GeoJsonLayer(layerProps);
}

function createRegionsLayer() {
	return createPatternLayer<RegionFeature>(
		"regionLayer",
		regions,
		(d) => d.properties?.Dialektregion_Name ?? "",
	);
}

function createBundeslaenderLayer() {
	return createPatternLayer<BundeslandFeature>(
		"bundeslaenderLayer",
		bundeslaender,
		(d) => d.properties?.name ?? "",
	);
}

function createLayers() {
	return [props.mode === "region" ? createRegionsLayer() : createBundeslaenderLayer()];
}

const INITIAL_VIEW_STATE = {
	longitude: 13.5,
	latitude: 47.7,
	zoom: 4.8,
	pitch: 0,
	bearing: 0,
};
onMounted(() => {
	deck = new Deck({
		canvas: deckCanvas.value!,
		initialViewState: INITIAL_VIEW_STATE,
		controller: null,
		layers: createLayers(),
	});
});
watch(
	props,
	() => {
		deck?.setProps({ layers: createLayers() });
	},
	{ deep: true },
);

onBeforeUnmount(() => {
	deck?.finalize();
	deck = null;
});
</script>

<template>
	<div class="relative">
		<canvas ref="deckCanvas" class="size-full absolute inset-0"></canvas>
	</div>
</template>
