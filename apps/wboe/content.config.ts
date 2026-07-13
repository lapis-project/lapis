import { defineCollection, defineContentConfig, z } from "@nuxt/content";

const commonSchema = z.object({
	title: z.string(),
	description: z.string(),
	linksTitle: z.string(),
});

export default defineContentConfig({
	collections: {
		content_en: defineCollection({
			type: "page",
			source: {
				include: "en/**/index.md",
				prefix: "",
			},
			schema: commonSchema,
		}),
		content_de: defineCollection({
			type: "page",
			source: {
				include: "de/**/index.md",
				prefix: "",
			},
			schema: commonSchema,
		}),
		resources_de: defineCollection({
			type: "page",
			source: {
				include: "de/**/resources.md",
				prefix: "",
			},
			schema: commonSchema,
		}),
		resources_en: defineCollection({
			type: "page",
			source: {
				include: "en/**/resources.md",
				prefix: "",
			},
			schema: commonSchema,
		}),
	},
});
