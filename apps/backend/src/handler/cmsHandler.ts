import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { array, minLength, number, object, optional, pipe, string } from "valibot";

import { getUsersByList } from "@/db/authRepository";
import {
	checkBibliographyExists,
	deleteArticleById,
	getAllArticlesByProjectId,
	getAllUserPhenKat,
	getArticleById,
	getPostTypeIdsByName,
	getProjectByIds,
	insertNewArticle,
	insertNewBibliography,
	insertNewBibliographyPost,
	linkAuthorsToPost,
	linkProjectToPost,
} from "@/db/cmsRepository";
import { instanceOfAvailablelang, instanceOfPoststatus } from "@/lib/RepoHelper";

const cms = new Hono();

const createNewArticleSchema = object({
	title: pipe(string(), minLength(5)),
	alias: pipe(string(), minLength(5)),
	cover: optional(string()), // Wie sind die Bilder abgespeichert? Wo passiert der Optimierungsschritt? Was wird zurückgeliefert?
	abstract: optional(string()),
	content: optional(string()), // Wie wird der Content in verschiedenen Sprachen gespeichert? Innerhalb eines Tupels oder mehrere?
	category: optional(string()), // Does it allow as an enum? commentary | method | project
	authors: optional(array(number())),
	bibliography: optional(array(string())),
	status: string(), // Does it allow as an enum? DRAFT | PUBLISHED | ARCHIVED
	lang: string(), // Does it allow as an enum? de | en
	phenomenonId: optional(number()), // mn relation to phenomenon
	citation: optional(string()), // Gibt es eine direkte Verbindung oder geht diese Phänomen -> Bibliography
	projectId: optional(array(number())), // mn relation to project
});

const searchArticleSchema = object({
	searchTerm: optional(string()),
	page: optional(number()),
	offset: optional(number()),
	pageSize: optional(number()),
	category: optional(string()), // Does it allow as an enum? ARTICLE | BLOG | NEWS
});

/**
 * Delete the article with the provided id as queryparam
 * Returns code 200 when the article has been processed
 */
const deleteArticle = cms.delete("/articles/:id", async (c) => {
	const articleId = c.req.param("id");
	// Check if the id is a number
	if (!articleId || Number.isNaN(Number(articleId))) {
		return c.json("Provided id is not a number", 400);
	}

	// Delete the article
	await deleteArticleById(Number(articleId));
	return c.json(`Article with the ID ${String(articleId)} has been deleted`, 200);
});

const editArticle = cms.put("/:id", (c) => {
	return c.json("OK", 201);
});

/**
 * Get all articles (posts) from a project, Does not return articles where no project has been assigned
 * @returns Object with all articleIds from the provided project id with the users who wrote them,
 * Comes in a paged format
 */
const cmsRoute = cms.get(
	"/articles/all/:project",
	vValidator("json", searchArticleSchema),
	async (c) => {
		const projectId = c.req.param("project");

		const { page, offset, pageSize, category, searchTerm } = c.req.query();

		// Check if the id is a number
		if (!projectId || Number.isNaN(Number(projectId))) {
			return c.json("Provided id is not a number", 400);
		}
		const pageSizeParsed = Number(pageSize ?? 20);
		const pageNumParsed = Number(page ?? 1);
		const queryOffset = (pageNumParsed - 1) * pageSizeParsed + Number(offset ?? 0);
		const allArticles = await getAllArticlesByProjectId(
			Number(projectId),
			pageSizeParsed,
			queryOffset,
			searchTerm ?? "",
			category ?? "",
		);
		const articles = allArticles[0]?.articles;
		const totalCount = Number(allArticles[0]?.total);
		const requestUrl = c.req.url;
		return c.json(
			{
				prev:
					pageNumParsed > 1 || totalCount !== 0
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
				articles: articles ? articles : [],
				currentPage: requestUrl,
				totalResults: totalCount,
			},
			201,
		);
	},
);

/*
 * returns all fields of an article, Is identified by the id
 */
const articleCMSDetail = cms.get("/articles/:id", async (c) => {
	const providedId = c.req.param("id");

	if (!providedId) {
		return c.json("No id provided", 400);
	}
	// Check if the id is a number
	if (Number.isNaN(Number(providedId))) {
		return c.json("Provided id is not a number", 400);
	}

	const fetchedArticle = await getArticleById(Number(providedId));
	return c.json({ article: fetchedArticle }, 201);
});

const createNewArticle = cms.post(
	"/articles/create",
	vValidator("json", createNewArticleSchema),
	async (c) => {
		// get the body
		const body = c.req.valid("json");

		// Check UserIds
		const userIds = body.authors;
		if (userIds && userIds.length >= 0) {
			const userList = await getUsersByList(userIds);

			if (userList.length !== userIds.length) {
				return c.json("Not all authors found", 400);
			}
		}
		// Check the post_type
		const category = body.category;
		if (!category) {
			return c.json("No category provided", 400);
		}
		const postTypeId = await getPostTypeIdsByName(category);

		if (!postTypeId) {
			return c.json("No post type found", 400);
		}

		// Check if the provided status is an element from the Poststatus enum
		if (!instanceOfPoststatus(body.status)) {
			return c.json("Invalid status provided", 400);
		}

		// Same for Lang
		if (!instanceOfAvailablelang(body.lang)) {
			return c.json("Invalid language provided", 400);
		}

		// Create the new article
		const articleId = await insertNewArticle(
			body.title,
			body.alias,
			body.cover,
			body.abstract,
			body.content,
			postTypeId.id,
			body.status,
			body.lang,
		);

		if (!articleId) {
			return c.json("Error while creating article", 500);
		}
		if (userIds && userIds.length > 0) {
			// Link the authors to the article
			await linkAuthorsToPost(articleId.id, userIds);
		}

		// Check if bibliography is provided
		if (body.bibliography && body.bibliography.length > 0) {
			// Link the bibliography to the article
			const existingBib = await checkBibliographyExists(body.bibliography);
			const bibsToInsert = body.bibliography.filter(
				(el) => !existingBib.some((bib) => bib.name_bibliography === el),
			);
			let newBibIds: Array<number> = [];
			if (bibsToInsert.length > 0)
				newBibIds = (await insertNewBibliography(bibsToInsert)).map((el) => el.id);
			const bibIds = existingBib.map((el) => el.id);
			await insertNewBibliographyPost(bibIds.concat(newBibIds), articleId.id);
		}

		// Check if the project is provided and insert it if it is
		if (body.projectId && body.projectId.length > 0) {
			// Ask the DB if the article exists
			const existingProjects = await getProjectByIds(body.projectId);
			if (existingProjects.length !== body.projectId.length) {
				return c.json("Article not found", 404);
			}
			// Link the project to the article
			await linkProjectToPost(articleId.id, body.projectId);
		}
		return c.json(
			{
				articleId: articleId,
			},
			201,
		);
	},
);

const getAuthorInformation = cms.get("/articles/create/info", async (c) => {
	const information = await getAllUserPhenKat("1");
	const authors = information.filter((el) => el.category === "user");
	const categories = information.filter((el) => el.category === "category");
	const phenomenon = information.filter((el) => el.category === "phenomenon");

	const informationList = {
		authors: authors,
		categories: categories,
		phenomenon: phenomenon,
	};
	return c.json(informationList, 200);
});

export type DeleteArticleType = typeof deleteArticle;
export type EditArticleType = typeof editArticle;
export type CmsRouteType = typeof cmsRoute;
export type ArticleCMSDetailType = typeof articleCMSDetail;
export type CreateNewArticleType = typeof createNewArticle;
export type GetAuthorInformationType = typeof getAuthorInformation;

export default cms;
