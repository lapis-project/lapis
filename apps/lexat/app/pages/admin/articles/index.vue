<script lang="ts" setup>
import ArticleTable from "@/components/articles/article-table.vue";
import type { ArticleListEntry } from "@/components/articles/articles";
import { columns } from "@/components/articles/columns";

const env = useRuntimeConfig();
const { articles, currentPage, deleteArticle, setCurrentPage, totalResults } = useAdminArticles();
const { statusOptions } = useArticleStatus();

const localePath = useLocalePath();

definePageMeta({
	layout: "cms",
	middleware: ["protected"],
});

const t = useTranslations();
const toast = useToast();

const tableData = computed<Array<ArticleListEntry>>(() => {
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
	try {
		const result = await $fetch("/cms/articles/create", {
			baseURL: env.public.apiBaseUrl,
			method: "POST",
			credentials: "include",
		});
		await navigateTo(localePath(`/admin/articles/${result.articleId.id}`));
	} catch (error) {
		console.error(error);
		toast.add({ title: "Could not create new article", color: "error" });
	}
};

usePageMetadata({
	title: t("AdminPage.meta.title"),
});
</script>

<template>
	<main class="w-full grid content-start gap-8" :tabindex="-1">
		<div class="flex items-center justify-between">
			<PageTitle>{{ totalResults }} {{ t("AdminPage.articles.title") }}</PageTitle>
			<UButton icon="i-lucide-plus" @click="createNewArticle">{{
				t("AdminPage.articles.new")
			}}</UButton>
		</div>

		<ArticleTable
			id="main-content"
			:columns="columns"
			:data="tableData"
			:delete-article="deleteArticle"
			:tabindex="-1"
		></ArticleTable>
		<UPagination
			:items-per-page="20"
			:page="currentPage"
			show-edges
			:total="totalResults"
			class="mx-auto"
			@update:page="setCurrentPage"
		/>
	</main>
</template>
