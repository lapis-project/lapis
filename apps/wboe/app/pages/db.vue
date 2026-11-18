<script lang="ts" setup>
import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";
import { computed, h, ref, shallowRef, watch } from "vue";
import type { LocationQueryRaw } from "vue-router";

import { UButton, UCheckbox, UTooltip } from "#components";
import { dbColumns, type DbColumn, type WboeTableRow } from "#shared/utils/db-records";
import {
	dbMaxCollectionIds,
	dbMaxSearchLength,
	dbMaxSearchTerms,
	dbPageSizes,
	parseDbQuery,
	type DbQuery,
	type DbSearchMode,
	type DbSearchTerm,
} from "#shared/utils/db-search";
import { downloadDbRows, type DbExportFormat } from "~/utils/db-export";
import { readDbTerms, writeDbTerms } from "~/utils/db-location";

const { t, n } = useI18n();
const route = useRoute();
const router = useRouter();
const requestFetch = useRequestFetch();
const toast = useToast();
const searchModeItems = computed<Array<{ label: string; value: DbSearchMode }>>(() => [
	{ label: t("DbPage.prefix"), value: "prefix" },
	{ label: t("DbPage.wildcard"), value: "wildcard" },
	{ label: t("DbPage.fuzzy"), value: "fuzzy" },
]);

useSeoMeta({ title: () => t("DbPage.title") });

function updateLocation(query: LocationQueryRaw) {
	return router.replace({ query: { ...route.query, ...query } });
}

const params = computed(() => {
	const { collection_ids, extended, fuzzy, itemsPerPage, mode, page, q, sort, direction } =
		route.query;
	return parseDbQuery({
		collectionIds:
			typeof collection_ids === "string"
				? [...new Set(collection_ids.split(",").filter((id) => /^[1-9]\d{0,9}$/u.test(id)))].slice(
						0,
						dbMaxCollectionIds,
					)
				: [],
		extended: extended === "true",
		mode: mode === "wildcard" ? "wildcard" : fuzzy === "false" ? "prefix" : "fuzzy",
		page:
			typeof page === "string" &&
			/^\d+$/u.test(page) &&
			Number.isSafeInteger(Number(page)) &&
			Number(page) > 0
				? Number(page)
				: undefined,
		pageSize: dbPageSizes.find((size) => String(size) === itemsPerPage),
		sort: dbColumns.some(({ key, sortField }) => key === sort && sortField)
			? { key: sort, descending: direction === "desc" }
			: undefined,
		terms: readDbTerms(q)
			.slice(0, dbMaxSearchTerms)
			.map(({ query, field }) => ({
				field,
				query: query.slice(0, dbMaxSearchLength),
			})),
	});
});

const mode = computed(() => params.value.mode);
const extended = computed(() => params.value.extended);
const remoteCollectionIds = computed({
	get: () => params.value.collectionIds,
	set(ids: string[]) {
		if (ids.join(",") === params.value.collectionIds.join(",")) return;
		if (ids.length > 0) collections.activeLocalIds.value = [];
		void updateLocation({
			collection_ids: ids.join(",") || undefined,
			type: ids.length ? "collection" : undefined,
			page: undefined,
		});
	},
});
const collections = useDbCollections(remoteCollectionIds);
const {
	activeLocalCollections,
	activeLocalIds,
	localCollections,
	localRows,
	localSources,
	remoteCollections,
	storageError,
} = collections;
const showLocal = computed(() => activeLocalCollections.value.length > 0);
const showRemote = computed(() => !showLocal.value && remoteCollectionIds.value.length > 0);
const collectionsOpen = ref(false);

watch(
	() => activeLocalIds.value.join(","),
	() => {
		const { page, collectionIds } = params.value;
		if (showLocal.value && collectionIds.length) {
			remoteCollectionIds.value = [];
		} else if (page !== 1) {
			void updateLocation({ page: undefined });
		}
	},
	{ flush: "sync" },
);
watch(
	() => remoteCollectionIds.value.join(","),
	(ids) => {
		if (ids) activeLocalIds.value = [];
	},
);

let nextTermId = 0;
function makeDraft(terms: DbSearchTerm[]) {
	return (terms.length ? terms : [{ query: "" }]).map((term) => ({ ...term, id: nextTermId++ }));
}

const draftTerms = ref(makeDraft(params.value.terms));
watch(
	() => route.query.q,
	() => {
		const incoming = params.value.terms;
		if (writeDbTerms(incoming) !== writeDbTerms(draftTerms.value)) {
			draftTerms.value = makeDraft(incoming);
		}
	},
);

const searchFields = computed(() => [
	{ label: t("DbPage.allColumns"), value: "all_fields" },
	...dbColumns.flatMap((column) =>
		column.searchField &&
		(!column.extended ||
			extended.value ||
			draftTerms.value.some(({ field }) => field === column.searchField))
			? [{ label: columnLabel(column), value: column.searchField }]
			: [],
	),
]);

function commitSearch(query: LocationQueryRaw = {}) {
	if (showLocal.value || showRemote.value) return;
	const q = writeDbTerms(draftTerms.value);
	if (q !== writeDbTerms(params.value.terms) || Object.keys(query).length) {
		void updateLocation({ q, page: undefined, ...query });
	}
}
const commitTyping = useDebounceFn(commitSearch, 250);

function changeMode(value: DbSearchMode) {
	commitSearch({
		fuzzy: value === "fuzzy" ? undefined : "false",
		mode: value === "wildcard" ? value : undefined,
	});
}

function removeTerm(index: number) {
	if (index > 0) draftTerms.value.splice(index, 1);
	else if (draftTerms.value[0]) draftTerms.value[0].query = "";
	commitSearch();
}

function changeExtended(value: boolean) {
	const sortedColumn = dbColumns.find(({ key }) => key === params.value.sort?.key);
	void updateLocation({
		extended: value ? "true" : undefined,
		q: writeDbTerms(draftTerms.value),
		page: undefined,
		sort: !value && sortedColumn?.extended ? undefined : route.query.sort,
		direction: !value && sortedColumn?.extended ? undefined : route.query.direction,
	});
}

function changeSort(column: DbColumn) {
	const sort = params.value.sort;
	const isSorted = sort?.key === column.key;
	void updateLocation({
		sort: isSorted && sort.descending ? undefined : column.key,
		direction: isSorted && !sort.descending ? "desc" : undefined,
		page: undefined,
	});
}

const remoteQuery = computed<DbQuery | null>(() => {
	if (showLocal.value) return null;
	const { collectionIds, extended, mode, page, pageSize, sort, terms } = params.value;
	return collectionIds.length > 0
		? { collectionIds, extended: false, mode: "fuzzy", page, pageSize, terms: [] }
		: {
				collectionIds,
				extended: extended && terms.some(({ field }) => !field),
				mode: terms.length ? mode : "fuzzy",
				page,
				pageSize,
				sort,
				terms,
			};
});
const remoteQueryKey = computed(() => JSON.stringify(remoteQuery.value));

const { data, status, refresh } = await useAsyncData(
	"wboe-db",
	(_nuxtApp, { signal }) => {
		const body = remoteQuery.value;
		return body
			? requestFetch("/api/db", { method: "POST", body, signal })
			: Promise.resolve({ data: [], totalCount: 0, pageableCount: 0, page: 1 });
	},
	{ watch: [remoteQueryKey], deep: false, dedupe: "cancel" },
);

const collator = new Intl.Collator("de", { numeric: true, sensitivity: "base" });
const sortedLocalRows = computed(() => {
	const sort = params.value.sort;
	if (!showLocal.value || !sort) return localRows.value;
	const { key, descending } = sort;
	return localRows.value.toSorted(
		(a, b) => collator.compare(a[key], b[key]) * (descending ? -1 : 1),
	);
});

const pageSize = computed(
	() => dbPageSizes.find((size) => size === params.value.pageSize) ?? dbPageSizes[0],
);
const totalCount = computed(() =>
	showLocal.value ? localRows.value.length : (data.value?.totalCount ?? 0),
);
const pageableCount = computed(() =>
	showLocal.value ? totalCount.value : (data.value?.pageableCount ?? 0),
);
const page = computed(() => {
	const maxPage = Math.max(1, Math.ceil(pageableCount.value / pageSize.value));
	return Math.min(params.value.page, maxPage);
});
const tableData = computed(() => {
	if (!showLocal.value) return data.value?.data ?? [];
	const offset = (page.value - 1) * pageSize.value;
	return sortedLocalRows.value.slice(offset, offset + pageSize.value);
});
const busy = computed(() => !showLocal.value && status.value === "pending");
const queryError = computed(() => !showLocal.value && status.value === "error");

watch([page, status], () => {
	if ((showLocal.value || status.value === "success") && page.value < params.value.page) {
		void updateLocation({ page: page.value === 1 ? undefined : page.value });
	}
});

const selection = shallowRef(new Map<string, WboeTableRow>());
const selectedRows = computed(() => [...selection.value.values()]);
const rowSelection = computed({
	get: () =>
		Object.fromEntries(
			tableData.value.filter(({ id }) => selection.value.has(id)).map(({ id }) => [id, true]),
		),
	set(values: Record<string, boolean>) {
		const next = new Map(selection.value);
		for (const row of tableData.value) {
			if (values[row.id]) next.set(row.id, row);
			else next.delete(row.id);
		}
		selection.value = next;
	},
});

function createCollection(name: string, includeSelection: boolean) {
	collections.createCollection(name, includeSelection ? selectedRows.value : []);
	if (includeSelection) selection.value = new Map();
}

const visibleColumns = computed(() =>
	dbColumns.filter((column) => extended.value || !column.extended),
);

function columnLabel(column: DbColumn) {
	return t(`DbPage.columns.${column.key}`);
}

const columns = computed<Array<TableColumn<WboeTableRow>>>(() => [
	{
		id: "select",
		header: ({ table }) =>
			h(UCheckbox, {
				modelValue: table.getIsSomePageRowsSelected()
					? "indeterminate"
					: table.getIsAllPageRowsSelected(),
				"onUpdate:modelValue": (value) => table.toggleAllPageRowsSelected(value === true),
				"aria-label": t("DbPage.selectPage"),
				disabled: busy.value || !tableData.value.length,
			}),
		cell: ({ row }) =>
			h(UCheckbox, {
				modelValue: row.getIsSelected(),
				"onUpdate:modelValue": (value) => row.toggleSelected(value === true),
				"aria-label": t("DbPage.selectRow", { lemma: row.original.lemma || row.original.id }),
				disabled: busy.value,
			}),
	},
	...(showLocal.value ? [{ id: "collections", header: t("DbPage.collections") }] : []),
	...visibleColumns.value.map((column): TableColumn<WboeTableRow> => ({
		accessorKey: column.key,
		meta: {
			class: {
				td: [
					"kontext",
					"bedeutungKontext",
					"lautung",
					"bedeutungLautung",
					"bibliographie",
					"frage",
				].includes(column.key)
					? "min-w-44 max-w-72 whitespace-normal"
					: "whitespace-normal",
			},
		},
		header: () => {
			const label = columnLabel(column);
			const sort = params.value.sort;
			const direction =
				sort?.key === column.key && !showRemote.value
					? sort.descending
						? "desc"
						: "asc"
					: undefined;
			const heading =
				column.sortField && !showRemote.value
					? h(UButton, {
							label,
							color: "neutral",
							variant: "ghost",
							size: "xs",
							class: "-my-1.5 -ms-2 text-default hover:text-highlighted",
							trailingIcon:
								direction === "asc"
									? "i-lucide-arrow-up"
									: direction === "desc"
										? "i-lucide-arrow-down"
										: "i-lucide-arrow-up-down",
							"aria-label": t(`DbPage.sort_${direction ?? "none"}`, { column: label }),
							onClick: () => changeSort(column),
						})
					: label;
			return h("div", { class: "flex items-center gap-1.5" }, [
				heading,
				column.key !== "scan"
					? h(
							UTooltip,
							{ text: t(`DbPage.columnInfo.${column.key}`) },
							{
								default: () =>
									h(UButton, {
										"aria-label": t("DbPage.columnHelp", { column: label }),
										icon: "i-lucide-info",
										variant: "ghost",
										color: "neutral",
										size: "xs",
										class: "shrink-0 text-muted",
									}),
							},
						)
					: null,
			]);
		},
	})),
]);

const openScan = ref(false);
const scan = shallowRef<WboeTableRow>();
function showScan(row: WboeTableRow) {
	scan.value = row;
	openScan.value = true;
}

const exporting = ref(false);
async function exportRows(format: DbExportFormat) {
	exporting.value = true;
	try {
		await downloadDbRows(selectedRows.value, visibleColumns.value, format, localSources.value);
	} catch {
		toast.add({ title: t("DbPage.exportError"), color: "error" });
	} finally {
		exporting.value = false;
	}
}

const exportFormats: Array<{ label: string; value: DbExportFormat }> = [
	{ label: "Excel (.xlsx)", value: "xlsx" },
	{ label: "CSV", value: "csv" },
	{ label: "JSON", value: "json" },
];
const exportItems = computed<DropdownMenuItem[][]>(() => [
	exportFormats.map(({ label, value }) => ({ label, onSelect: () => void exportRows(value) })),
	[
		{
			label: t("DbPage.fiduz"),
			icon: "i-lucide-external-link",
			to: "https://lioe.dioe.at/resources?link=materialien%2Ffiduz%2F",
			target: "_blank",
		},
	],
]);
</script>

<template>
	<UContainer class="max-w-screen-2xl py-6 sm:py-10">
		<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
			<h1 class="text-2xl font-semibold text-highlighted sm:text-3xl">{{ t("DbPage.title") }}</h1>
			<div class="flex flex-wrap items-center gap-2">
				<DbSearchHelp />
				<UButton
					color="neutral"
					icon="i-lucide-library"
					:label="t('DbPage.collections')"
					variant="outline"
					@click="collectionsOpen = true"
				/>
			</div>
		</div>

		<section class="space-y-4" :aria-label="t('DbPage.title')">
			<div class="rounded-lg border border-default bg-elevated/30 p-3 sm:p-4">
				<div class="mb-3 flex flex-wrap items-center justify-between gap-3">
					<UFieldGroup class="flex-wrap" :aria-label="t('DbPage.searchMode')" role="group">
						<UButton
							v-for="item in searchModeItems"
							:key="item.value"
							:aria-pressed="item.value === mode"
							:color="item.value === mode ? 'primary' : 'neutral'"
							:disabled="showLocal || showRemote"
							:label="item.label"
							:variant="item.value === mode ? 'soft' : 'outline'"
							size="sm"
							@click="changeMode(item.value)"
						/>
					</UFieldGroup>
					<USwitch
						:model-value="extended"
						:label="t('DbPage.allColumnsToggle')"
						@update:model-value="changeExtended"
					/>
				</div>

				<div v-for="(term, index) in draftTerms" :key="term.id" class="mt-2 flex flex-wrap gap-2">
					<UInput
						v-model="term.query"
						class="min-w-40 flex-1"
						:aria-label="t('DbPage.searchTerm', { number: index + 1 })"
						:disabled="showLocal || showRemote"
						icon="i-lucide-search"
						:maxlength="dbMaxSearchLength"
						:placeholder="t('DbPage.searchPlaceholder')"
						type="search"
						@update:model-value="commitTyping()"
						@keydown.enter="commitSearch()"
					/>
					<USelect
						class="w-46 grow-0"
						:aria-label="t('DbPage.searchColumn', { number: index + 1 })"
						:disabled="showLocal || showRemote"
						:items="searchFields"
						:model-value="term.field ?? 'all_fields'"
						@update:model-value="
							(value) => {
								term.field = value === 'all_fields' ? undefined : value;
								commitSearch();
							}
						"
					/>
					<UButton
						:aria-label="index ? t('DbPage.removeTerm') : t('DbPage.clearTerm')"
						color="neutral"
						:disabled="showLocal || showRemote || (!index && !term.query)"
						:icon="index ? 'i-lucide-minus' : 'i-lucide-x'"
						variant="outline"
						@click="removeTerm(index)"
					/>
				</div>
				<p v-if="showLocal || showRemote" class="mt-2 text-sm text-muted">
					{{ t("DbPage.collectionSearchDisabled") }}
				</p>
				<UButton
					v-else
					class="mt-2"
					color="neutral"
					:disabled="draftTerms.length >= dbMaxSearchTerms"
					icon="i-lucide-plus"
					:label="t('DbPage.addTerm')"
					size="sm"
					variant="ghost"
					@click="draftTerms.push({ id: nextTermId++, query: '' })"
				/>
			</div>

			<div class="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
				<div class="flex flex-wrap items-center gap-2">
					<span>{{ t("DbPage.sources") }}</span>
					<UBadge
						v-for="source in showLocal ? activeLocalCollections : remoteCollections"
						:key="source.id"
						color="neutral"
						variant="soft"
					>
						{{ source.name }}
					</UBadge>
					<UBadge v-if="!showLocal && !showRemote" color="neutral" variant="soft">
						{{ t("DbPage.allRecords") }}
					</UBadge>
				</div>
				<span v-if="!queryError" aria-live="polite">{{
					t("DbPage.resultCount", { count: n(totalCount) }, totalCount)
				}}</span>
			</div>

			<UAlert
				v-if="queryError"
				color="error"
				icon="i-lucide-circle-alert"
				:title="t('DbPage.error')"
				:actions="[{ label: t('DbPage.retry'), variant: 'outline', onClick: () => refresh() }]"
			/>
			<div v-else class="overflow-hidden rounded-lg border border-default">
				<UTable
					v-model:row-selection="rowSelection"
					class="max-h-[58vh] min-h-40 overflow-auto"
					:aria-busy="busy"
					:columns="columns"
					:data="tableData"
					:empty="t('DbPage.empty')"
					:get-row-id="(row) => row.id"
					:loading="busy"
					:ui="{ th: 'px-3 py-2.5', td: 'px-3 py-2.5 align-top', thead: 'bg-default' }"
					:watch-options="{ deep: false }"
					sticky
					@select="
						(_event, row) => {
							if (!busy) row.toggleSelected();
						}
					"
				>
					<template #scan-cell="{ row }">
						<UButton
							v-if="row.original.scan"
							:aria-label="t('DbPage.openScan', { lemma: row.original.lemma || row.original.id })"
							icon="i-lucide-image"
							size="xs"
							variant="ghost"
							@click.stop="showScan(row.original)"
						/>
					</template>
					<template #lautung-cell="{ row }">
						<span class="db-transcription italic">{{ row.original.lautung }}</span>
					</template>
					<template #lemma-cell="{ row }">
						<span class="db-transcription">{{ row.original.lemma }}</span>
					</template>
					<template #nebenlemma-cell="{ row }">
						<span class="db-transcription">{{ row.original.nebenlemma }}</span>
					</template>
					<template #kontext-cell="{ row }">
						<span class="db-transcription italic">{{ row.original.kontext }}</span>
					</template>
					<template #collections-cell="{ row }">
						<div class="flex flex-wrap gap-1">
							<UBadge
								v-for="name in localSources.get(row.id)"
								:key="name"
								color="neutral"
								variant="soft"
							>
								{{ name }}
							</UBadge>
						</div>
					</template>
				</UTable>

				<div
					class="flex flex-wrap items-center justify-between gap-3 border-t border-default px-3 py-2.5"
				>
					<UFormField :label="t('DbPage.pageSize')" size="sm" class="flex items-center gap-3">
						<USelect
							:items="[...dbPageSizes]"
							:model-value="pageSize"
							size="sm"
							@update:model-value="
								(value) =>
									updateLocation({
										itemsPerPage: value === dbPageSizes[0] ? undefined : value,
										page: undefined,
									})
							"
						/>
					</UFormField>
					<UPagination
						v-if="pageableCount > pageSize"
						:disabled="busy"
						:items-per-page="pageSize"
						:page="page"
						:show-edges="false"
						:total="pageableCount"
						@update:page="(value) => updateLocation({ page: value === 1 ? undefined : value })"
					/>
				</div>
			</div>

			<p v-if="!queryError && totalCount > pageableCount" class="text-sm text-muted">
				{{ t("DbPage.resultLimit", { count: n(pageableCount) }) }}
			</p>

			<div
				v-if="selectedRows.length"
				class="flex flex-wrap items-center gap-2 rounded-lg border border-default bg-elevated/50 p-3"
			>
				<span class="mr-auto text-sm font-medium text-highlighted" aria-live="polite">
					{{ t("DbPage.selectedCount", { count: n(selectedRows.length) }, selectedRows.length) }}
				</span>
				<UButton
					color="neutral"
					icon="i-lucide-library"
					:label="t('DbPage.saveSelection')"
					variant="outline"
					@click="collectionsOpen = true"
				/>
				<UDropdownMenu :items="exportItems">
					<UButton
						icon="i-lucide-download"
						:label="t('DbPage.export')"
						:loading="exporting"
						trailing-icon="i-lucide-chevron-down"
					/>
				</UDropdownMenu>
				<UButton
					:aria-label="t('DbPage.clearSelection')"
					color="neutral"
					icon="i-lucide-x"
					:title="t('DbPage.clearSelection')"
					variant="ghost"
					@click="selection = new Map()"
				/>
			</div>
		</section>

		<DbScanDialog v-model:open="openScan" :facs="scan?.scan ?? ''" :lemma="scan?.lemma ?? ''" />
		<DbCollections
			v-model:open="collectionsOpen"
			v-model:active-local-ids="activeLocalIds"
			v-model:remote-ids="remoteCollectionIds"
			:local-collections="localCollections"
			:remote-collections="remoteCollections"
			:selected-count="selectedRows.length"
			:storage-error="storageError"
			@add="collections.addToCollection($event, selectedRows)"
			@copy="(name, rows) => collections.createCollection(name, rows)"
			@create="createCollection"
			@export="collections.exportCollection"
			@import="collections.importCollection"
			@remember-remote="collections.rememberRemoteCollection"
			@remove="collections.removeCollection"
			@rename="collections.renameCollection"
		/>
	</UContainer>
</template>

<style scoped>
.db-transcription {
	font-family: Fiduz, var(--font-sans), sans-serif;
}
</style>
