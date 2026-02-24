import type { InferResponseType } from "hono/client";
import { computed,ref } from "vue";

export function useTranscripts(projectId: number) {
  const env = useRuntimeConfig();

  const { apiClient } = useApiClient();
  const _getTranscripts = apiClient.corpus.corpus[":id"].$get;

  type APITranscripts = InferResponseType<typeof _getTranscripts, 200>;

  type APITranscriptsWithBookmark = 
  (APITranscripts[number] & { bookmarked: boolean })[];
	const response = ref<APITranscriptsWithBookmark | null>(null);
	const status = ref<"pending" | "success" | "error">("pending");

	const load = async () => {
		status.value = "pending";
		try {
			const { data, error } = await useFetch<APITranscripts>(`/corpus/corpus/${projectId}`, {
				baseURL: env.public.apiBaseUrl,
				method: "GET",
				credentials: "include",
			});

			if (error.value) {
				status.value = "error";
				console.error("Error loading transcripts:", error.value);
				return;
			}

			console.log("endpoint, corpus: ", data.value);

      response.value = (data.value ?? []).map(item => ({
        ...item,
      bookmarked: false,
      }));

			status.value = "success";
		} catch (err) {
			console.error(err);
			status.value = "error";
		}
	};

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
