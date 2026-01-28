import type { InferResponseType } from "hono/client";
import { FetchError } from "ofetch";

export default defineNuxtRouteMiddleware(async (to, from) => {
	const user = useUser();

	// Skip if client-side, navigating to same route, AND WE ALREADY HAVE A USER.
	// If user is null, we should try to fetch again (in case SSR failed).
	if (import.meta.client && from.path === to.path && user.value) {
		return;
	}

	const env = useRuntimeConfig();
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
		// TODO remove after session debugging
		if (import.meta.server) {
			console.error("SSR Auth Fetch Failed:", error);
		}

		if (error instanceof FetchError && error.response?.status === 401) {
			user.value = null;
		}
	}
});
