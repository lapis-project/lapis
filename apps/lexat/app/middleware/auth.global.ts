import type { InferResponseType } from "hono/client";
import { FetchError } from "ofetch";

export default defineNuxtRouteMiddleware(async (to, from) => {
	// 1. Skip if we’re navigating on the same page and only the query/hash changed
	//    (don’t do this on the very first load when `from` is still undefined).
	if (import.meta.client && from.path === to.path) {
		return;
	}

	const env = useRuntimeConfig();
	const user = useUser();
	const { apiClient } = useApiClient();

	// Grab the incoming Cookie header (works in SSR and client)
	const headers = useRequestHeaders(["cookie"]);

	const _getSession = apiClient.auth.session.$get;
	type APISession = InferResponseType<typeof _getSession, 200>;

	try {
		const data = await $fetch<APISession>("/auth/session", {
			baseURL: env.public.apiBaseUrl,
			method: "GET",
			headers,
			credentials: "include", // optional, but makes intent clear
		});

		if (data.id) {
			user.value = data;
		}
	} catch (error: unknown) {
		if (error instanceof FetchError && error.response?.status === 401) {
			user.value = null;
		}
	}
});
