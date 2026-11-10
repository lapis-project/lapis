export default defineNuxtRouteMiddleware((to) => {
	const localePath = useLocalePath();
	const user = useUser();

	if (!user.value) {
		return navigateTo({
			path: localePath("/login"),
			query: { redirect: to.fullPath },
		});
	}
});
