import type { InferResponseType } from "hono/client";
import { computed } from "vue";

import { useApiClient } from "@/composables/use-api-client";

export function useAdminArticles() {
	const env = useRuntimeConfig();
	const { apiClient } = useApiClient();
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
	});

	const articles = computed(() => data.value?.articles ?? []);

	const totalPages = computed(() => {
		return data.value?.totalResults ? Math.ceil(data.value.totalResults / 20) : 0;
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
		currentPage.value = newValue;
	};

	return {
		currentPage,
		articles,
		totalPages,
		setCurrentPage,
		deleteArticle,
		refreshArticles: refresh,
	};
}
