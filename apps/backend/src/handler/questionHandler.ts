import { Hono } from "hono";

const questions = new Hono();

const questionsForSurvey = questions.get("/survey/:project", async (c) => {});

const mapAlias = questions.get("/question/:id", async (c) => {});

const responsesByQuery = questions.get(
	"/responses",
	zValidator(
		"query",
		z.object({
			searchTerm: z.string(),
			project: z.string(),
			sortBy: z.object({
				field: z.string(),
				order: z.string(),
			}),
			page: z.number(),
			offset: z.number(),
			pageSize: z.number(),
		}),
		async (c) => {},
	),
);

const saveMap = questions.post("/map", zValidator("json", saveMapSchema), async (c) => {});

const getSavedMap = questions.get("/map/:id", async (c) => {});

export type QuestionsForSurveyType = typeof questionsForSurvey;
export type MapAliasType = typeof mapAlias;
export type ResponsesByQueryType = typeof responsesByQuery;
export type SaveMapType = typeof saveMap;

export default questions;
