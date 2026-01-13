import type { InferResponseType } from "hono/client";

export function useArticles() {
	const env = useRuntimeConfig();
	const route = useRoute();

	const { apiClient } = useApiClient();
	const _getArticles = apiClient.articles.articles[":project"].$get;
	type APIArticles = InferResponseType<typeof _getArticles, 200>;

	const currentPage = ref(Number(route.query.p) || 1);
	const selectedCategory = ref((route.query.c as string) || null);
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	const selectedLanguage = ref<"de" | "en" | null>((route.query.l as "de" | "en") || null);
	const currentSearchTerm = ref((route.query.q as string) || null);

	const selectedSortingOption = ref("type");

	const { data, refresh, status } = useFetch<APIArticles>("articles/articles/1", {
		query: {
			page: currentPage,
			category: selectedCategory,
			lang: selectedLanguage,
			searchTerm: currentSearchTerm,
			sort: selectedSortingOption,
		},
		baseURL: env.public.apiBaseUrl,
		method: "GET",
		credentials: "include",
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
		currentPage.value = newValue;
	};

	const setSearchParams = (newValues: {
		category?: string;
		language?: "de" | "en";
		searchTerm?: string;
	}) => {
		selectedCategory.value = newValues.category ?? null;
		selectedLanguage.value = newValues.language ?? null;
		currentSearchTerm.value = newValues.searchTerm ?? null;
		currentPage.value = 1;
	};

	return {
		selectedCategory,
		selectedLanguage,
		currentSearchTerm,
		currentPage,
		articles,
		totalPages,
		totalResults,
		setCurrentPage,
		setSearchParams,
		selectedSortingOption,
		refreshArticles: refresh,
		isPending,
	};
}
