<script lang="ts" setup>
import { SankeyChart } from "echarts/charts";
import { TooltipComponent, GraphicComponent } from "echarts/components";
import { use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import VChart from "vue-echarts";

import type { VariantFlowLink, VariantFlowNode } from "~/composables/use-phenomenon-comparison";

use([SankeyChart, TooltipComponent, GraphicComponent, SVGRenderer]);

const props = defineProps<{
	left: string;
	right: string;
	data: Array<VariantFlowLink>;
}>();

const columnLabels = computed(() => [props.left, props.right]);

const chartData = computed(() => {
	const nodes = new Map<
		string,
		{
			name: string;
			text: string;
			depth: number;
			itemStyle: { color?: string };
			label: { position: "left" | "right"; width: number };
		}
	>();
	function node(side: "left" | "right", { id, label, color }: VariantFlowNode) {
		const name = `${side}:${id}`;
		nodes.set(name, {
			name,
			text: label,
			depth: side === "left" ? 0 : 1,
			itemStyle: { color },
			label: { position: side, width: labelWidth(side) },
		});
		return name;
	}
	const links = props.data.map((link) => ({
		source: node("left", link.source),
		target: node("right", link.target),
		value: link.value,
		sourceLabel: link.source.label,
		targetLabel: link.target.label,
	}));
	return { nodes: [...nodes.values()], links };
});

const dimensions = { LEFT: 120, RIGHT: 120, TOP: 50, BOTTOM: 20, NODE_WIDTH: 20 };
const LABEL_GAP = 5;

function labelWidth(side: "left" | "right") {
	return (side === "left" ? dimensions.LEFT : dimensions.RIGHT) - LABEL_GAP;
}

const container = useTemplateRef("container");
const width = ref(0);
const textStyle = ref({ fontFamily: "", color: "var(--foreground)" });
function readTextStyle() {
	if (!container.value) return;
	const { fontFamily, color } = getComputedStyle(container.value);
	textStyle.value = { fontFamily, color };
}

const colorMode = useColorMode();
watch(() => colorMode.value, readTextStyle, { flush: "post" });

let ro: ResizeObserver;
onMounted(() => {
	ro = new ResizeObserver(([e]) => (width.value = e?.contentRect.width ?? 0));
	readTextStyle();
	if (container.value) ro.observe(container.value);
});
onBeforeUnmount(() => ro?.disconnect());

const option = computed(() => {
	const columnPositions = [
		{ x: dimensions.LEFT - LABEL_GAP, textAlign: "right", width: labelWidth("left") },
		{
			x: width.value - dimensions.RIGHT + LABEL_GAP,
			textAlign: "left",
			width: labelWidth("right"),
		},
	];
	return {
		tooltip: {
			trigger: "item",
			textStyle: { fontFamily: textStyle.value.fontFamily },
			formatter: ({
				dataType,
				data,
				value,
			}: {
				dataType: string;
				data: { text?: string; sourceLabel?: string; targetLabel?: string };
				value: number;
			}) =>
				dataType === "edge"
					? `${data.sourceLabel} → ${data.targetLabel}: ${value}`
					: `${data.text}: ${value}`,
		},
		graphic: columnLabels.value.map((text, d) => ({
			type: "text",
			x: columnPositions[d]?.x,
			y: dimensions.TOP - 15,
			style: {
				text,
				textAlign: columnPositions[d]?.textAlign,
				verticalAlign: "bottom",
				width: columnPositions[d]?.width,
				overflow: "break",
				fontWeight: "var(--font-weight-semibold)",
				fontSize: 12,
				fontFamily: textStyle.value.fontFamily,
				fill: textStyle.value.color,
			},
		})),
		series: [
			{
				type: "sankey",
				left: dimensions.LEFT,
				right: dimensions.RIGHT,
				top: dimensions.TOP,
				bottom: dimensions.BOTTOM,
				nodeWidth: dimensions.NODE_WIDTH,
				emphasis: { focus: "adjacency" },
				lineStyle: { color: "gradient", opacity: 0.4 },
				label: {
					formatter: ({ data }: { data: { text: string } }) => data.text,
					...textStyle.value,
					textBorderWidth: 0,
					overflow: "break",
				},
				data: chartData.value.nodes,
				links: chartData.value.links,
			},
		],
	};
});
</script>

<template>
	<div ref="container" :style="{ height: '400px', width: '100%' }">
		<VChart v-if="width" :option="option" autoresize />
	</div>
</template>
