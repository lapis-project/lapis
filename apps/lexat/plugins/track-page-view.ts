export default defineNuxtPlugin((nuxtApp) => {
	if (import.meta.client) {
		const router = useRouter();
		const route = useRoute();

		// fire for the initial load
		nuxtApp.hook("app:mounted", () => {
			trackPageView(route, route);
		});

		// all in-app navigations
		router.afterEach((to, from) => {
			// don't trigger on query param changes
			if (to.path !== from.path) {
				trackPageView(to, from);
			}
		});
	}
});
