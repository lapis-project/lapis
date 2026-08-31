<script lang="ts" setup>
import { MapIcon, Trash2Icon } from "@lucide/vue";

const t = useTranslations();
const locale = useLocale();
const localePath = useLocalePath();
const datasetStore = useDatasetStore();

const dateFormat = computed(
	() => new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" }),
);

const datasets = computed(() =>
	datasetStore.customDatasets.map((dataset) => ({
		id: dataset.id,
		name: dataset.name,
		createdAt: dateFormat.value.format(new Date(dataset.createdAt)),
		mapLink: localePath({ path: "/map", query: { dataset: dataset.id } }),
		places: dataset.entries.length,
		variables: new Set(dataset.entries.map((entry) => entry.Item)).size,
	})),
);
</script>

<template>
	<section class="rounded-lg border p-5 flex flex-col gap-4">
		<div>
			<h2 class="font-semibold">{{ t("DatasetList.title") }}</h2>
			<p class="text-sm text-muted-foreground">{{ t("DatasetList.description") }}</p>
		</div>

		<p v-if="datasets.length === 0" class="text-sm text-muted-foreground">
			{{ t("DatasetList.empty") }}
		</p>

		<ul v-else class="flex flex-col gap-2">
			<li
				v-for="dataset in datasets"
				:key="dataset.id"
				class="flex flex-wrap items-center gap-3 rounded-lg border p-3"
			>
				<div class="min-w-0 grow">
					<p class="font-medium truncate">{{ dataset.name }}</p>
					<p class="text-xs text-muted-foreground">
						{{ t("DatasetSwitcher.entries", dataset.places) }} ·
						{{ t("DatasetList.variables", dataset.variables) }} ·
						{{ dataset.createdAt }}
					</p>
				</div>
				<UButton class="gap-2" size="sm" :to="dataset.mapLink" variant="outline">
					<MapIcon class="size-4"></MapIcon>
					{{ t("DatasetList.show-on-map") }}
				</UButton>
				<UButton
					class="gap-2"
					color="error"
					size="sm"
					variant="ghost"
					@click="datasetStore.removeDataset(dataset.id)"
				>
					<Trash2Icon class="size-4"></Trash2Icon>
					<span class="sr-only">{{ t("DatasetList.remove") }}</span>
				</UButton>
			</li>
		</ul>
	</section>
</template>
