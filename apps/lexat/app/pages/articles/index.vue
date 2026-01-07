<script lang="ts" setup>
import { RotateCcwIcon, SearchIcon } from "lucide-vue-next";

import { formatAuthors } from "@/utils/article-helper";

const t = useTranslations();

const selectedCategory = ref<string | null>(null);

const selectedLanguage = ref<"de" | "en" | null>(null);

const {
	articles,
	currentPage,
	isPending,
	setCurrentPage,
	setSearchParams,
	selectedSortingOption,
	totalPages,
	totalResults,
} = useArticles();

const searchInput = ref("");

const categoryOptions = ref([
	{ value: "commentary", label: t("Categories.commentary") },
	{ value: "short_description", label: t("Categories.short_description") },
]);

const languageOptions = [
	{ value: "en", label: t("LocaleSwitcher.english") },
	{ value: "de", label: t("LocaleSwitcher.german") },
];

const sortingOptions = [
	{ value: "published_date", label: t("ArticlesPage.sort.published_date") },
	{ value: "type", label: t("ArticlesPage.sort.type") },
	{ value: "variable", label: t("ArticlesPage.sort.variable") },
];

const resetSelection = () => {
	selectedCategory.value = null;
	selectedLanguage.value = null;
	searchInput.value = "";
};

// const formatPublishDate = (publishedAt: string) => {
// 	const publishDate = new Date(publishedAt);
// 	return publishDate.toLocaleDateString(undefined, {
// 		year: "numeric",
// 		month: "short",
// 		day: "numeric",
// 	});
// };

const applySearchParams = () => {
	setSearchParams({
		category: selectedCategory.value ?? undefined,
		language: selectedLanguage.value ?? undefined,
		searchTerm: searchInput.value || undefined,
	});
};

watch(selectedCategory, () => {
	applySearchParams();
});

watch(selectedLanguage, () => {
	applySearchParams();
});

usePageMetadata({
	title: t("ArticlesPage.meta.title"),
	description: t("ArticlesPage.meta.description"),
});
</script>

<template>
	<MainContent class="container grid sm:grid-cols-[auto_1fr] gap-8 py-8">
		<PageTitle class="sr-only">{{ t("ArticlesPage.title") }}</PageTitle>
		<aside class="hidden sm:block rounded border p-5">
			<div class="mb-6 uppercase">
				{{ t("ArticlesPage.filters.label") }}
			</div>
			<div class="mb-5 grid items-center gap-1.5">
				<Label for="search">{{ t("ArticlesPage.filters.search.label") }}</Label>
				<div class="relative w-64">
					<Input
						id="search"
						v-model="searchInput"
						class="pr-10"
						:placeholder="t('ArticlesPage.filters.search.placeholder')"
						type="text"
						@keyup.enter="applySearchParams"
					/>
					<span class="absolute inset-y-0 end-0 flex items-center justify-center px-2">
						<Button
							:aria-label="t('ArticlesPage.filters.search.label')"
							class="size-7"
							size="icon"
							variant="ghost"
							@click="applySearchParams"
						>
							<SearchIcon aria-hidden="true" class="size-4" />
						</Button>
					</span>
				</div>
			</div>
			<div v-if="categoryOptions" class="mb-5 grid max-w-sm items-center gap-1.5">
				<Label for="category">{{ t("ArticlesPage.filters.category") }}</Label>
				<BaseSelect
					id="category"
					v-model="selectedCategory"
					data-testid="category"
					:options="categoryOptions"
					:placeholder="t('AdminPage.editor.category.placeholder')"
				/>
			</div>
			<div v-if="languageOptions" class="mb-6 grid items-center gap-1.5">
				<Label for="language">{{ t("AdminPage.editor.language.label") }}</Label>
				<BaseSelect
					id="language"
					v-model="selectedLanguage"
					data-testid="language"
					:options="languageOptions"
					:placeholder="t('AdminPage.editor.language.placeholder')"
				/>
			</div>
			<Button class="w-64 gap-2" variant="outline" @click="resetSelection"
				>{{ t("ArticlesPage.filters.reset") }}<RotateCcwIcon aria-hidden="true" class="size-4"
			/></Button>
		</aside>
		<div>
			<section class="flex items-center justify-between mb-8">
				<div
					aria-atomic="true"
					aria-live="polite"
					class="text-3xl"
					data-testid="results"
					tabindex="0"
				>
					{{ totalResults }}
					{{ totalResults === 1 ? t("ArticlesPage.result") : t("ArticlesPage.results") }}
				</div>
				<div class="flex items-center gap-2">
					<Label for="rows-per-page">{{ t("ArticlesPage.sort.sort_by") }}:</Label>
					<BaseSelect
						v-model="selectedSortingOption"
						:options="sortingOptions"
						size="medium"
					></BaseSelect>
				</div>
			</section>
			<ul class="flex flex-col gap-8" data-testid="articles">
				<li v-for="article in articles" :key="article.alias" :class="{ 'opacity-40': isPending }">
					<div
						class="mb-2 inline-block rounded-full bg-slate-200 px-3 py-0.5 text-sm font-light tracking-wider dark:text-primary-foreground"
					>
						{{ t(`AdminPage.editor.category.${article.post_type}`) }}
					</div>
					<div class="flex gap-4">
						<NuxtLinkLocale
							class="hidden sm:block w-1/4 aspect-16/9"
							:to="`/articles/${article.alias}`"
						>
							<NuxtImg class="object-cover aspect-16/9" :src="article.cover"></NuxtImg>
						</NuxtLinkLocale>

						<div class="sm:w-3/4">
							<NuxtLinkLocale :to="`/articles/${article.alias}`">
								<h2 class="text-xl tracking-wide hover:underline break-all">
									{{ article.title }}
								</h2>
							</NuxtLinkLocale>
							<p class="mb-1 tracking-wide">{{ formatAuthors(article.authors) }}</p>
							<!-- <div v-if="article.published_at" class="mb-2">
								{{ t("ArticleDetailPage.published_at") }}:
								{{ formatPublishDate(article.published_at) }}
							</div> -->
							<p class="line-clamp-3 font-light">{{ article.abstract }}</p>
						</div>
					</div>
				</li>
			</ul>
			<PagePagination
				:current-page="currentPage"
				:items-per-page="20"
				:total-pages="totalPages"
				@update:page="setCurrentPage"
			></PagePagination>
		</div>
	</MainContent>
</template>
