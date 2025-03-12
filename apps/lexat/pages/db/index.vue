<script lang="ts" setup>
import type { InferResponseType } from "hono/client";

import type { TableColumn } from "@/components/data-table.vue";

const t = useTranslations();
const env = useRuntimeConfig();
const { apiClient } = useApiClient();

usePageMetadata({
	title: t("DbPage.meta.title"),
});

const currentPage = ref(1);

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
const activePageSize = ref<number>(100);

const activeQuestionId = computed(() => {
	return mappedQuestions.value?.find((q) => q.value === activeQuestion.value)?.id;
});

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
			pageSize: activePageSize.value,
		},
		baseURL: env.public.apiBaseUrl,
		method: "get",
	},
);

const columns = ref<Array<TableColumn>>([
	{ label: "Antwort", value: "response", sortable: false },
	{ label: "Phänomen", value: "phenomenon", sortable: true },
	{ label: "Annotation", value: "annotation", sortable: true },
	{ label: "Register", value: "variety", sortable: true },
	{ label: "Ort", value: "place", sortable: true },
	{ label: "Alter", value: "age", sortable: true },
	{ label: "Informant", value: "informant", sortable: true },
]);

const tableData = computed(() => {
	return tableDataRaw.value.responses;
});

const totalPages = computed(() => {
	return tableDataRaw.value?.totalResults
		? Math.ceil(tableDataRaw.value.totalResults / activePageSize.value)
		: 0;
});

const setCurrentPage = (newValue: number) => {
	currentPage.value = newValue;
};
</script>

<template>
	<MainContent class="container grid content-start gap-y-8 py-8">
		<DataTable :columns="columns" :data="tableData"></DataTable>
		<Pagination
			:current-page="currentPage"
			:items-per-page="20"
			:total-pages="totalPages"
			@update:page="setCurrentPage"
		></Pagination>
	</MainContent>
</template>
