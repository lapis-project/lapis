import { computed } from "vue";

export function useArticles() {
	const env = useRuntimeConfig();

	const currentPage = ref(1);

	const selectedCategory = ref<string | null>(null);

	const selectedLanguage = ref<"de" | "en" | null>(null);

	const currentSearchTerm = ref<string | null>(null);

	const { data, refresh, status } = useFetch<{
		articles: Array<{
			abstract: string;
			alias: string;
			authors: Array<{ lastname: string; firstname: string }>;
			cover: string;
			cover_alt: string;
			post_id: string;
			post_type: string;
			title: string;
			published_at: string;
		}>;
		totalResults: number;
	}>("articles/articles/1", {
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
