export default defineNuxtRouteMiddleware(async (to) => {
	const localePath = useLocalePath();
	const user = useUser();

	const redirectPath = to.fullPath;

	if (!user.value) {
		return navigateTo(localePath(`/login?redirect=${redirectPath}`));
	}
});
