import { Hono } from "hono";
import { number, optional, safeParse, string } from "valibot";

import { getAllArticlesByProject, getArticleByAlias } from "@/db/articleRepository";

const articles = new Hono();

/*
* Currently commented out
* Maybe needed a bit later?
const articleRouteSchmema = object({
	category: string(), // Does it allow as an enum? ARTICLE | BLOG | NEWS
});
*/

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const articleRoute = articles.get("/articles/:project", async (c) => {
	const projectId = c.req.param("project");

	if (!projectId || Number.isNaN(Number(projectId))) {
		return c.json("Provided projectId is not a number", 400);
	}

	const { searchTerm, page, offset, pageSize, category } = c.req.query();

	// TODO Refactor this functions into utilities
	const stringSchema = optional(string());
	const numberSchema = optional(number());

	const pageSizeParsed = Number(pageSize ?? 20);
	const pageNumParsed = Number(page ?? 1);

	const offsetParsed = Number(offset ?? 0);
	if (!safeParse(stringSchema, searchTerm).success) {
		return c.json("Provided search term is not a string", 400);
	}

	if (!safeParse(numberSchema, pageNumParsed).success) {
		return c.json("Provided page number is not a number", 400);
	}

	if (!safeParse(numberSchema, offsetParsed).success) {
		return c.json("Provided offset number is not a number", 400);
	}

	if (!safeParse(numberSchema, pageSizeParsed).success) {
		return c.json("Provided pagesize number is not a number", 400);
	}

	const queryOffset = (pageNumParsed - 1) * pageSizeParsed + offsetParsed;

	const fetchedArticles = await getAllArticlesByProject(
		Number(projectId),
		pageSizeParsed,
		queryOffset,
		searchTerm ?? "",
		category ?? "",
		"Published",
	);

	const articles = fetchedArticles[0]?.articles;
	const totalCount = Number(fetchedArticles[0]?.total);
	const requestUrl = c.req.url;
	return c.json(
		{
			prev:
				pageNumParsed > 1 && totalCount !== 0 && !(queryOffset > totalCount)
					? requestUrl.replace(`page=${String(pageNumParsed)}`, `page=${String(pageNumParsed - 1)}`)
					: null,
			next:
				totalCount > pageSizeParsed + queryOffset
					? requestUrl.replace(`page=${String(pageNumParsed)}`, `page=${String(pageNumParsed + 1)}`)
					: null,
			articles: articles ? articles : [],
			currentPage: requestUrl,
			totalResults: totalCount,
		},
		201,
	);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const articleDetail = articles.get("/detail/:alias", async (c) => {
	const articleAlias = c.req.param("alias");
	const aliasSchema = string();
	const result = safeParse(aliasSchema, articleAlias);

	if (!result.success) {
		return c.json("Provided alias is not a string", 400);
	}

	const fetchedArticle = await getArticleByAlias(articleAlias);
	return c.json({ article: fetchedArticle }, 201);
});

export type ArticleRouteType = typeof articleRoute;
export type ArticleDetailType = typeof articleDetail;

export default articles;
