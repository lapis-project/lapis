import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { array, number, object, optional, string } from "valibot";

const cms = new Hono();

const createNewArticleSchema = object({
	title: string(),
	cover: optional(string()), // Wie sind die Bilder abgespeichert? Wo passiert der Optimierungsschritt? Was wird zurückgeliefert?
	content: string(), // Wie wird der Content in verschiedenen Sprachen gespeichert? Innerhalb eines Tupels oder mehrere?
	category: string(), // Does it allow as an enum? ARTICLE | BLOG | NEWS
	authors: array(string()),
	bibliography: array(string()),
	publishedAt: string(),
	status: string(), // Does it allow as an enum? DRAFT | PUBLISHED | ARCHIVED
	abstract: string(),
	lang: string(), // Does it allow as an enum? EN | FI | SV
});

const searchArticleSchema = object({
	searchTerm: string(),
	page: number(),
	offset: number(),
	pageSize: number(),
	category: string(), // Does it allow as an enum? ARTICLE | BLOG | NEWS
});

const deleteArticle = cms.delete("/cms/:id", (c) => {
	return c.json("OK", 201);
});

const editArticle = cms.put("/cms/:id", (c) => {
	return c.json("OK", 201);
});

const cmsRoute = cms.get("/search/:project", vValidator("query", searchArticleSchema), (c) => {
	return c.json("OK", 201);
});

const articleCMSDetail = cms.get("/cms/:id", (c) => {
	return c.json("OK", 201);
});

const createNewArticle = cms.post(
	"/newArticle",
	vValidator("query", createNewArticleSchema),
	(c) => {
		return c.json("OK", 201);
	},
);

export type DeleteArticleType = typeof deleteArticle;
export type EditArticleType = typeof editArticle;
export type CmsRouteType = typeof cmsRoute;
export type ArticleCMSDetailType = typeof articleCMSDetail;
export type CreateNewArticleType = typeof createNewArticle;

export default cms;
