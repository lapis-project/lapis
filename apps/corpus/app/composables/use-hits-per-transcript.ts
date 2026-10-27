import type { SearchParams } from "@/types/api";

function generateCacheKey(transcriptId: number, params: SearchParams) {
	return `${transcriptId}:${JSON.stringify(
		Object.entries(params).toSorted(([a], [b]) => a.localeCompare(b)),
	)}`;
}

export function useHitsPerTranscript(projectId: number) {
	const env = useRuntimeConfig();

	const response = ref<Record<string, any>>({});
	const status = ref<Record<string, "idle" | "pending" | "success" | "error">>({});
	const error = ref<Record<string, string | null>>({});

	const fetchTranscriptHits = async (transcriptId: number, params: SearchParams) => {
		const key = generateCacheKey(transcriptId, params);

		if (response.value[key] !== undefined) return;
		if (status.value[key] === "pending") return;

		status.value[key] = "pending";
		error.value[key] = null;

		try {
			const { data, error: fetchError } = await useFetch(`/corpus/search/${projectId}/hits`, {
				baseURL: env.public.apiBaseUrl,
				method: "GET",
				query: { ...params, instance_id: String(transcriptId) },
				credentials: "include",
			});

			if (fetchError.value) {
				status.value[key] = "error";
				error.value[key] = fetchError.value.message;
				return;
			}

			response.value[key] = data.value;
			status.value[key] = "success";
		} catch {
			status.value[key] = "error";
			error.value[key] = "Unexpected error";
		}
	};

	return {
		response,
		status,
		error,
		fetchTranscriptHits,
		isPending: (id: number, params: SearchParams) =>
			status.value[generateCacheKey(id, params)] === "pending",
		hasError: (id: number, params: SearchParams) =>
			status.value[generateCacheKey(id, params)] === "error",
		generateCacheKey,
	};
}
