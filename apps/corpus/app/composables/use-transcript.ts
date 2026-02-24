import type { APITranscript } from "@/types/api";

import { computed, ref } from "vue";

export function useTranscript(id: number, format: string) {
	const env = useRuntimeConfig();

	const response = ref<APITranscript | null>(null);
	const status = ref<"pending" | "success" | "error">("pending");

	const load = async () => {
		status.value = "pending";
		try {
			const { data, error } = await useFetch<Array<APITranscript>>(`/corpus/transcript/${id}/${format}`, {
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
			response.value = data.value as Array<APITranscript>;
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
