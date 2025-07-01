export default defineNuxtPlugin(() => {
	const router = useRouter();

	router.afterEach((to, from) => {
		// don't trigger on query param changes
		if (to.path !== from.path) {
			trackPageView(to, from);
		}
	});
});
