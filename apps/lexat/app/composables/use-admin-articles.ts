import type { InferResponseType } from "hono/client";
import { computed } from "vue";

export function useAdminArticles() {
	const env = useRuntimeConfig();
	const { apiClient } = useApiClient();

	const headers = useRequestHeaders(["cookie"]);

	const _getAdminArticles = apiClient.cms.articles.all[":project"].$get;
	type APIAdminArticles = InferResponseType<typeof _getAdminArticles, 200>;
	const _deleteArticle = apiClient.cms.articles[":id"].$delete;
	type APIDeleteAdminArticle = InferResponseType<typeof _deleteArticle, 200>;

	const currentPage = ref(1);

	const { data, refresh } = useFetch<APIAdminArticles>("/cms/articles/all/1", {
		query: { page: currentPage },
		baseURL: env.public.apiBaseUrl,
		method: "GET",
		credentials: "include",
		headers: headers,
	});

	const articles = computed(() => data.value?.articles ?? []);

	const totalResults = computed(() => data.value?.totalResults ?? 0);

	const totalPages = computed(() => {
		return totalResults.value ? Math.ceil(totalResults.value / 20) : 0;
	});

	const deleteArticle = async (articleId: number) => {
		try {
			await $fetch<APIDeleteAdminArticle>(`/cms/articles/${articleId.toString()}`, {
				method: "DELETE",
				baseURL: env.public.apiBaseUrl,
				credentials: "include",
			});
			await refresh();
		} catch (error) {
			console.error("Failed to delete article:", error);
			throw error;
		}
	};

	const setCurrentPage = (newValue: number) => {
		if (currentPage.value !== newValue) {
			currentPage.value = newValue;
		}
	};

	return {
		currentPage,
		articles,
		totalPages,
		totalResults,
		setCurrentPage,
		deleteArticle,
		refreshArticles: refresh,
	};
}
