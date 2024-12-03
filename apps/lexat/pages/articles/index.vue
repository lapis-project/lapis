<script lang="ts" setup>
import { RotateCcwIcon } from "lucide-vue-next";

import type { DropdownOption } from "@/types/dropdown-option";
import { formatAuthors } from "@/utils/article-helper";

const t = useTranslations();

const {
	articles,
	selectedCategory,
	selectedLanguage,
	currentPage,
	setCurrentPage,
	totalPages,
	totalResults,
} = useArticles();

const categoryOptions = ref<Array<DropdownOption>>([
	{ id: 1, value: "commentary", label: t("Categories.commentary") },
	{ id: 2, value: "methodology", label: t("Categories.methodology") },
	{ id: 3, value: "project_description", label: t("Categories.project_description") },
]);

const languageOptions = [
	{ value: "en", label: t("AdminPage.editor.language.english") },
	{ value: "de", label: t("AdminPage.editor.language.german") },
];

const resetSelection = () => {
	selectedCategory.value = null;
	selectedLanguage.value = null;
};

// const formatPublishDate = (publishedAt: string) => {
// 	const publishDate = new Date(publishedAt);
// 	return publishDate.toLocaleDateString(undefined, {
// 		year: "numeric",
// 		month: "short",
// 		day: "numeric",
// 	});
// };

usePageMetadata({
	title: t("ArticlesPage.meta.title"),
});
</script>

<template>
	<MainContent class="container flex gap-8 py-8">
		<PageTitle class="sr-only">{{ t("ArticlesPage.title") }}</PageTitle>
		<aside class="w-1/4 rounded border p-5">
			<div class="mb-6 uppercase">
				{{ t("ArticlesPage.filters.label") }}
			</div>
			<div v-if="categoryOptions" class="mb-5 grid max-w-sm items-center gap-1.5">
				<Label for="category">{{ t("ArticlesPage.filters.category") }}</Label>
				<Combobox
					id="category"
					v-model="selectedCategory"
					:options="categoryOptions"
					:placeholder="t('AdminPage.editor.category.placeholder')"
				/>
			</div>
			<div v-if="languageOptions" class="mb-6 grid items-center gap-1.5">
				<Label for="language">{{ t("AdminPage.editor.language.label") }}</Label>
				<Combobox
					id="language"
					v-model="selectedLanguage"
					:options="languageOptions"
					:placeholder="t('AdminPage.editor.language.placeholder')"
				/>
			</div>
			<Button class="gap-2" variant="outline" @click="resetSelection"
				>{{ t("ArticlesPage.filters.reset") }}<RotateCcwIcon class="size-4"
			/></Button>
		</aside>
		<div class="flex w-3/4 flex-col gap-8">
			<div class="text-3xl">{{ totalResults }} Artikel</div>
			<div v-for="article in articles" :key="article.alias">
				<div>
					<div
						class="mb-2 inline-block rounded-full bg-slate-200 px-3 py-0.5 text-sm font-light tracking-wider dark:text-primary-foreground"
					>
						{{ t(`AdminPage.editor.category.${article.post_type}`) }}
					</div>
					<div class="flex gap-4">
						<NuxtLinkLocale class="inline-flex w-1/4" :to="`/articles/${article.alias}`">
							<NuxtImg class="aspect-[16/9] object-cover" :src="article.cover"></NuxtImg>
						</NuxtLinkLocale>

						<div class="w-3/4">
							<NuxtLinkLocale :to="`/articles/${article.alias}`">
								<h2 class="text-2xl tracking-wide hover:underline">{{ article.title }}</h2>
							</NuxtLinkLocale>
							<p class="mb-1 tracking-wide">{{ formatAuthors(article.authors) }}</p>
							<!-- <div v-if="article.published_at" class="mb-2">
								{{ t("ArticleDetailPage.published_at") }}:
								{{ formatPublishDate(article.published_at) }}
							</div> -->
							<p class="line-clamp-3 font-light">{{ article.abstract }}</p>
						</div>
					</div>
				</div>
			</div>
			<Pagination
				:current-page="currentPage"
				:items-per-page="20"
				:total-pages="totalPages"
				@update:page="setCurrentPage"
			></Pagination>
		</div>
	</MainContent>
</template>
