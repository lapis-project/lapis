import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { number, object, string } from "valibot";

const articles = new Hono();

const articleRouteSchmema = object({
	searchTerm: string(),
	page: number(),
	offset: number(),
	pageSize: number(),
	category: string(), // Does it allow as an enum? ARTICLE | BLOG | NEWS
});

const articleRoute = articles.get(
	"/articles/:project",
	vValidator("query", articleRouteSchmema),
	(c) => {
		return c.json("OK", 201);
	},
);

const articleDetail = articles.get("/detail/:alias", (c) => {
	return c.json("OK", 201);
});

export type ArticleRouteType = typeof articleRoute;
export type ArticleDetailType = typeof articleDetail;

export default articles;
