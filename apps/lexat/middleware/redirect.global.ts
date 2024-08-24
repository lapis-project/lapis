// eslint-disable-next-line consistent-return
export default defineNuxtRouteMiddleware((to) => {
	if (to.path === "/admin") {
		return navigateTo("/admin/articles", {
			redirectCode: 301,
		});
	}
});
