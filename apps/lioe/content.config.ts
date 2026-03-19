import { defineCollection, defineContentConfig, z } from "@nuxt/content";

export default defineContentConfig({
	collections: {
		content_en: defineCollection({
			type: "page",
			source: "en/**/index.md",
			// This schema creates the "form" you see in Nuxt Studio
			schema: z.object({
				title: z.string(),
				description: z.string(),
				linksTitle: z.string(),
			}),
		}),
		content_de: defineCollection({
			type: "page",
			source: "de/**/index.md",
			schema: z.object({
				title: z.string(),
				description: z.string(),
				linksTitle: z.string(),
			}),
		}),
		content_demo_de: defineCollection({
			type: "page",
			source: "de/**/wboedemo.md",
			schema: z.object({
				title: z.string(),
				description: z.string(),
				navHome: z.string(),
				navArticles: z.string(),
				navDatabase: z.string(),
				navMapping: z.string(),
				navInformation: z.string(),
				articlesTitle: z.string(),
				articlesText: z.string(),
				fundamentalTitle: z.string(),
				fundamentalText: z.string(),
				fullTitle: z.string(),
				fullText: z.string(),
				retrogradeTitle: z.string(),
				retrogradeText: z.string(),
				databaseTitle: z.string(),
				databaseText: z.string(),
				mappingTitle: z.string(),
				mappingText: z.string(),
				infoTitle: z.string(),
				infoText: z.string(),
				faqTitle: z.string(),
				faqText: z.string(),
			}),
		}),
	},
});
