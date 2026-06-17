import type { RouterConfig } from "@nuxt/schema";

export default {
	scrollBehavior(to, from, savedPosition) {
		if (savedPosition) {
			return savedPosition;
		}

		return new Promise((resolve) => {
			setTimeout(() => {
				resolve({ top: 0, left: 0, behavior: "instant" });
			}, 10);
		});
	},
} as RouterConfig;
