import { computed } from "vue";

export function useArticles() {
	const env = useRuntimeConfig();

	const currentPage = ref(1);

	const { data, refresh } = useFetch<{
		articles: Array<{
			abstract: string;
			alias: string;
			authors: Array<{ lastname: string | null; firstname: string | null }>;
			cover: string;
			cover_alt: string;
			post_id: string;
			post_type: string;
			title: string;
			published_at: string;
		}>;
		totalResults: number;
	}>("articles/articles/1", {
		query: { page: currentPage },
		baseURL: env.public.apiBaseUrl,
		method: "GET",
		credentials: "include",
	});

	const articles = computed(() => data.value?.articles ?? []);

	const totalPages = computed(() => {
		return data.value?.totalResults ? Math.ceil(data.value.totalResults / 20) : 0;
	});

	const setCurrentPage = (newValue: number) => {
		currentPage.value = newValue;
	};

	return {
		currentPage,
		articles,
		totalPages,
		totalResults: data.value?.totalResults ?? 0,
		setCurrentPage,
		refreshArticles: refresh,
	};
}
