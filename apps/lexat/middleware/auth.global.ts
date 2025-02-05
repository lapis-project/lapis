import type { InferResponseType } from "hono/client";
import { FetchError } from "ofetch";

import { useApiClient } from "@/composables/use-api-client";

export default defineNuxtRouteMiddleware(async () => {
	const env = useRuntimeConfig();
	const user = useUser();
	const { apiClient } = useApiClient();

	const _getSession = apiClient.auth.session.$get;
	type APISession = InferResponseType<typeof _getSession, 200>;
	try {
		const data = await $fetch<APISession>("/auth/session", {
			baseURL: env.public.apiBaseUrl,
			method: "GET",
			credentials: "include",
		});
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (data) {
			user.value = data;
		}
	} catch (error: unknown) {
		if (error instanceof FetchError && error.response?.status === 401) {
			user.value = null;
		}
	}
});
