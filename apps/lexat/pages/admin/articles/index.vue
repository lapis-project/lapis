<script lang="ts" setup>
import { Plus } from "lucide-vue-next";

import type { ArticleListEntry } from "@/components/articles/articles";
import { columns } from "@/components/articles/columns";

const { articles, currentPage, totalPages, setCurrentPage } = useAdminArticles();
const { statusOptions } = useArticleStatus();

const localePath = useLocalePath();

definePageMeta({
	layout: "cms",
	middleware: ["protected"],
});

const t = useTranslations();

const tableData = computed<Array<ArticleListEntry> | []>(() => {
	return (
		articles.value.map((article) => ({
			post_id: article.post_id,
			authors: article.authors,
			category: t(`AdminPage.editor.category.${article.post_type}`),
			title: article.title,
			alias: article.alias,
			status: statusOptions.find((s) => s.value === article.status)?.label ?? "",
		})) ?? []
	);
});

const createNewArticle = async () => {
	await navigateTo(localePath("/admin/articles/new"));
};

usePageMetadata({
	title: t("AdminPage.meta.title"),
});
</script>

<template>
	<MainContent class="w-full content-start">
		<div class="mb-8 flex justify-between">
			<PageTitle>{{ t("AdminPage.articles.title") }}</PageTitle>
			<Button @click="createNewArticle"
				><Plus class="mr-2 size-4" />{{ t("AdminPage.articles.new") }}</Button
			>
		</div>

		<ArticleTable class="mb-5" :columns="columns" :data="tableData"></ArticleTable>
		<Pagination
			:current-page="currentPage"
			:items-per-page="20"
			:total-pages="totalPages"
			@update:page="setCurrentPage"
		></Pagination>
	</MainContent>
</template>
