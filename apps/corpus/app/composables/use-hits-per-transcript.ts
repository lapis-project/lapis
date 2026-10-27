import type { SearchParams } from "@/types/api";

export function useHitsPerTranscript(projectId: number) {
	const env = useRuntimeConfig();

	const response = ref<Record<string, any>>({});
	const status = ref<"idle" | "pending" | "success" | "error">("idle");
	const error = ref<string | null>(null);

	const toggleTranscriptHits = async (
		transcriptId: number | string | null | undefined,
		params: SearchParams,
	) => {
		if (transcriptId == null) return;

		const key = String(transcriptId);

		try {
			const { data, error: fetchError } = await useFetch(`/corpus/search/${projectId}/hits`, {
				baseURL: env.public.apiBaseUrl,
				method: "GET",
				query: { ...params, instance_id: key },
				credentials: "include",
			});

			if (fetchError.value) {
				status.value = "error";
				error.value = fetchError.value.message;
				console.error("Error loading KWIC results:", fetchError.value);
				return;
			}

			response.value = data.value;

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
		hasError,
		isPending,
		toggleTranscriptHits,
	};
}
