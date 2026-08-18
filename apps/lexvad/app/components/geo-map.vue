<script setup lang="ts">
import "maplibre-gl/dist/maplibre-gl.css";

import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { Deck } from "@deck.gl/core";
import {
	FillStyleExtension,
	type FillStyleExtensionProps,
	MaskExtension,
} from "@deck.gl/extensions";
import {
	GeoJsonLayer,
	type GeoJsonLayerProps,
	PolygonLayer,
	ScatterplotLayer,
} from "@deck.gl/layers";
import { LayersIcon, MinusIcon, PlusIcon } from "@lucide/vue";
import { featureCollection, point, union, voronoi } from "@turf/turf";
import { Map } from "maplibre-gl";

import bundeslaenderJson from "@/assets/data/bundeslaender.json";
import regionsJson from "@/assets/data/dialektregionen-lexat21-optimized.geojson.json";
import MapTooltip from "@/components/map-tooltip.vue";
import { regionPatterns } from "@/stores/use-color-store";
import {
	createRegionPatternAtlas,
	PATTERN_RESOLUTION,
	type RegionPatternAtlas,
} from "@/utils/region-pattern-atlas";

const regions = regionsJson as GeoJSON.FeatureCollection<GeoJSON.Polygon>;
const bundeslaender = bundeslaenderJson as GeoJSON.FeatureCollection<GeoJSON.Polygon>;

type MapLayer = "none" | "regions" | "bundeslaender";

interface MapDataType {
	coordinates: [number, number];
	color: string;
	name: string;
	variants: Array<string>;
}

interface MapProps {
	data: Array<MapDataType>;
	colors: Record<string, string>;
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

const points = computed(() => props.data.map((entry) => point(entry.coordinates, entry)));

const areaMapMode = ref("hexagon");
const mapContainer = ref<HTMLDivElement | null>(null);
const deckCanvas = ref<HTMLCanvasElement | null>(null);

interface TooltipState {
	x: number;
	y: number;
	name?: string;
	variants?: Array<string>;
	entry?: PilotDataType;
}
const tooltip = ref<TooltipState | null>(null);

let map: Map | null = null;
let deck: Deck | null = null;

const { getRegionPattern } = useColorStore();

/** Built on mount — rasterising the patterns needs a canvas. */
let patternAtlas: RegionPatternAtlas | null = null;

function createScatterplotLayer(minimal = false) {
	return new ScatterplotLayer<GeoJSON.Feature<GeoJSON.Point>>({
		id: `ScatterplotLayer${minimal ? "minimal" : ""}`,
		data: points.value,
		getFillColor: (d) => (minimal ? [255, 255, 255] : hexToRgb(d.properties?.color, 220)),
		getLineColor: [255, 255, 255, 200],
		getPosition: (d) => d.geometry.coordinates as [number, number],
		getRadius: minimal ? 100 : 2000,
		lineWidthMinPixels: 1,
		pickable: !minimal,
		radiusMaxPixels: Math.max(3, (3 * points.value.length) / 1000),
		radiusMinPixels: minimal ? 0 : Math.max(1, points.value.length / 1000),
		stroked: !minimal,
	});
}

function createVoronoiLayer() {
	const features = featureCollection(points.value);
	const polygons = voronoi(features);

	return new PolygonLayer<(typeof polygons.features)[0]>({
		id: "VoronoiLayer",
		data: polygons.features.filter((e) => e !== undefined),
		getFillColor: (d) => hexToRgb(d.properties?.color, 180),
		filled: true,
		getPolygon: (d) => d.geometry.coordinates,
		lineWidthMinPixels: 1,
		getLineColor: [255, 255, 255, 150],
		pickable: true,
		extensions: [new MaskExtension()],
		//@ts-expect-error - unrecognized key "maskId"
		maskId: "bordermask",
	});
}

function _getDominantVariant(d: Array<GeoJSON.Feature<GeoJSON.Point>>) {
	const variantCount: Record<string, number> = {};
	d.forEach((entry) =>
		entry.properties?.variants.forEach((v: string) => {
			if (!(v in variantCount)) variantCount[v] = 0;
			variantCount[v]!++;
		}),
	);
	const sortedVariants = Object.entries(variantCount).toSorted((a, b) => b[1] - a[1]);
	return sortedVariants[0]![0];
}

const colorsArray = computed(() => Object.entries(props.colors));

const radius = ref(10000);
function createHexagonLayer() {
	return new HexagonLayer<GeoJSON.Feature<GeoJSON.Point>>({
		id: "HexagonLayer",
		data: points.value,
		gpuAggregation: true,
		coverage: 0.92,
		getPosition: (d) => d.geometry.coordinates as [number, number],
		radius: radius.value,
		elevationScale: 1,
		extruded: false,
		colorScaleType: "quantize",
		getColorValue: (d) =>
			colorsArray.value.findIndex(([_, c]) => {
				const color = props.colors[_getDominantVariant(d)!];
				return color === c;
			}),
		colorDomain: [0, colorsArray.value.length - 1],
		colorRange: colorsArray.value.map(([_, c]) => hexToRgb(c, 180)),
		pickable: true,
		extensions: [new MaskExtension()],
		//@ts-expect-error - unrecognized key "maskId"
		maskId: "bordermask",
	});
}

const PATTERN_TILE_METERS = 10000;

type RegionProperties = (typeof regions)["features"][0]["properties"];
export type RegionFeature = GeoJSON.Feature<GeoJSON.Polygon, RegionProperties>;
export type BundeslandFeature = (typeof bundeslaender)["features"][0];
const activeLayer = ref<MapLayer>("none");

function createPatternLayer<F extends GeoJSON.Feature<GeoJSON.Polygon>>(
	id: string,
	data: GeoJSON.FeatureCollection<GeoJSON.Polygon>,
	getName: (feature: F) => string,
) {
	const atlas = patternAtlas;
	const patternFor = (d: F) => getRegionPattern(getName(d));

	const patternProps: Partial<FillStyleExtensionProps<F>> = atlas
		? {
				fillPatternAtlas: atlas.url,
				fillPatternMapping: atlas.mapping,
				fillPatternMask: true,
				getFillPattern: (d) => patternFor(d).id,
				getFillPatternScale: (d) => PATTERN_TILE_METERS / (patternFor(d).w * PATTERN_RESOLUTION),
			}
		: {};

	const layerProps: GeoJsonLayerProps & Partial<FillStyleExtensionProps<F>> = {
		id,
		data,
		filled: atlas !== null,
		stroked: true,
		lineWidthMinPixels: 1,
		getFillColor: (d) => hexToRgb(patternFor(d as F).color, 100),
		getLineColor: (d) => hexToRgb(patternFor(d as F).color, 220),
		extensions: atlas ? [new FillStyleExtension({ pattern: true })] : [],
		...patternProps,
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

function createOverlayLayers() {
	switch (activeLayer.value) {
		case "regions":
			return [createRegionsLayer()];
		case "bundeslaender":
			return [createBundeslaenderLayer()];
		default:
			return [];
	}
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
	const overlayLayers = createOverlayLayers();
	if (props.mode === "point") {
		return [...overlayLayers, createScatterplotLayer()];
	}
	switch (areaMapMode.value) {
		case "hexagon":
			return [createMaskLayer(), ...overlayLayers, createHexagonLayer()];
		case "voronoi":
			return [
				createMaskLayer(),
				...overlayLayers,
				createVoronoiLayer(),
				createScatterplotLayer(true),
			];
	}
	return [];
}

function _joinEntries(entries: Array<GeoJSON.Feature>) {
	const reducedEntries = entries.reduce(
		(acc, current) => {
			Object.entries(current.properties as PilotDataType).forEach((e) =>
				acc[e[0]]?.push(...String(e[1]!).split("; ")),
			);
			return acc;
		},
		Object.fromEntries(
			Object.entries(entries[0]?.properties ?? {}).map((e) => [e[0], [] as Array<string | number>]),
		),
	);
	return Object.fromEntries(
		Object.entries(reducedEntries).map((e) => [
			e[0],
			[...new Set(e[1].flat())].toSorted((a, b) => String(a).localeCompare(String(b))).join("; "),
		]),
	);
}

onMounted(() => {
	patternAtlas = createRegionPatternAtlas(regionPatterns);

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
		onHover: ({ object, x, y }) => {
			if (!object) {
				tooltip.value = null;
				return;
			}
			if ("points" in object) {
				tooltip.value = {
					x,
					y,
					entry: _joinEntries(object.points) as unknown as PilotDataType,
				};
			} else {
				tooltip.value = {
					x,
					y,
					entry: object.properties,
				};
			}
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
	() => [props.data, props.mode, radius.value, activeLayer.value, areaMapMode.value],
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

const t = useTranslations();

const areaMapModeItems = [
	{ label: t("MapsPage.controls.voronoi"), value: "voronoi", icon: "i-gis-polygon-o" },
	{ label: t("MapsPage.controls.hexagon"), value: "hexagon", icon: "i-lucide-hexagon" },
];

const layerItems = computed(() =>
	(
		[
			{ value: "none", icon: "i-lucide-eye-off" },
			{ value: "regions", icon: "i-lucide-shapes" },
			{ value: "bundeslaender", icon: "i-lucide-map" },
		] as const
	).map((item) => ({
		label: t(`MapsPage.controls.layers.${item.value}`),
		icon: item.icon,
		type: "checkbox" as const,
		checked: activeLayer.value === item.value,
		onUpdateChecked() {
			activeLayer.value = item.value;
		},
	})),
);
</script>

<template>
	<div class="relative size-full">
		<div
			v-if="mode === 'area'"
			class="absolute top-4 left-1/2 h-12 z-20 bg-card py-4 px-0.5 border border-border rounded-lg flex gap-2 text-xs -translate-x-1/2 items-center shadow-lg"
		>
			<UTabs
				v-model="areaMapMode"
				class="w-fit"
				color="neutral"
				:content="false"
				:items="areaMapModeItems"
				:ui="{
					list: 'bg-card rounded-lg p-1',
					indicator: 'bg-foreground text-background',
					trigger:
						'px-4 py-2 whitespace-nowrap data-[state=inactive]:text-muted-foreground data-[state=active]:text-background text-xs',
				}"
				variant="pill"
			>
			</UTabs>
			<template v-if="areaMapMode === 'hexagon'">
				<USeparator orientation="vertical"></USeparator>
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
				<span class="text-muted-foreground mr-4">{{ (radius / 1000).toFixed(1) }} km</span>
			</template>
		</div>
		<div class="absolute top-4 left-4 z-20 flex gap-4 flex-col">
			<div class="bg-card border border-border rounded-lg text-xs shadow-lg flex flex-col">
				<UButton
					class="rounded-b-none aspect-square justify-center"
					color="neutral"
					variant="outline"
				>
					<PlusIcon class="size-4"></PlusIcon>
				</UButton>
				<UButton
					class="rounded-t-none aspect-square justify-center"
					color="neutral"
					variant="outline"
				>
					<MinusIcon class="size-4"></MinusIcon>
				</UButton>
			</div>
			<UDropdownMenu
				:content="{ align: 'start', side: 'right' }"
				:items="layerItems"
				:modal="false"
			>
				<button
					class="bg-background hover:bg-elevated p-3 border border-border rounded-lg text-xs shadow-lg"
					:class="{ 'text-background bg-foreground hover:bg-foreground': activeLayer !== 'none' }"
					type="button"
				>
					<span class="sr-only">Toggle Layers</span>
					<LayersIcon class="size-4"></LayersIcon>
				</button>
			</UDropdownMenu>
		</div>

		<div ref="mapContainer" class="size-full absolute inset-0"></div>
		<canvas ref="deckCanvas" class="size-full absolute inset-0"></canvas>

		<MapTooltip
			v-if="tooltip"
			class="absolute z-30 pointer-events-none max-w-xs -translate-x-1/2 -translate-y-[calc(100%+12px)]"
			:entry="tooltip.entry"
			:style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
		/>
	</div>
</template>
