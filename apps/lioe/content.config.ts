import { defineCollection, defineContentConfig, z } from "@nuxt/content";

export default defineContentConfig({
	collections: {
		content_en: defineCollection({
			type: "page",
			source: "en/**/*.md",
			// This schema creates the "form" you see in Nuxt Studio
			schema: z.object({
				title: z.string(),
				description: z.string(),
				linksTitle: z.string(),
			}),
		}),
		content_de: defineCollection({
			type: "page",
			source: "de/**/*.md",
			schema: z.object({
				title: z.string(),
				description: z.string(),
				linksTitle: z.string(),
			}),
		}),
	},
});
