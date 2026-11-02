<script lang="ts" setup>
import { X } from "@lucide/vue";

import { mapQueryPositions as positions, serializeMapQuery } from "@/utils/map-query";
import { PILOT_DATASET_ID } from "@/utils/pilot-data";

const t = useTranslations();
const datasetStore = useDatasetStore();
const colorStore = useColorStore();

const { sidebars, splitMode, currentState, updateSidebar, matchColors } = useMapSidebars();

function closeSplitMode() {
	splitMode.value = false;
	sidebars.value.right.open = false;
}

const embedQueries = computed(() =>
	Object.fromEntries(
		positions.map((position) => [
			position,
			datasetStore.datasetForMap(position) === PILOT_DATASET_ID
				? serializeMapQuery({
						palette: colorStore.activePaletteId,
						maps: { left: currentState(position) },
					})
				: undefined,
		]),
	),
);
</script>

<template>
	<div class="flex min-h-0">
		<AppSidebar
			v-if="splitMode"
			v-model:open="sidebars.left.open"
			:active-question="sidebars.left.question"
			:active-variant="sidebars.left.variant"
			side="left"
			map-id="left"
		></AppSidebar>

		<div class="container mx-auto min-w-0 flex-1 px-4">
			<div class="flex gap-5 justify-center relative">
				<SingleMapView
					class="min-w-0 flex-1"
					:split-mode="splitMode"
					@match-colors="matchColors('left')"
					@toggle-compare-mode="splitMode = true"
					@toggle-sidebar="(question, variant) => updateSidebar('left', question, variant)"
					v-model:question="sidebars.left.question"
					v-model:variants="sidebars.left.selectedVariants"
					v-model:mode="sidebars.left.mode"
					v-model:radius="sidebars.left.radius"
					:embed-query="embedQueries.left"
					map-id="left"
				/>
				<template v-if="splitMode">
					<div class="divide-accent border-l h-150 self-end"></div>
					<SingleMapView
						class="min-w-0 flex-1"
						:split-mode="splitMode"
						@match-colors="matchColors('right')"
						@toggle-sidebar="(question, variant) => updateSidebar('right', question, variant)"
						v-model:question="sidebars.right.question"
						v-model:variants="sidebars.right.selectedVariants"
						v-model:mode="sidebars.right.mode"
						v-model:radius="sidebars.right.radius"
						:embed-query="embedQueries.right"
						map-id="right"
					/>
					<UButton
						class="absolute right-0 top-0 size-6 p-1 m-1 text-muted-foreground"
						variant="ghost"
						@click="closeSplitMode"
					>
						<X></X>
						<span class="sr-only">{{ t("MapsPage.controls.close-split-view") }}</span>
					</UButton>
				</template>
			</div>
		</div>

		<AppSidebar
			v-if="splitMode"
			v-model:open="sidebars.right.open"
			:active-question="sidebars.right.question"
			:active-variant="sidebars.right.variant"
			map-id="right"
			side="right"
		></AppSidebar>
		<AppSidebar
			v-else
			v-model:open="sidebars.left.open"
			:active-question="sidebars.left.question"
			:active-variant="sidebars.left.variant"
			map-id="left"
			side="right"
		></AppSidebar>
	</div>
</template>
