import { computed } from "vue";

export function useAdminArticles() {
	const env = useRuntimeConfig();

	const currentPage = ref(1);

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
