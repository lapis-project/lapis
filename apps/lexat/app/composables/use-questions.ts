import type { InferResponseType } from "hono/client";

export async function useQuestions(surveyId?: MaybeRefOrGetter<string | number | undefined>) {
	const env = useRuntimeConfig();
	const { apiClient } = useApiClient();

	const _getPhenomenons = apiClient.questions.survey[":project"].$get;
	type APIPhenomenons = InferResponseType<typeof _getPhenomenons, 200>;

	const query = computed(() => {
		const survey = toValue(surveyId);
		return survey === undefined ? {} : { survey: String(survey) };
	});

	const { data: questions, status } = await useFetch<APIPhenomenons>("/questions/survey/1", {
		baseURL: env.public.apiBaseUrl,
		method: "GET",
		query,
		credentials: "include",
	});

	return { questions, status };
}
