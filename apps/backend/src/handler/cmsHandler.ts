import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { array, minLength, number, object, optional, pipe, string } from "valibot";

import { getUsersByList } from "@/db/authRepository";
import {
	checkBibliographyExists,
	getAllUserPhenKat,
	getPostTypeIdsByName,
	insertNewArticle,
	insertNewBibliography,
	insertNewBibliographyPost,
	linkAuthorsToPost,
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
	searchTerm: string(),
	page: number(),
	offset: number(),
	pageSize: number(),
	category: string(), // Does it allow as an enum? ARTICLE | BLOG | NEWS
});

const deleteArticle = cms.delete("/articles/:id", (c) => {
	return c.json("OK", 201);
});

const editArticle = cms.put("/:id", (c) => {
	return c.json("OK", 201);
});

const cmsRoute = cms.get("/articles/all/:project", vValidator("json", searchArticleSchema), (c) => {
	return c.json("OK", 201);
});

/*
 * returns all fields of an article, Is identified by the id
 */
const articleCMSDetail = cms.get("/articles/:id", (c) => {
	return c.json("OK", 201);
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
			const bibIds = (await checkBibliographyExists(body.bibliography)).map((el) => el.id);
			const bibsToInsert = body.bibliography.filter((el) => !el);
			let newBibIds: Array<number> = [];
			if (bibsToInsert.length > 0)
				newBibIds = (await insertNewBibliography(bibsToInsert)).map((el) => el.id);
			await insertNewBibliographyPost(bibIds.concat(newBibIds), articleId.id);
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
