export default defineNuxtRouteMiddleware(async () => {
	const localePath = useLocalePath();

	const user = useUser();
	if (!user.value) {
		return navigateTo(localePath("/login"));
	}
});
