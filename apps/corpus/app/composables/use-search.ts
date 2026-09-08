import { ref, computed } from "vue";

import type { APISearchResponse, SearchParams } from "@/types/api";

export function useSearch(projectId: number) {
	const env = useRuntimeConfig();

	const response = ref<APISearchResponse | null>(null);
	const status = ref<"idle" | "pending" | "success" | "error">("idle");
	const error = ref<string | null>(null);

	const search = async (params: SearchParams) => {
		status.value = "pending";
		error.value = null;

		console.log("search params: ", params);
		try {
			const { data, error } = await useFetch(`/corpus/search/${projectId}`, {
				baseURL: env.public.apiBaseUrl,
				method: "GET",
				query: {
					...params,
				},
				credentials: "include",
			});

			if (error.value) {
				status.value = "error";
				console.error("Error loading kwic results:", error.value);
				return;
			}

			console.log(data.value);
			response.value = data.value as APISearchResponse;

			status.value = "success";
		} catch (err) {
			console.error(err);
			error.value = "Unexpected error";
			status.value = "error";
		}
	};

	const isPending = computed(() => status.value === "pending");
	const hasError = computed(() => status.value === "error");

	return {
		response,
		status,
		error,
		isPending,
		hasError,
		search,
	};
}
