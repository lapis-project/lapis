<script lang="ts" setup>
import { DownloadIcon, MapIcon, SearchIcon } from "@lucide/vue";
import type { TableColumn } from "@nuxt/ui";
import { refDebounced } from "@vueuse/core";

import { type CsvColumn, downloadCsv, toCsv } from "@/utils/csv";
import type { LocatedEntry } from "@/utils/dataset";
import { type EntryField, exportFields } from "@/utils/dataset-fields";
import { matchesSearch } from "@/utils/search";

type Row = LocatedEntry & { variants: Array<string> };

/** Phenomenon and coordinates are left out: the first is selected above, the second is on the map. */
const tableFields: Array<EntryField> = [
	"Id",
	"Benennungsvariante",
	"Variante",
	"Ort",
	"PLZ",
	"Kreis",
	"bundesland",
	"region",
	"Land",
];

const SEARCH_KEY = "s";

const t = useTranslations();
const { locale } = useI18n();
const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();
const datasetStore = useDatasetStore();
const UButton = resolveComponent("UButton");

// Shares the selection of the left map, so switching between map and table keeps the phenomenon.
const { sidebars, updateSidebar } = useMapSidebars({ split: false });
const selection = computed(() => sidebars.value.left);
const datasetId = computed(() => datasetStore.datasetForMap("left"));

const { filterDataByQuestionAndVariant } = useQuestions(datasetId);
const { variantColors } = useMapData(
	"left",
	datasetId,
	() => selection.value.question,
	() => selection.value.selectedVariants,
);

const entries = computed<Array<Row>>(() =>
	filterDataByQuestionAndVariant(selection.value.question),
);

const rows = computed(() => {
	const selected = selection.value.selectedVariants;
	if (selected.length === 0) return entries.value;
	return entries.value.filter((entry) => entry.variants.some((v) => selected.includes(v)));
});

function cellValue(row: Row, field: EntryField) {
	if (field === "Benennungsvariante") return row.variants.join("; ");
	const value = row[field];
	return value === undefined || value === "" ? undefined : String(value);
}

// Uploaded datasets often lack optional columns, which would otherwise stay empty.
const visibleFields = computed(() =>
	tableFields.filter((field) =>
		entries.value.some((entry) => cellValue(entry, field) !== undefined),
	),
);

const search = ref(typeof route.query[SEARCH_KEY] === "string" ? route.query[SEARCH_KEY] : "");
const debouncedSearch = refDebounced(search, 150);

const filteredRows = computed(() =>
	rows.value.filter((row) =>
		matchesSearch(
			visibleFields.value.map((field) => cellValue(row, field)),
			debouncedSearch.value,
		),
	),
);

watch(debouncedSearch, (value) => {
	const { [SEARCH_KEY]: _previous, ...query } = route.query;
	void router.replace({ query: value.trim() ? { ...query, [SEARCH_KEY]: value } : query });
});

const collator = computed(
	() => new Intl.Collator(locale.value, { numeric: true, sensitivity: "base" }),
);

const columns = computed<Array<TableColumn<Row>>>(() =>
	visibleFields.value.map((field) => ({
		id: field,
		accessorFn: (row) => cellValue(row, field),
		sortUndefined: "last",
		sortingFn: (a, b, id) => collator.value.compare(a.getValue<string>(id), b.getValue<string>(id)),
		header: ({ column }) => {
			const sorted = column.getIsSorted();
			return h(UButton, {
				color: "neutral",
				variant: "ghost",
				label: t(`DatasetFields.${field}`),
				trailingIcon:
					sorted === "asc"
						? "i-lucide-arrow-up"
						: sorted === "desc"
							? "i-lucide-arrow-down"
							: "i-lucide-arrow-up-down",
				class: "-mx-2.5 uppercase text-xs",
				onClick: () => column.toggleSorting(sorted === "asc"),
			});
		},
	})),
);

const table = useTemplateRef("table");

// The original values, not the split variants, so an export can be uploaded again unchanged.
const csvColumns: Array<CsvColumn<Row>> = exportFields.map((field) => ({
	header: field,
	value: (row) => row[field],
}));

function download() {
	// Exports what the table shows, in the order it is sorted.
	const sortedRows =
		table.value?.tableApi.getRowModel().rows.map((row: { original: Row }) => row.original) ??
		filteredRows.value;
	const date = new Date().toISOString().slice(0, 10);
	downloadCsv(`lexvad-${selection.value.question}-${date}`, toCsv(csvColumns, sortedRows));
}

const mapLink = computed(() => {
	const { [SEARCH_KEY]: _search, ...query } = route.query;
	return localePath({ path: "/map", query });
});
</script>

<template>
	<div class="flex min-h-0">
		<div class="container mx-auto flex min-w-0 flex-1 flex-col gap-5 px-4">
			<PhenomenonSelection
				v-model:question="sidebars.left.question"
				v-model:variants="sidebars.left.selectedVariants"
				:compare="false"
				map-id="left"
				@toggle-sidebar="(question, variant) => updateSidebar('left', question, variant)"
			/>

			<div class="flex flex-col gap-3">
				<div class="flex flex-wrap items-center gap-3">
					<div class="mr-auto text-lg font-semibold" role="status">
						<template v-if="filteredRows.length === rows.length">
							{{ t("DbPage.results", { n: rows.length }, rows.length) }}
						</template>
						<template v-else>
							{{
								t(
									"DbPage.results-filtered",
									{ n: filteredRows.length, total: rows.length },
									rows.length,
								)
							}}
						</template>
					</div>
					<UInput
						v-model="search"
						class="w-full sm:w-72"
						:aria-label="t('DbPage.search')"
						data-testid="table-search"
						:placeholder="t('DbPage.search')"
						type="search"
						variant="outline"
					>
						<template #leading>
							<SearchIcon class="size-4 text-muted-foreground" />
						</template>
					</UInput>
					<UButton class="gap-2" :to="mapLink" variant="outline">
						<MapIcon class="size-4" />
						{{ t("DbPage.show-on-map") }}
					</UButton>
					<UButton
						class="gap-2"
						data-testid="download"
						:disabled="filteredRows.length === 0"
						@click="download"
					>
						<DownloadIcon class="size-4" />
						{{ t("DbPage.download") }}
					</UButton>
				</div>

				<UTable
					ref="table"
					class="h-[600px] rounded-lg border"
					:columns="columns"
					:data="filteredRows"
					:empty="search.trim() ? t('DbPage.no-matches') : t('DbPage.no-entries')"
					sticky
					:ui="{ thead: 'bg-default', td: 'py-2.5' }"
					:virtualize="{ estimateSize: 45, overscan: 20 }"
				>
					<template #Benennungsvariante-cell="{ row }">
						<div class="flex flex-wrap gap-1">
							<span
								v-for="variant in row.original.variants"
								:key="variant"
								class="flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs"
							>
								<span
									class="size-2 shrink-0 rounded-full"
									:style="{ backgroundColor: variantColors[variant] }"
								></span>
								{{ variant }}
							</span>
						</div>
					</template>
					<template #Variante-cell="{ row }">
						<span class="font-serif tracking-wider">{{ row.original.Variante }}</span>
					</template>
				</UTable>
			</div>
		</div>

		<AppSidebar
			v-model:open="sidebars.left.open"
			:active-question="sidebars.left.question"
			:active-variant="sidebars.left.variant"
			map-id="left"
			side="right"
		/>
	</div>
</template>
