import { Hono } from "hono";

const articles = new Hono();

const articleRoute = articles.get(
	"/articles/:project",
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

const articleDetail = articles.get("/article/:alias", async (c) => {});

export type ArticleRouteType = typeof articleRoute;
export type ArticleDetailType = typeof articleDetail;

export default articles;
