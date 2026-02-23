import type { InferResponseType } from "hono/client";
import { computed,ref } from "vue";

export function useTranscript(id: number, format: string) {
	const env = useRuntimeConfig();
	const { apiClient } = useApiClient();

	const _getTranscripts = apiClient.corpus.transcript[":id"][":format"].$get;
	type APITranscript = InferResponseType<typeof _getTranscripts, 200>;

	// State
	const response = ref<APITranscript | null>(null);
	const status = ref<"pending" | "success" | "error">("pending");

	// Load function
	const load = async () => {
		status.value = "pending";
		try {
			const { data, error } = await useFetch<APITranscript>(`/corpus/transcript/${id}/${format}`, {
				baseURL: env.public.apiBaseUrl,
				method: "GET",
				credentials: "include",
				responseType: "json",
			});

			if (error.value) {
				status.value = "error";
				console.error("Error loading transcripts:", error.value);
				return;
			}

			console.log("backend, transcript id: ", data.value);
			response.value = data.value;
			status.value = "success";
		} catch (err) {
			console.error(err);
			status.value = "error";
		}
	};

	// Immediately load on composable creation
	load();

	const isPending = computed(() => status.value === "pending");
	const hasError = computed(() => status.value === "error");

	return {
		response,
		isPending,
		hasError,
		refreshTranscripts: load,
	};
}
