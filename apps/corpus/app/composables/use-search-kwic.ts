import { ref, computed } from "vue";
import type { APIKwicResponse } from "@/types/api";

type KwicParams = {
	word?: string;
	query?: string;
	lemma?: string;
	pos?: string;
	feats?: string;
	mode?: "simple" | "regex";
	from?: string;
};

export function useSearchKwic() {
	const env = useRuntimeConfig();

	const response = ref<APIKwicResponse | null>(null);
	const status = ref<"idle" | "pending" | "success" | "error">("idle");
	const error = ref<string | null>(null);

	const search = async (params: KwicParams) => {
		status.value = "pending";
		error.value = null;

		console.log("Hello from caller", params);

		try {
			const { data, error } = await useFetch("/corpus/search/kwic", {
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
			response.value = data.value as APIKwicResponse;

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
