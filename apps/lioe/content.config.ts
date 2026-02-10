import { defineContentConfig, defineCollection, z } from "@nuxt/content";

export default defineContentConfig({
	collections: {
		content_en: defineCollection({
			type: "page",
			source: {
				include: "en/**",
				prefix: "",
			},
			// This schema creates the "form" you see in Nuxt Studio
			schema: z.object({
				title: z.string(),
				description: z.string(),
				linksTitle: z.string(),
			}),
		}),
		content_de: defineCollection({
			type: "page",
			source: {
				include: "de/**",
				prefix: "",
			},
			schema: z.object({
				title: z.string(),
				description: z.string(),
				linksTitle: z.string(),
			}),
		}),
	},
});
