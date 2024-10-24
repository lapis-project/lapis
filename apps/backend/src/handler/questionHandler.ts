import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { array, number, object, string } from "valibot";

// import { restrictedRoute } from "@/lib/authHelper";
import type { Context } from "@/lib/context";

import { getAllPhenomenon, getAllPhenomenonById } from "../db/questionRepository";

const questions = new Hono<Context>();

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

// Enable in order to restrict the route only to signed in users
// questions.use("*", restricedRoute);

const questionsForSurvey = questions.get("/survey/:project", async (c) => {
	const projectId = c.req.param("project");
	if (!projectId) {
		return c.json("Project Id is required", 400);
	}
	const allQuestions = await getAllPhenomenon(projectId);
	return c.json(allQuestions, 200);
});

const questionsByIdAndProject = questions.get("/", async (c) => {
	const projectId = c.req.query("project");
	const phenomenonId = c.req.query("id");
	/*
	 * Would also work by using the deconstructed object
	 */
	if (!phenomenonId) {
		return c.json("Phenomenon Id is required", 400);
	}
	const questionById = await getAllPhenomenonById(projectId ?? "", phenomenonId);
	return c.json(questionById, 200);
});

const mapAlias = questions.get("/:id", (c) => {
	return c.json("OK", 201);
});

const responsesByQuery = questions.get(
	"/responses",
	vValidator("json", searchResponseQuerySchema),
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
export type QuestionsByIdAndProjectType = typeof questionsByIdAndProject;

export default questions;
