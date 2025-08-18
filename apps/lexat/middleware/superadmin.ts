export default defineNuxtRouteMiddleware(async () => {
	const localePath = useLocalePath();
	const user = useUser();

	if (user.value?.role_name !== "superadmin") {
		return navigateTo(localePath(`/admin/articles?superadmin=false`));
	}
});
