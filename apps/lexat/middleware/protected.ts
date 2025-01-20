export default defineNuxtRouteMiddleware(async () => {
	const localePath = useLocalePath();
	const route = useRoute();

	const user = useUser();
	const redirectPath = route.path;
	if (!user.value) {
		return navigateTo(localePath(`/login?redirect=${redirectPath}`));
	}
});
