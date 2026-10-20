<script setup lang="ts">
import type { Feature, MultiPolygon, Polygon } from "geojson";

const props = defineProps<{
	features: Array<Feature<Polygon | MultiPolygon>>;
	nameKey: string;
	data: Record<string, number>;
	color: string;
}>();

// A fixed Mercator projection keeps both administrative and dialect boundaries aligned.
function project([longitude = 0, latitude = 0]: Array<number>) {
	return [
		longitude,
		(Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360)) * 180) / Math.PI,
	];
}

const shapes = computed(() =>
	props.features.map((feature) => {
		const polygons =
			feature.geometry.type === "Polygon"
				? [feature.geometry.coordinates]
				: feature.geometry.coordinates;
		const rings = polygons.flatMap((polygon) => polygon.map((ring) => ring.map(project)));
		return {
			name: String(feature.properties?.[props.nameKey] ?? ""),
			rings,
			path: rings.map((ring) => `M${ring.map(([x, y]) => `${x},${-y!}`).join("L")}Z`).join(""),
		};
	}),
);

const viewBox = computed(() => {
	const coordinates = shapes.value.flatMap((shape) => shape.rings.flat());
	const xs = coordinates.map(([x]) => x!);
	const ys = coordinates.map(([, y]) => -y!);
	const left = Math.min(...xs);
	const top = Math.min(...ys);
	return `${left} ${top} ${Math.max(...xs) - left} ${Math.max(...ys) - top}`;
});
</script>

<template>
	<svg :viewBox="viewBox" aria-hidden="true">
		<path
			v-for="shape in shapes"
			:key="shape.name"
			:d="shape.path"
			fill="var(--ui-bg-accented)"
			fill-rule="evenodd"
		/>
		<path
			v-for="shape in shapes"
			:key="`data-${shape.name}`"
			:d="shape.path"
			:fill="color"
			:fill-opacity="data[shape.name] ?? 0"
			fill-rule="evenodd"
			stroke="var(--ui-border)"
			stroke-width="1"
			vector-effect="non-scaling-stroke"
		/>
	</svg>
</template>
