import type { RouterConfig } from "@nuxt/schema";

export default {
	scrollBehavior(to, from, savedPosition) {
		const nuxtApp = useNuxtApp();

		if (savedPosition) {
			return savedPosition;
		}
		if (to.hash) {
			return {
				el: to.hash,
				// Keep publication headings below the sticky header.
				top: to.path.endsWith("/publications") ? 90 : 0,
				behavior: "smooth",
			};
		}
		if (to.path === from.path) {
			return;
		}

		// wait for the next page to finish rendering
		return new Promise((resolve) => {
			nuxtApp.hook("page:finish", () => {
				resolve({ top: 0, left: 0, behavior: "instant" });
			});
		});
	},
} satisfies RouterConfig;
