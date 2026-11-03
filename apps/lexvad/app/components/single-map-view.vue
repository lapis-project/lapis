<script lang="ts" setup>
import type { LocationQueryRaw } from "vue-router";

import { useMapDataset } from "@/stores/use-dataset-store";
import { hexagonRadius, type MapMode } from "@/utils/map-mode";

const props = withDefaults(
	defineProps<{
		mapId: string;
		splitMode?: boolean;
		embedQuery?: LocationQueryRaw;
	}>(),
	{
		splitMode: false,
	},
);

const emit = defineEmits<{
	"toggle-compare-mode": [];
	"toggle-sidebar": [question: string | null, variant: string | undefined];
	"match-colors": [];
}>();

const datasetId = useMapDataset(props.mapId);
const t = useTranslations();

const activeQuestion = defineModel<string>("question", { default: "Gießkanne" });

const activeVariants = defineModel<Array<string>>("variants", { default: () => [] });
const mapMode = defineModel<MapMode>("mode", { default: "point" });
const radius = defineModel<number>("radius", { default: hexagonRadius.default });

const { data, legendEntries, uniqueVariants, variantColors } = useMapData(
	props.mapId,
	datasetId,
	activeQuestion,
	activeVariants,
);
</script>

<template>
	<div class="relative flex flex-col gap-5">
		<PhenomenonSelection
			:map-id="mapId"
			:split-mode="splitMode"
			:embed-query="embedQuery"
			v-model:question="activeQuestion"
			v-model:variants="activeVariants"
			@match-colors="emit('match-colors')"
			@toggle-compare-mode="emit('toggle-compare-mode')"
			@toggle-sidebar="(question, variants) => emit('toggle-sidebar', question, variants)"
		></PhenomenonSelection>
		<VisualisationContainer v-slot="{ height, width }" class="border h-[600px]" :fullscreen="false">
			<MapLegend
				v-if="uniqueVariants.length"
				id="variantLegend"
				class="absolute bottom-4 right-0 z-10 mr-4 max-h-[70%] overflow-y-auto"
				:data="legendEntries"
				:format-count="(count) => t('MapsPage.sidebar.places', count)"
				:title="t('MapsPage.legend.title')"
			/>
			<div v-if="height && width" class="w-full h-full">
				<GeoMap v-model:mode="mapMode" v-model:radius="radius" :colors="variantColors" :data="data">
				</GeoMap>
			</div>
		</VisualisationContainer>
	</div>
</template>
