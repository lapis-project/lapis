<script lang="ts" setup>
import { refDebounced } from "@vueuse/core";
import type { InferResponseType } from "hono/client";

import { InfoIcon, RotateCcw } from "lucide-vue-next";

import type { SortOder, TableColumn } from "@/components/data-table.vue";
import type { DropdownOption } from "@/types/dropdown-option";

import { registerOptions, specialOrder } from "@/assets/data/static-filter-data";

const t = useTranslations();
const env = useRuntimeConfig();
const { apiClient } = useApiClient();

usePageMetadata({
	title: t("DbPage.meta.title"),
});

const _getPhenomenons = apiClient.questions.survey[":project"].$get;
type APIPhenomenons = InferResponseType<typeof _getPhenomenons, 200>;
const { data: questions } = await useFetch<APIPhenomenons>("/questions/survey/1", {
	baseURL: env.public.apiBaseUrl,
	method: "GET",
	credentials: "include",
});

const mappedQuestions = computed(() => {
	return (
		questions.value?.map((q) => ({
			id: q.id,
			value: q.id.toString(),
			label: q.phenomenon_name,
		})) ?? []
	);
});

const activeRegistersQuery = computed(() => {
	if (activeRegisters.value.includes("all")) {
		return null;
	} else {
		return activeRegisters.value.map((r) => Number(r));
	}
});

// TODO MAYBE RETHINK ENDPOINT, THE CURRENT MAPPING IS KINDA EXCESSIVE
// const _getVarieties = apiClient.questions.variety.$get;
// type APIVarieties = InferResponseType<typeof _getVarieties, 200>;
// const { data: varieties } = await useFetch<APIVarieties>("/questions/variety", {
// 	baseURL: env.public.apiBaseUrl,
// 	method: "GET",
// });

// const mappedVarieties = computed(() => {
// 	return (
// 		varieties.value?.map((q) => ({
// 			id: q.variety_entry.id,
// 			value: q.variety_entry.,
// 			label: q.phenomenon_name,
// 		})) ?? null
// 	);
// });

const activeAgeGroup = ref([10, 100]);
const activeQuestion = ref<string>("11");
const activePageSizeQuery = ref<number>(100);
const activePageSize = ref<string>("100");
const activeRegisters = ref<Array<string>>(["all"]);
const activeVariants = ref<Array<string>>([]);
// const debouncedActiveAgeGroup = refDebounced(activeAgeGroup, 250); // using debounce prevents useFetch's native req cancelling
const activeQuestionId = computed(() => parseInt(activeQuestion.value));
const activeSortLabel = ref<string | null>(null);
const activeSortDirection = ref<SortOder | null>(null);

const currentPage = ref(1);

const _getAnnotations = apiClient.questions.annotation[":project"].$get;
type APIAnnotation = InferResponseType<typeof _getAnnotations, 200>;
const { data: annotations } = await useFetch<APIAnnotation>("/questions/annotation/1", {
	query: {
		phenomenon: activeQuestionId,
	},
	baseURL: env.public.apiBaseUrl,
	method: "GET",
	credentials: "include",
	server: false,
});

const uniqueVariantsOptions = computed((): Array<DropdownOption> => {
	return (
		annotations.value
			?.map((variant) => ({
				label: variant.annotation_name,
				value: variant.annotation_name,
				level: 1,
				group: variant.annotation_name?.toLocaleLowerCase(),
			}))
			.sort((a, b) => {
				// extract priority values from the specialOrder object or default to 0
				const priorityA = specialOrder[a.label] ?? 0;
				const priorityB = specialOrder[b.label] ?? 0;

				// sort by priority, with lower values appearing later
				return priorityB - priorityA;
			}) ?? []
	);
});

const pageSizeOption: Array<DropdownOption> = [
	{ id: 1, value: "100", label: "100" },
	{ id: 2, value: "250", label: "250" },
	{ id: 3, value: "500", label: "500" },
	{ id: 4, value: "1000", label: "1000" },
];

const lowerAge = computed(() => {
	return activeAgeGroup.value[0];
});

const upperAge = computed(() => {
	return activeAgeGroup.value[1];
});

const _getTableData = apiClient.questions.table[":id"].$get;
type APITableData = InferResponseType<typeof _getTableData, 200>;
const { data: tableDataRaw } = await useFetch<APITableData>(
	() => `/questions/table/${activeQuestionId.value}`,
	{
		query: {
			page: currentPage,
			pageSize: activePageSizeQuery,
			varIds: activeRegistersQuery,
			annotations: activeVariants,
			lowerAge,
			upperAge,
			orderBy: activeSortLabel,
			dir: activeSortDirection,
		},
		baseURL: env.public.apiBaseUrl,
		method: "get",
		credentials: "include",
	},
);

const columns = ref<Array<TableColumn>>([
	{ label: "Informant", value: "informant", sortable: false },
	{ label: "Response", value: "response_text", sortable: true },
	{ label: "Annotation", value: "annotation", sortable: true },
	// { label: "Phänomen", value: "phenomenon", sortable: true },
	{ label: "Register", value: "variety_name", sortable: true },
	{ label: "Ort", value: "place_name", sortable: true },
	{ label: "Alter", value: "age_group_name", sortable: true },
]);

const tableData = computed(() => {
	return tableDataRaw.value?.responses;
});

const totalPages = computed(() => {
	return tableDataRaw.value?.totalResults
		? Math.ceil(tableDataRaw.value.totalResults / activePageSizeQuery.value)
		: 0;
});

const setCurrentPage = (newValue: number) => {
	currentPage.value = newValue;
};

const setAgeGroup = (newValues: Array<number>) => {
	activeAgeGroup.value = newValues;
};

const setSortOrder = (label: string, order: SortOder) => {
	activeSortLabel.value = label;
	activeSortDirection.value = order;
};

const resetSelection = async (omit?: Array<"age" | "question" | "register">) => {
	if (!omit?.includes("age")) {
		activeAgeGroup.value = [10, 100];
	}
	if (!omit?.includes("question")) {
		activeQuestion.value = "11";
	}
	if (!omit?.includes("register")) {
		activeRegisters.value = ["all"];
	}
	activeVariants.value = [];
	activeSortLabel.value = null;
	activeSortDirection.value = null;
};

watch(
	activeQuestion,
	async (newVal) => {
		activeRegisters.value = ["all"];
		activeAgeGroup.value = [10, 100];
		activeVariants.value = [];
		activeSortLabel.value = null;
		activeSortDirection.value = null;
	},
	{ immediate: true },
);

watch(
	activePageSize,
	(newVal, oldVal) => {
		if (newVal !== oldVal) {
			setCurrentPage(1);
			activePageSizeQuery.value = parseInt(newVal);
		}
	},
	{ immediate: true },
);
</script>

<template>
	<MainContent class="container grid content-start py-8">
		<section class="flex gap-2">
			<div class="grow rounded-lg border p-5 mb-4">
				<div class="grid grid-cols-4 gap-5">
					<div>
						<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
							{{ t("MapsPage.selection.variable.title") }}
							<InfoTooltip :content="t('MapsPage.selection.variable.tooltip')">
								<InfoIcon class="size-4"></InfoIcon>
							</InfoTooltip>
						</div>
						<Combobox
							v-model="activeQuestion"
							has-search
							:options="mappedQuestions"
							:placeholder="t('MapsPage.selection.variable.placeholder')"
						/>
					</div>
					<div>
						<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
							{{ t("MapsPage.selection.register.title") }}
							<InfoTooltip :content="t('MapsPage.selection.register.tooltip')">
								<InfoIcon class="size-4"></InfoIcon>
							</InfoTooltip>
						</div>
						<MultiSelect
							v-model="activeRegisters"
							:options="registerOptions"
							:placeholder="t('MapsPage.selection.register.placeholder')"
						/>
					</div>
					<div>
						<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
							{{ t("MapsPage.selection.variants.title") }}
							<InfoTooltip :content="t('MapsPage.selection.variants.tooltip')">
								<InfoIcon class="size-4"></InfoIcon>
							</InfoTooltip>
						</div>
						<MultiSelect
							v-model="activeVariants"
							:options="uniqueVariantsOptions"
							:placeholder="t('MapsPage.selection.variants.placeholder')"
							single-level
						/>
					</div>
					<div>
						<div class="mb-7 ml-1 flex gap-1 text-sm font-semibold">
							{{ t("MapsPage.selection.age.title") }}
						</div>
						<div class="max-w-64 pl-1">
							<DualRangeSlider
								accessibility-label="Age Group"
								:label="(value) => value"
								:max="100"
								:min="10"
								step="5"
								:value="activeAgeGroup"
								@update:value="setAgeGroup"
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<Button size="icon" variant="outline" @click="resetSelection()"
					><RotateCcw class="size-4"
				/></Button>
			</div>
		</section>

		<section class="flex justify-between items-center mb-3">
			<div class="text-2xl font-semibold">{{ tableDataRaw?.totalResults ?? 0 }} Ergebnisse</div>
			<div class="flex items-center gap-2">
				<Label for="rows-per-page">Einträge pro Seite:</Label>
				<Combobox
					id="rows-per-page"
					width="w-24"
					v-model="activePageSize"
					:options="pageSizeOption"
					:placeholder="t('AdminPage.editor.category.placeholder')"
				/>
			</div>
		</section>

		<DataTable
			:columns="columns"
			:data="tableData"
			server-side-sorting
			@update:sort-criterion="setSortOrder"
		></DataTable>

		<Pagination
			:current-page="currentPage"
			:items-per-page="activePageSizeQuery"
			:total-pages="totalPages"
			@update:page="setCurrentPage"
		></Pagination>
	</MainContent>
</template>
