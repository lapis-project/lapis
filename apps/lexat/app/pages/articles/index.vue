<script lang="ts" setup>
import { breakpointsTailwind, useBreakpoints, useMounted } from "@vueuse/core";
import type { LocationQueryRaw } from "vue-router";

import { formatAuthors } from "#imports";

const breakpoints = useBreakpoints(breakpointsTailwind);
const isDesktop = breakpoints.greaterOrEqual("sm");
const isMounted = useMounted();

const isOpen = ref(false);

const effectiveOpen = computed({
	get: () => !isMounted.value || isDesktop.value || isOpen.value,
	set: (val) => {
		isOpen.value = val;
	},
});

const t = useTranslations();
const router = useRouter();
const route = useRoute();

const {
	articles,
	currentPage,
	isPending,
	setCurrentPage,
	setSearchParams,
	selectedSortingOption,
	totalPages,
	totalResults,
	selectedCategory,
	selectedLanguage,
	currentSearchTerm,
} = useArticles();

// initialize the local input value from the composable (which read the URL)
const searchInput = ref(currentSearchTerm.value || "");

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

const isFilterSelected = computed(() => {
	return currentSearchTerm.value || selectedCategory.value || selectedLanguage.value;
});

const resetSelection = () => {
	setSearchParams({ category: undefined, language: undefined, searchTerm: undefined });
	searchInput.value = "";
	updateUrlParams();
};

const updateUrlParams = async () => {
	const queryObject: LocationQueryRaw = {};
	Object.entries(route.query).forEach(([key, value]) => {
		if (!["q", "c", "l", "p"].includes(key)) {
			queryObject[key] = value;
		}
	});
	if (searchInput.value) {
		queryObject.q = searchInput.value;
	}

	if (selectedCategory.value) {
		queryObject.c = selectedCategory.value;
	}

	if (selectedLanguage.value) {
		queryObject.l = selectedLanguage.value;
	}
	await router.replace({ query: queryObject });
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
	updateUrlParams();
};

const updateSelectedCategory = (value: string | undefined) => {
	selectedCategory.value = value ?? null;
};

const updateSelectedLanguage = (value: string | undefined) => {
	selectedLanguage.value = value === "de" || value === "en" ? value : null;
};

const segmentTitle = (title: string) => {
	// Matches a slash with any amount of whitespace (including none) around it
	// and replaces it with exactly " / "
	return title.replace(/\s*\/\s*/g, " / ");
};

watch(selectedCategory, () => {
	updateUrlParams();
});

watch(selectedLanguage, () => {
	updateUrlParams();
});

watch(currentPage, () => {
	updateUrlParams();
});

usePageMetadata({
	title: t("ArticlesPage.meta.title"),
	description: t("ArticlesPage.meta.description"),
});
</script>

<template>
	<MainContent class="container grid sm:grid-cols-[auto_minmax(0,1fr)] gap-8 py-8">
		<PageTitle class="sr-only">{{ t("ArticlesPage.title") }}</PageTitle>
		<aside class="block sm:rounded sm:border sm:p-5">
			<div class="mb-6 uppercase max-sm:hidden">
				{{ t("ArticlesPage.filters.label") }}
			</div>
			<div class="flex flex-col gap-2">
				<div
					class="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 sm:block"
				>
					<label class="col-span-2 sm:mb-1.5 sm:block" for="search">{{
						t("ArticlesPage.filters.search.label")
					}}</label>
					<div class="relative w-full sm:w-64">
						<UInput
							id="search"
							v-model="searchInput"
							size="xl"
							class="w-full"
							:placeholder="t('ArticlesPage.filters.search.placeholder')"
							@keyup.enter="applySearchParams"
						/>
						<span class="absolute inset-y-0 end-0 flex items-center justify-center px-2">
							<UButton
								:aria-label="t('ArticlesPage.filters.search.label')"
								size="lg"
								variant="ghost"
								icon="i-lucide-search"
								@click="applySearchParams"
							/>
						</span>
					</div>
					<UCollapsible
						v-model:open="effectiveOpen"
						class="contents"
						:ui="{ content: 'col-span-2' }"
					>
						<UButton
							class="sm:hidden"
							:aria-label="t('ArticlesPage.filters.label')"
							size="lg"
							variant="outline"
							icon="i-lucide-sliders-horizontal"
						/>
						<template #content>
							<div v-if="categoryOptions" class="mt-5 mb-5 grid items-center gap-1.5">
								<label for="category">{{ t("ArticlesPage.filters.category") }}</label>
								<USelect
									id="category"
									:model-value="selectedCategory ?? undefined"
									size="xl"
									data-testid="category"
									:items="categoryOptions"
									:placeholder="t('AdminPage.editor.category.placeholder')"
									@update:model-value="updateSelectedCategory"
								/>
							</div>
							<div v-if="languageOptions" class="mb-6 grid items-center gap-1.5">
								<label for="language">{{ t("AdminPage.editor.language.label") }}</label>
								<USelect
									id="language"
									:model-value="selectedLanguage ?? undefined"
									size="xl"
									data-testid="language"
									:items="languageOptions"
									:placeholder="t('AdminPage.editor.language.placeholder')"
									@update:model-value="updateSelectedLanguage"
								/>
							</div>
						</template>
					</UCollapsible>
				</div>
				<UButton
					v-show="isFilterSelected"
					class="sm:w-64 w-full gap-2"
					variant="outline"
					icon="i-lucide-rotate-ccw"
					size="lg"
					@click="resetSelection"
					>{{ t("ArticlesPage.filters.reset") }}
				</UButton>
			</div>
		</aside>
		<div>
			<section class="flex sm:items-center sm:justify-between max-sm:flex-col gap-2 sm:gap-0 mb-8">
				<div
					aria-atomic="true"
					aria-live="polite"
					class="sm:text-3xl text-xl"
					data-testid="results"
					tabindex="0"
				>
					{{ totalResults }}
					{{ totalResults === 1 ? t("ArticlesPage.result") : t("ArticlesPage.results") }}
				</div>
				<div class="flex items-center gap-2 justify-between">
					<label class="sm:text-base text-sm shrink-0" for="article-sorting"
						>{{ t("ArticlesPage.sort.sort_by") }}:</label
					>
					<USelect
						id="article-sorting"
						v-model="selectedSortingOption"
						:items="sortingOptions"
						size="lg"
						class="w-32"
					></USelect>
				</div>
			</section>
			<ul class="flex flex-col gap-8" data-testid="articles">
				<li v-for="article in articles" :key="article.alias" :class="{ 'opacity-40': isPending }">
					<div class="flex gap-4">
						<NuxtLinkLocale
							class="hidden sm:block w-1/4 aspect-video"
							:to="`/articles/${article.alias}`"
						>
							<NuxtImg class="object-cover aspect-video" :src="article.cover"></NuxtImg>
						</NuxtLinkLocale>

						<div class="sm:w-3/4 overflow-hidden">
							<NuxtLinkLocale :to="`/articles/${article.alias}`">
								<h2 class="text-xl tracking-wide hover:underline break-normal">
									{{ segmentTitle(article.title) }}
								</h2>
							</NuxtLinkLocale>
							<p class="mb-1 tracking-wide">{{ formatAuthors(article.authors) }}</p>
							<div
								class="mb-2 inline-block rounded-full bg-slate-200 px-2 py-0.5 text-xs font-light tracking-wider dark:text-primary-foreground"
							>
								{{ t(`AdminPage.editor.category.${article.post_type}`) }}
							</div>
							<!-- <div v-if="article.published_at" class="mb-2">
								{{ t("ArticleDetailPage.published_at") }}:
								{{ formatPublishDate(article.published_at) }}
							</div> -->
							<p class="line-clamp-3 font-light wrap-anywhere sm:wrap-normal">
								{{ article.abstract }}
							</p>
						</div>
					</div>
				</li>
			</ul>
			<div class="flex justify-center">
				<UPagination
					:items-per-page="20"
					:page="currentPage"
					:total="totalPages"
					class="mt-10"
					size="lg"
					@update:page="setCurrentPage"
				/>
			</div>
		</div>
	</MainContent>
</template>
