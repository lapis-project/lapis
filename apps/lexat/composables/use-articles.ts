import type { InferResponseType } from "hono/client";
import { computed } from "vue";

import { useApiClient } from "@/composables/use-api-client";

export function useArticles() {
	const env = useRuntimeConfig();

	const { apiClient } = useApiClient();
	const _getArticles = apiClient.articles.articles[":project"].$get;
	type APIArticles = InferResponseType<typeof _getArticles, 200>;

	const currentPage = ref(1);

	const selectedCategory = ref<string | null>(null);

	const selectedLanguage = ref<"de" | "en" | null>(null);

	const currentSearchTerm = ref<string | null>(null);

	const { data, refresh, status } = useFetch<APIArticles>("articles/articles/1", {
		query: {
			page: currentPage,
			category: selectedCategory,
			lang: selectedLanguage,
			searchTerm: currentSearchTerm,
		},
		baseURL: env.public.apiBaseUrl,
		method: "GET",
		credentials: "include",
		// immediate: false,
	});

	const articles = computed(() => data.value?.articles ?? []);

	const totalResults = computed(() => data.value?.totalResults ?? 0);

	const totalPages = computed(() => {
		return data.value?.totalResults ? Math.ceil(data.value.totalResults / 20) : 0;
	});

	const isPending = computed(() => {
		return status.value === "pending";
	});

	const setCurrentPage = (newValue: number) => {
		if (currentPage.value !== newValue) {
			currentPage.value = newValue;
		}
	};

	const setSearchParams = (newValues: {
		category?: string;
		language?: "de" | "en";
		searchTerm?: string;
	}) => {
		selectedCategory.value = newValues.category ?? null;
		selectedLanguage.value = newValues.language ?? null;
		currentSearchTerm.value = newValues.searchTerm ?? null;
	};

	return {
		selectedCategory,
		selectedLanguage,
		currentPage,
		articles,
		totalPages,
		totalResults,
		setCurrentPage,
		setSearchParams,
		refreshArticles: refresh,
		isPending,
	};
}
