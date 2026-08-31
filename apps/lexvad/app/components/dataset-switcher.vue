<script lang="ts" setup>
import { DatabaseIcon, FlaskConicalIcon } from "@lucide/vue";

import { useMapDataset } from "@/stores/use-dataset-store";

const props = defineProps<{
	mapId: string;
}>();

const t = useTranslations();
const datasetStore = useDatasetStore();
const datasetId = useMapDataset(props.mapId);

const items = computed(() =>
	datasetStore.datasets.map((dataset) => ({
		label: dataset.custom ? (dataset.name ?? dataset.id) : t("DatasetSwitcher.pilot-dataset"),
		value: dataset.id,
	})),
);

const dataset = computed(() => datasetStore.datasetInfo(datasetId.value));
</script>

<template>
	<div class="flex flex-wrap items-center gap-x-3 gap-y-2">
		<span class="uppercase text-muted font-semibold text-xs flex items-center gap-1.5">
			<DatabaseIcon class="size-4"></DatabaseIcon>
			{{ t("DatasetSwitcher.label") }}
		</span>
		<USelect
			v-model="datasetId"
			class="min-w-52"
			data-testid="dataset"
			:items="items"
			size="sm"
			variant="outline"
		/>
		<span class="text-xs text-muted-foreground">
			{{ t("DatasetSwitcher.entries", dataset.size) }}
		</span>
		<UBadge v-if="dataset.custom" class="gap-1" color="warning" size="sm" variant="subtle">
			<FlaskConicalIcon class="size-3"></FlaskConicalIcon>
			{{ t("DatasetSwitcher.custom-badge") }}
		</UBadge>
		<ULink
			class="ml-auto text-xs text-muted-foreground underline underline-offset-4"
			to="/custom-data"
		>
			{{ t("DatasetSwitcher.manage") }}
		</ULink>
	</div>
</template>
