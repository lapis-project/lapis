import type { APIPlaces } from "@/types/api";

export function usePlaces(projectId: number) {
	const env = useRuntimeConfig();

	const response = ref<APIPlaces | null>(null);
	const status = ref<"pending" | "success" | "error">("pending");
	const load = async () => {
		try {
			const { data, error } = await useFetch<APIPlaces>(`/corpus/place/${projectId}`, {
				baseURL: env.public.apiBaseUrl,
				method: "GET",
				credentials: "include",
			});

			if (error.value) {
				status.value = "error";
				console.error("Error loading transcripts:", error.value);
				return;
			}

			// oxlint-disable-next-line eslint/no-console -- Useful development output
			console.log("backend places", data.value);

			response.value = data.value as APIPlaces;
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
	};
}
