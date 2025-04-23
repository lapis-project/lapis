<script lang="ts" setup>
import { Plus } from "lucide-vue-next";
import { toast } from "vue-sonner";

import type { ArticleListEntry } from "@/components/articles/articles";
import { columns } from "@/components/articles/columns";
import { Toaster } from "@/components/ui/sonner";

const env = useRuntimeConfig();
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
	try {
		const result = await $fetch("/cms/articles/create", {
			baseURL: env.public.apiBaseUrl,
			method: "POST",
			credentials: "include",
		});
		await await navigateTo(localePath(`/admin/articles/${result.articleId.id}`));
	} catch (error) {
		console.error(error);
		toast.error("Could not create new article");
	}
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
		<PagePagination
			:current-page="currentPage"
			:items-per-page="20"
			:total-pages="totalPages"
			@update:page="setCurrentPage"
		></PagePagination>
		<ClientOnly>
			<Toaster />
		</ClientOnly>
	</MainContent>
</template>
