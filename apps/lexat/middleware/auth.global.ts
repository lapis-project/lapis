import type { AuthUser } from "@/types/api";

export default defineNuxtRouteMiddleware(async () => {
	const user = useUser();
	const data: AuthUser | null = await useRequestFetch()("/api/user");
	if (data) {
		user.value = data;
	}
});
