import { Hono } from "hono";

const cms = new Hono();

const createNewArticleSchema = z.object({
	title: z.string(),
	cover: z.string().optional(), // Wie sind die Bilder abgespeichert? Wo passiert der Optimierungsschritt? Was wird zurückgeliefert?
	content: z.string(), // Wie wird der Content in verschiedenen Sprachen gespeichert? Innerhalb eines Tupels oder mehrere?
	category: z.string(), // Does it allow as an enum? ARTICLE | BLOG | NEWS
	authors: z.array(z.string()),
	bibliography: z.array(z.string()),
	publishedAt: z.string(),
	status: z.string(), // Does it allow as an enum? DRAFT | PUBLISHED | ARCHIVED
	abstract: z.string(),
	lang: z.string(), // Does it allow as an enum? EN | FI | SV
});

const deleteArticle = cms.delete("/cms/:id", async (c) => {});

const editArticle = cms.put("/cms/:id", async (c) => {});

const cmsRoute = cms.get(
	"/cms/:project",
	zValidator(
		"query",
		z.object({
			searchTerm: z.string(),
			page: z.number(),
			offset: z.number(),
			pageSize: z.number(),
			category: z.string(), // Does it allow as an enum? ARTICLE | BLOG | NEWS
		}),
	),
	async (c) => {},
);

const articleCMSDetail = cms.get("/cms/:id", async (c) => {});

const createNewArticle = cms.post(
	"/cms",
	zValidator("json", createNewArticleSchema),
	async (c) => {},
);

export type DeleteArticleType = typeof deleteArticle;
export type EditArticleType = typeof editArticle;
export type CmsRouteType = typeof cmsRoute;
export type ArticleCMSDetailType = typeof articleCMSDetail;
export type CreateNewArticleType = typeof createNewArticle;

export default cms;
