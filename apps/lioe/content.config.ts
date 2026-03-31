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
			source: "de/wboedemo.md",
			schema: z.object({
				title: z.string(),
				description: z.string(),
			}),
		}),
		content_nav_de: defineCollection({
			type: "data",
			source: "de/**/wboenav.md",
			schema: z.object({
				navHome: z.string(),
				homeIcon: z.string().editor({
					input: "icon",
					iconLibraries: ["lucide"],
				}),
				navArticles: z.string(),
				articlesIcon: z.string().editor({
					input: "icon",
					iconLibraries: ["lucide"],
				}),
				navDatabase: z.string(),
				databaseIcon: z.string().editor({
					input: "icon",
					iconLibraries: ["lucide"],
				}),
				navMapping: z.string(),
				mappingIcon: z.string().editor({
					input: "icon",
					iconLibraries: ["lucide"],
				}),
				navInformation: z.string(),
				infoIcon: z.string().editor({
					input: "icon",
					iconLibraries: ["lucide"],
				}),
			}),
		}),
	},
});
