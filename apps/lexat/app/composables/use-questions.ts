import type { InferResponseType } from "hono/client";

export async function useQuestions() {
	const env = useRuntimeConfig();
	const { apiClient } = useApiClient();

	const _getPhenomenons = apiClient.questions.survey[":project"].$get;
	type APIPhenomenons = InferResponseType<typeof _getPhenomenons, 200>;

	const questionsState = useState<APIPhenomenons | null>("questions", () => null);

	if (!questionsState.value) {
		const { data } = await useFetch<APIPhenomenons>("/questions/survey/1", {
			baseURL: env.public.apiBaseUrl,
			method: "GET",
			credentials: "include",
		});
		questionsState.value = data.value ?? null;
	}

	return { questions: questionsState };
}
