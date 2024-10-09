import { FetchError } from "ofetch";

import type { AuthUser } from "@/types/api";

export default defineNuxtRouteMiddleware(async () => {
	const env = useRuntimeConfig();
	const user = useUser();
	try {
		const data: AuthUser | null = await $fetch("/auth/session", {
			baseURL: env.public.apiBaseUrl,
			method: "GET",
			credentials: "include",
		});
		if (data) {
			user.value = data;
		}
	} catch (error: unknown) {
		if (error instanceof FetchError && error.response?.status === 401) {
			user.value = null;
		}
	}
});
