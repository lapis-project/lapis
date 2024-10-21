import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { array, minLength, number, object, optional, pipe, string } from "valibot";

import { getAllUserPhenKat } from "@/db/cmsRepository";

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
	(c) => {
		return c.json("OK", 201);
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
