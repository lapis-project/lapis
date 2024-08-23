import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { array, number, object, string } from "valibot";

import { getAllPhenomenon } from "../db/questionRepository";

const questions = new Hono();

const saveMapSchema = object({
	project: string(),
	version: string(),
	question: string(),
	registerCategory: string(),
	registerDescription: string(),
	variants: array(string()),
	colors: array(string()),
});

const searchResponseQuerySchema = object({
	searchTerm: string(),
	project: string(),
	sortBy: object({
		field: string(),
		order: string(),
	}),
	page: number(),
	offset: number(),
	pageSize: number(),
});

const questionsForSurvey = questions.get("/survey/:project", async (c) => {
	const projectId = c.req.param("project");
	const allQuestions = await getAllPhenomenon(projectId);
	return c.json(allQuestions, 201);
});

const mapAlias = questions.get("/:id", (c) => {
	return c.json("OK", 201);
});

const responsesByQuery = questions.get(
	"/responses",
	vValidator("query", searchResponseQuerySchema),
	(c) => {
		return c.json("OK", 201);
	},
);

const saveMap = questions.post("/map", vValidator("json", saveMapSchema), (c) => {
	return c.json("OK", 201);
});

const getSavedMap = questions.get("/map/:id", (c) => {
	return c.json("OK", 201);
});

export type QuestionsForSurveyType = typeof questionsForSurvey;
export type MapAliasType = typeof mapAlias;
export type ResponsesByQueryType = typeof responsesByQuery;
export type SaveMapType = typeof saveMap;
export type GetSavedMapType = typeof getSavedMap;

export default questions;
