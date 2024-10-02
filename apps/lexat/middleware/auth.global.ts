import type { AuthUser } from "@/types/api";

export default defineNuxtRouteMiddleware(async () => {
	const env = useRuntimeConfig();
	const user = useUser();
	// const data: AuthUser | null = await useRequestFetch()("/api/user");
	const data: AuthUser | null = await $fetch("/auth/session", {
		baseURL: env.public.apiBaseUrl,
		method: "GET",
		credentials: "include",
	});
	if (data) {
		user.value = data;
	}
});
