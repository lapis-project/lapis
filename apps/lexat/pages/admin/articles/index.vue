<script lang="ts" setup>
import { Plus } from "lucide-vue-next";

import type { ArticleListEntry } from "@/components/articles/articles";
import { columns } from "@/components/articles/columns";
import type { Article } from "@/types/api";

const localePath = useLocalePath();

definePageMeta({
	layout: "cms",
});

const t = useTranslations();

const { data: articles } = await useFetch<Array<Article>>(`/api/articles`, {
	method: "get",
});

const tableData = computed<Array<ArticleListEntry> | []>(() => {
	return (
		articles.value?.map((article) => ({
			id: article.id,
			authors: article.authors,
			category: article.category,
			title: article.title,
			alias: article.alias,
			status: article.status,
		})) ?? []
	);
});

const createNewArticle = async () => {
	await navigateTo(localePath("/admin/articles/new"));
};

usePageMetadata({
	title: t("AdminPage.categories.articles.title"),
});
</script>

<template>
	<MainContent class="w-full content-start">
		<div class="mb-8 flex justify-between">
			<PageTitle>{{ t("AdminPage.categories.articles.title") }}</PageTitle>
			<Button @click="createNewArticle"
				><Plus class="mr-2 size-4" />{{ t("AdminPage.categories.articles.new") }}</Button
			>
		</div>
		<div class="col-span-4 rounded border p-8">
			<ArticleTable :columns="columns" :data="tableData"></ArticleTable>
		</div>
		<Toaster />
	</MainContent>
</template>
