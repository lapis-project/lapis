<script lang="ts" setup>
import type { InferResponseType } from "hono/client";

import type { TableColumn } from "@/components/data-table.vue";
import type { DropdownOption } from "@/types/dropdown-option";

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
});

const mappedQuestions = computed(() => {
	return (
		questions.value?.map((q) => ({
			id: q.id,
			value: q.phenomenon_name,
			label: q.phenomenon_name,
		})) ?? null
	);
});

const activeQuestion = ref<string | null>("AUGENLID");
const activePageSizeQuery = ref<number>(100);
const activePageSize = ref<string>("100");

const activeQuestionId = computed(() => {
	return mappedQuestions.value?.find((q) => q.value === activeQuestion.value)?.id;
});

const currentPage = ref(1);

const pageSizeOption: Array<DropdownOption> = [
	{ id: 1, value: "100", label: "100" },
	{ id: 2, value: "250", label: "250" },
	{ id: 3, value: "500", label: "500" },
	{ id: 4, value: "1000", label: "1000" },
];

// const { data: questionData } = await useFetch<Array<SurveyResponse>>("/questions", {
// 	query: { id: activeQuestionId.value, project: "1" },
// 	baseURL: env.public.apiBaseUrl,
// 	method: "get",
// });

const _getTableData = apiClient.questions.table[":id"].$get;
type APITableData = InferResponseType<typeof _getTableData, 200>;
const { data: tableDataRaw } = await useFetch<APITableData>(
	`/questions/table/${activeQuestionId.value}`,
	{
		query: {
			page: currentPage,
			pageSize: activePageSizeQuery,
		},
		baseURL: env.public.apiBaseUrl,
		method: "get",
	},
);

const columns = ref<Array<TableColumn>>([
	{ label: "Informant", value: "informant", sortable: true },
	{ label: "Response", value: "response", sortable: false },
	{ label: "Annotation", value: "annotation", sortable: true },
	// { label: "Phänomen", value: "phenomenon", sortable: true },
	{ label: "Register", value: "variety", sortable: true },
	{ label: "Ort", value: "place", sortable: true },
	{ label: "Alter", value: "age", sortable: true },
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
		<DataTable :columns="columns" :data="tableData"></DataTable>
		<Pagination
			:current-page="currentPage"
			:items-per-page="activePageSizeQuery"
			:total-pages="totalPages"
			@update:page="setCurrentPage"
		></Pagination>
	</MainContent>
</template>
