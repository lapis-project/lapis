import type { RouteLocationNormalized } from "vue-router";

export default defineNuxtPlugin((nuxtApp) => {
	const router = useRouter();
	const route = useRoute();

	// TODO find solution using SSR request headers
	// if (import.meta.server) {
	// 	const event = nuxtApp.ssrContext?.event;
	// 	const referer = event?.node.req.headers.referer ?? "/";
	// 	const host = event?.node.req.headers.host ?? "lexat21.lapis-online.at";
	// 	const rawProtocol = event?.node.req.headers["x-forwarded-proto"];
	// 	const protocol = (Array.isArray(rawProtocol) ? rawProtocol[0] : rawProtocol) ?? "https";

	// 	let refPath = "/";
	// 	try {
	// 		refPath = new URL(referer, `${protocol}://${host}`).pathname;
	// 	} catch (e) {
	// 		console.error(e);
	// 		refPath = "/";
	// 	}

	// 	const fakeFromRoute = {
	// 		...route,
	// 		fullPath: refPath,
	// 	} as RouteLocationNormalized;

	// 	trackPageView(route, fakeFromRoute);
	// }

	if (import.meta.client && process.env.NODE_ENV === "production") {
		// track on initial load
		nuxtApp.hook("app:mounted", () => {
			const fakeFromRoute = {
				...route,
				fullPath: new URL(document.referrer || "/", window.location.origin).pathname,
			} as RouteLocationNormalized;

			trackPageView(route, fakeFromRoute);
		});

		// track on client-side route changes
		router.afterEach((to, from) => {
			// don't trigger on query param changes
			if (to.path !== from.path) {
				trackPageView(to, from);
			}
		});
	}
});
