import type { AppType } from "@lapis/backend/api";
import { hc, type InferResponseType } from "hono/client";

export default defineSitemapEventHandler(async (event) => {
	const { public: config } = useRuntimeConfig(event);
	const client = hc<AppType>(config.apiBaseUrl);
	type Articles = InferResponseType<(typeof client.articles.sitemap)[":project"]["$get"], 200>;
	const articles = await $fetch<Articles>("articles/sitemap/1", {
		baseURL: config.apiBaseUrl,
	});

	return articles
		.filter((article) => article.alias)
		.map((article) => ({
			loc: `/articles/${encodeURIComponent(article.alias!)}`,
			lastmod: article.updated_at ?? article.published_at ?? undefined,
			// Article routes are available under both UI locales.
			_i18nTransform: true,
		}));
});
