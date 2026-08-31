<script lang="ts" setup>
import { MapIcon, RotateCcwIcon } from "@lucide/vue";
import type { TableColumn } from "@nuxt/ui";

import type { LocatedEntry } from "@/utils/dataset";
import {
	buildDatasetEntries,
	type DatasetField,
	datasetFields,
	detectFieldMapping,
	type FieldMapping,
	MAX_DATASET_ROWS,
	requiredDatasetFields,
} from "@/utils/dataset-import";
import { readTabularFile, type TabularData } from "@/utils/tabular-data";

const t = useTranslations();
const toast = useToast();
const datasetStore = useDatasetStore();

const file = ref<File | null>(null);
const parsed = ref<TabularData | null>(null);
const parseError = ref<string | null>(null);
const mapping = ref<FieldMapping>({});
const name = ref("");

/** Reka UI reserves the empty string for "no selection", so the opt-out needs its own value. */
const NO_COLUMN = "__none__";

const columnItems = computed(() => [
	{ label: t("DatasetUpload.no-column"), value: NO_COLUMN },
	...(parsed.value?.columns ?? []).map((column) => ({ label: column, value: column })),
]);

const missingFields = computed(() =>
	requiredDatasetFields.filter((field) => !mapping.value[field]),
);

const result = computed(() => {
	if (!parsed.value || missingFields.value.length > 0) return null;
	return buildDatasetEntries(parsed.value.rows, mapping.value);
});

const preview = computed(() => result.value?.entries.slice(0, 8) ?? []);

const warnings = computed(() => {
	const report = result.value?.report;
	if (!report) return [];
	return (
		[
			{ key: "skipped-coordinates", count: report.skippedCoordinates },
			{ key: "skipped-variable", count: report.skippedVariable },
			{ key: "skipped-variant", count: report.skippedVariant },
			{ key: "outside-regions", count: report.outsideRegions },
			{ key: "truncated", count: report.truncated },
		] as const
	).filter((warning) => warning.count > 0);
});

function clearParsedFile() {
	parsed.value = null;
	parseError.value = null;
	mapping.value = {};
}

async function readFile(next: File | null) {
	clearParsedFile();
	if (!next) return;

	try {
		const data = await readTabularFile(next);
		parsed.value = data;
		mapping.value = detectFieldMapping(data.columns);
		name.value = next.name.replace(/\.[^.]+$/, "");
	} catch {
		parseError.value = t("DatasetUpload.errors.parse");
	}
}

watch(file, (next) => {
	void readFile(next);
});

function reset() {
	file.value = null;
	name.value = "";
	clearParsedFile();
}

function save() {
	const built = result.value;
	if (!built || built.entries.length === 0) return;

	const dataset = datasetStore.addDataset(name.value, built.entries);
	toast.add({
		title: t("DatasetUpload.saved", { name: dataset.name }),
		description: datasetStore.persistenceFailed
			? t("DatasetUpload.errors.storage")
			: t("DatasetUpload.saved-hint"),
		color: datasetStore.persistenceFailed ? "warning" : "success",
	});
	reset();
}

function fieldLabel(field: DatasetField) {
	return t(`DatasetUpload.fields.${field}`);
}

const previewColumns = computed<Array<TableColumn<LocatedEntry>>>(() => [
	{ accessorKey: "Ort", header: fieldLabel("Ort") },
	{ accessorKey: "Item", header: fieldLabel("Item") },
	{ accessorKey: "Benennungsvariante", header: fieldLabel("Benennungsvariante") },
	{
		id: "Variante",
		accessorFn: (entry) => entry.Variante ?? "—",
		header: fieldLabel("Variante"),
	},
	{
		id: "region",
		accessorFn: (entry) => entry.region ?? t("DatasetUpload.outside"),
		header: t("DatasetUpload.region"),
	},
]);
</script>

<template>
	<section class="rounded-lg border p-5 flex flex-col gap-5">
		<div>
			<h2 class="font-semibold">{{ t("DatasetUpload.title") }}</h2>
			<p class="text-sm text-muted-foreground">{{ t("DatasetUpload.description") }}</p>
		</div>

		<UFileUpload
			v-model="file"
			accept=".csv,.tsv,.txt,.json,.geojson"
			:description="t('DatasetUpload.dropzone-description')"
			icon="i-lucide-upload"
			:label="t('DatasetUpload.dropzone-label')"
			layout="list"
		/>

		<div class="flex flex-wrap gap-2">
			<UButton v-if="parsed" class="gap-2" size="sm" variant="ghost" @click="reset">
				<RotateCcwIcon class="size-4"></RotateCcwIcon>
				{{ t("DatasetUpload.reset") }}
			</UButton>
		</div>

		<UAlert
			v-if="parseError"
			color="error"
			:description="parseError"
			icon="i-lucide-triangle-alert"
			:title="t('DatasetUpload.errors.title')"
			variant="subtle"
		/>

		<template v-if="parsed">
			<div>
				<h3 class="font-semibold text-sm mb-1">{{ t("DatasetUpload.mapping-title") }}</h3>
				<p class="text-sm text-muted-foreground mb-3">
					{{ t("DatasetUpload.mapping-description", { rows: parsed.rows.length }) }}
				</p>
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<label v-for="field in datasetFields" :key="field" class="flex flex-col gap-1">
						<span class="text-xs uppercase font-semibold text-muted-foreground">
							{{ fieldLabel(field) }}
							<span v-if="requiredDatasetFields.includes(field)" class="text-error">*</span>
						</span>
						<USelect
							:items="columnItems"
							:model-value="mapping[field] ?? NO_COLUMN"
							size="sm"
							variant="outline"
							@update:model-value="
								(value: string) => {
									mapping = { ...mapping, [field]: value === NO_COLUMN ? undefined : value };
								}
							"
						/>
					</label>
				</div>
			</div>

			<UAlert
				v-if="missingFields.length"
				color="warning"
				:description="
					t('DatasetUpload.errors.missing-fields', {
						fields: missingFields.map(fieldLabel).join(', '),
					})
				"
				icon="i-lucide-triangle-alert"
				:title="t('DatasetUpload.errors.title')"
				variant="subtle"
			/>

			<template v-if="result">
				<div class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
					<div>
						<span class="text-muted-foreground">{{ t("DatasetUpload.summary.imported") }}: </span>
						<span class="font-semibold">{{ result.report.imported }}</span>
						<span class="text-muted-foreground"> / {{ result.report.total }}</span>
					</div>
					<div>
						<span class="text-muted-foreground">{{ t("DatasetUpload.summary.variables") }}: </span>
						<span class="font-semibold">{{ result.report.variables.length }}</span>
					</div>
					<div>
						<span class="text-muted-foreground">{{ t("DatasetUpload.summary.variants") }}: </span>
						<span class="font-semibold">{{ result.report.variants }}</span>
					</div>
				</div>

				<ul v-if="warnings.length" class="text-xs text-muted-foreground space-y-1">
					<li v-for="warning in warnings" :key="warning.key" class="flex items-center gap-1.5">
						<span class="size-1.5 rounded-full bg-warning shrink-0"></span>
						{{ t(`DatasetUpload.warnings.${warning.key}`, { count: warning.count }) }}
					</li>
				</ul>

				<UTable
					v-if="preview.length"
					:columns="previewColumns"
					:data="preview"
					:get-row-id="(entry: LocatedEntry) => String(entry.iddoc)"
				/>

				<div class="flex flex-wrap items-end gap-3">
					<label class="flex flex-col gap-1 grow max-w-80">
						<span class="text-xs uppercase font-semibold text-muted-foreground">
							{{ t("DatasetUpload.name") }}
						</span>
						<UInput v-model="name" :placeholder="t('DatasetUpload.name-placeholder')" />
					</label>
					<UButton
						class="gap-2"
						:disabled="result.report.imported === 0"
						data-testid="save-dataset"
						@click="save"
					>
						<MapIcon class="size-4"></MapIcon>
						{{ t("DatasetUpload.save") }}
					</UButton>
				</div>

				<p class="text-xs text-muted-foreground">
					{{ t("DatasetUpload.limit", { max: MAX_DATASET_ROWS }) }}
				</p>
			</template>
		</template>
	</section>
</template>
