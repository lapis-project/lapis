import { Hono } from "hono";
import { minLength, number, optional, pipe, safeParse, string } from "valibot";

import type { Context } from "@/lib/context";
import { generateSignedImageUrl } from "@/service/imageService";
import type { Availablelang } from "@/types/db";

import { getAllArticlesByProject, getArticleByAlias } from "../db/articleRepository";

const articles = new Hono<Context>()

	/**
	 * Fetches all articles by project id which have the status as published.
	 * Will return this in a paged format as a json. The page size is 20 by default and it starts from page 1 with an offset of 0.
	 * The projectId is passed as a parameter in the URL and is required.
	 *
	 * searchTerm, page, offset, pageSize, category and language (lang) are optional query parameters and will be included if they are provided.
	 *
	 * @returns status code 400 if the projectId is not a number
	 * @returns status code 201 with an result object containing the articles, the total number of articles and the current page.
	 * The articles are in a result array under the key articles. If there are no results the array is empty.
	 * prev and next contain the links for the previous and next pages if they exist.
	 * totalResults delivers the total number of results over all pages
	 */

	.get("/articles/:project", async (c) => {
		const projectId = c.req.param("project");

		if (!projectId || Number.isNaN(Number(projectId))) {
			return c.json("Provided projectId is not a number", 400);
		}

		const { searchTerm, page, offset, pageSize, category, lang } = c.req.query();

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

		if (!safeParse(stringSchema, lang).success) {
			return c.json("Provided language is not a string", 400);
		}

		const queryOffset = (pageNumParsed - 1) * pageSizeParsed + offsetParsed;
		const fetchedArticles = await getAllArticlesByProject(
			Number(projectId),
			pageSizeParsed,
			queryOffset,
			searchTerm ?? "",
			category ?? "",
			"Published",
			lang as Availablelang,
		);

		let articles = fetchedArticles[0]?.articles ?? [];
		// TODO kkukelka: remove s3:// check once all images are migrated
		articles = articles.map((a) => ({
			...a,
			cover: a.cover.startsWith("s3://") ? generateSignedImageUrl(a.cover, 640) : a.cover,
		}));
		const totalCount = Number(fetchedArticles[0]?.total);
		let requestUrl = c.req.url;

		if (!requestUrl.includes("page=")) {
			requestUrl += requestUrl.includes("?") ? "&" : "?";
			requestUrl += `page=${String(pageNumParsed)}`;
		}

		if (!requestUrl.includes("pageSize=")) {
			requestUrl += requestUrl.includes("?") ? "&" : "?";
			requestUrl += `pageSize=${String(pageSizeParsed)}`;
		}
		return c.json(
			{
				prev:
					pageNumParsed > 1 && totalCount !== 0 && !(queryOffset > totalCount)
						? requestUrl.replace(
								`page=${String(pageNumParsed)}`,
								`page=${String(pageNumParsed - 1)}`,
							)
						: null,
				next:
					totalCount > pageSizeParsed + queryOffset
						? requestUrl.replace(
								`page=${String(pageNumParsed)}`,
								`page=${String(pageNumParsed + 1)}`,
							)
						: null,
				currentPage: requestUrl,
				totalResults: totalCount,
				articles: articles,
			},
			200,
		);
	})

	/**
	 * Fetches an article by its alias.
	 * The provided alias needs to be at least 5 characters long.
	 * The resulting object contains all information about the article as well as the linked phenomenona, the authors and the linked bibliographies
	 *
	 * @returns status code 400 if the provided alias is not a string or too short
	 * @returns status code 201 with the article object. If no article was found the object is empty
	 */

	.get("/detail/:alias", async (c) => {
		const articleAlias = c.req.param("alias");
		const aliasSchema = pipe(string(), minLength(5));
		const result = safeParse(aliasSchema, articleAlias);

		if (!result.success) {
			return c.json("Provided alias is not a string", 400);
		}

		let fetchedArticle = await getArticleByAlias(articleAlias);
		// TODO kkukelka: remove s3:// check once all images are migrated
		if (fetchedArticle?.cover?.startsWith("s3://")) {
			fetchedArticle = { ...fetchedArticle, cover: generateSignedImageUrl(fetchedArticle.cover) };
		}
		return c.json({ article: fetchedArticle }, 200);
	});

export default articles;

export type ArticleRoute = typeof articles;
