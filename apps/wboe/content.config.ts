import { defineCollection, defineContentConfig, z } from "@nuxt/content";
import { defineSitemapSchema } from "@nuxtjs/seo/content";

const commonSchema = z.object({
	title: z.string(),
	description: z.string(),
	linksTitle: z.string(),
	sitemap: defineSitemapSchema(),
});

export default defineContentConfig({
	collections: {
		content_en: defineCollection({
			type: "page",
			source: {
				include: "en/**/index.md",
				prefix: "/en",
			},
			schema: commonSchema,
		}),
		content_de: defineCollection({
			type: "page",
			source: {
				include: "de/**/index.md",
				prefix: "/de",
			},
			schema: commonSchema,
		}),
		resources_de: defineCollection({
			type: "page",
			source: {
				include: "de/**/resources.md",
				prefix: "/de",
			},
			schema: commonSchema,
		}),
		resources_en: defineCollection({
			type: "page",
			source: {
				include: "en/**/resources.md",
				prefix: "/en",
			},
			schema: commonSchema,
		}),
	},
});
