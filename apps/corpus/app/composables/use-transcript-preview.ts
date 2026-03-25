import type { APITranscriptPreview } from "@/types/api";

import { computed, ref } from "vue";

export function useTranscriptPreview(id: Ref<number | null>) {
	const env = useRuntimeConfig();

	const response = ref<APITranscriptPreview | null>(null);
	const status = ref<"pending" | "success" | "error">("pending");

	const load = async () => {
		if (id.value === null) {
			status.value = "pending";
			response.value = null;
			return;
		}
		status.value = "pending";
		try {
			const { data, error } = await useFetch<APITranscriptPreview>(`/corpus/preview/${id.value}`, {
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
			response.value = data.value as APITranscriptPreview;
			status.value = "success";
		} catch (err) {
			console.error(err);
			status.value = "error";
		}
	};

	load();

	watch(id, () => {
		load();
	});

	const isPending = computed(() => status.value === "pending");
	const hasError = computed(() => status.value === "error");

	return {
		response,
		isPending,
		hasError,
		refreshTranscripts: load,
	};
}
