import { computed } from "vue";

export function useArticles() {
	const env = useRuntimeConfig();

	const { data, refresh } = useFetch<{
		prev: string | null;
		next: string | null;
		articles: Array<{
			post_id: number;
			title: string;
			alias: string;
			content: string;
			abstract: string;
			status: string;
			post_type: string;
			authors: Array<{
				user_id: number;
				username: string;
				email: string;
				firstname: string;
				lastname: string;
			}>;
		}>;
		currentPage: string;
		totalResults: number;
	}>("/cms/articles/all/1", {
		baseURL: env.public.apiBaseUrl,
		method: "GET",
		credentials: "include",
	});

	// Computed property for articles
	const articles = computed(() => data.value?.articles ?? []);

	// Method to delete an article
	const deleteArticle = async (articleId: number) => {
		try {
			await $fetch(`/cms/articles/${articleId.toString()}`, {
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

	return {
		articles,
		deleteArticle,
		refreshArticles: refresh,
	};
}
