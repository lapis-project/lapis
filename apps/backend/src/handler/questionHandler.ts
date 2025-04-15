import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import type { OrderByDirectionExpression } from "kysely";
import { array, number, object, optional, safeParse, string } from "valibot";

// import { restrictedRoute } from "@/lib/authHelper";
import type { Context } from "@/lib/context";

import {
	getAllPhenomenon,
	getAllPhenomenonById,
	getAllRegister,
	getAnnotationsByPhaenAndProjectId,
	getResultsByPhaen,
} from "../db/questionRepository";

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
// questions.use("*", restrictedRoute);

const questions = new Hono<Context>()
	.get("/survey/:project", async (c) => {
		const projectId = c.req.param("project");
		if (!projectId) {
			return c.json("Project Id is required", 400);
		}

		const allQuestions = await getAllPhenomenon(projectId);

		for (const question of allQuestions) {
			if (question.post_alias) {
				question.post_alias = `https://lexat.acdh-ch-dev.oeaw.ac.at/de/articles/${question.post_alias}`;
			}
		}
		return c.json(allQuestions, 200);
	})
	.get("/", async (c) => {
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
	})
	.get("/responses", vValidator("json", searchResponseQuerySchema), (c) => {
		return c.json("OK", 201);
	})
	.post("/map", vValidator("json", saveMapSchema), (c) => {
		return c.json("OK", 201);
	})
	.get("/map/:id", (c) => {
		return c.json("OK", 201);
	})
	.get("/table/:id", async (c) => {
		const phenomenonId = c.req.param("id");
		const { project, page, offset, pageSize, lowerAge, upperAge, orderBy, dir } = c.req.query();

		/*
		 * orderBy can receive the parameters which influence the order of the result query for the table view
		 * this can be by:
		 * - response_text (res)
		 * - annotation (anno)
		 * - phenomenon (phen)
		 * - variety (var)
		 * - place (place)
		 * - age of the participant (age)
		 * - informant id (infid)
		 *
		 * This needs to be provided in a string array where each item can also be prefixed with a + or -
		 * + means ascending order while - means descending order
		 *
		 * example: ["+anno", "-phen"] would sort by annotation in an ascending order and afterwards phen in a descending order
		 */
		const { annotations, varIds } = c.req.queries();

		if (!phenomenonId || Number.isNaN(Number(phenomenonId))) {
			return c.json("Phenomenon id is required", 400);
		}

		const numberSchema = optional(number());
		const stringSchema = optional(string());

		const pageSizeParsed = Number(pageSize ?? 100);
		const pageNumParsed = Number(page ?? 1);
		let orderByParsed = orderBy ?? "";

		const offsetParsed = Number(offset ?? 0);
		if (!safeParse(numberSchema, pageNumParsed).success) {
			return c.json("Provided page number is not a number", 400);
		}

		if (!safeParse(numberSchema, offsetParsed).success) {
			return c.json("Provided offset number is not a number", 400);
		}

		if (!safeParse(numberSchema, pageSizeParsed).success) {
			return c.json("Provided pagesize number is not a number", 400);
		}

		if (!safeParse(stringSchema, orderByParsed).success) {
			return c.json("Provided orderby argument is not a string", 400);
		}

		let varIdsParsed = [] as Array<number>;
		let annotationsParsed = [] as Array<string>;

		if (varIds && !varIds.includes("")) {
			varIdsParsed = varIds.map((id) => Number(id));
		}

		if (annotations && !annotations.includes("")) {
			annotationsParsed = annotations;
		}
		let orderByDir: OrderByDirectionExpression = "desc";
		if (orderByParsed.length > 0 && orderBy) {
			if (orderByParsed.startsWith("res")) {
				orderByParsed = "response_text";
			} else if (orderByParsed.startsWith("anno")) {
				orderByParsed = "annotation_name";
			} else if (orderByParsed.startsWith("phen")) {
				orderByParsed = "phenomenon_name";
			} else if (orderByParsed.startsWith("var")) {
				orderByParsed = "variety_name";
			} else if (orderByParsed.startsWith("place")) {
				orderByParsed = "place_name";
			} else if (orderByParsed.startsWith("age")) {
				orderByParsed = "age_group_name";
			} else if (orderByParsed.startsWith("infid")) {
				orderByParsed = "informant.comment";
			} else {
				orderByParsed = "";
			}
			if (dir === "asc") {
				orderByDir = "asc";
			}
		}

		const lowerAgeParsed = Number.isNaN(lowerAge) ? 0 : Number(lowerAge);
		const upperAgeParsed = Number.isNaN(upperAge) ? 100 : Number(upperAge);

		const queryOffset = (pageNumParsed - 1) * pageSizeParsed + offsetParsed;
		let projectIdParsed = Number(project);
		if (Number.isNaN(project) || Number(project) < 0) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			projectIdParsed = 0;
		}

		const fetchedResponses = await getResultsByPhaen(
			Number(phenomenonId),
			pageSizeParsed,
			queryOffset,
			varIdsParsed,
			annotationsParsed,
			lowerAgeParsed,
			upperAgeParsed,
			orderByParsed,
			orderByDir,
		);

		const totalCount = Number(fetchedResponses[0]?.total);
		let requestUrl = c.req.url;

		if (!requestUrl.includes("page=")) {
			requestUrl += requestUrl.includes("?") ? "&" : "?";
			requestUrl += `page=${String(pageNumParsed)}`;
		}

		if (!requestUrl.includes("pageSize=")) {
			requestUrl += requestUrl.includes("?") ? "&" : "?";
			requestUrl += `pageSize=${String(pageSizeParsed)}`;
		}

		const returnedResponses = fetchedResponses[0]?.post_query ?? [];
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
				responses: returnedResponses,
				currentPage: requestUrl,
				totalResults: totalCount,
			},
			200,
		);
	})
	/**
	 * Get all annotations from the database by the provided projectId
	 * ProjectId is required and has to be a positive number else the response will be 400
	 * @param projectId - The project id to get all annotations from
	 * @returns All annotations from the database by the provided projectId
	 * @status 200 Returns all annotations from the database by the provided projectId
	 * @status 400 Returns error if the projectId is missing, not a number or negative
	 */
	.get("/annotation/:project", async (c) => {
		const projectId = c.req.param("project");
		const { phenomenon } = c.req.query();

		if (!projectId) {
			return c.json("Project Id is required", 400);
		}

		if (!phenomenon) {
			return c.json("Phenomenon is required", 400);
		}

		const projectIdParsed = parseInt(projectId);
		if (Number.isNaN(projectIdParsed) || projectIdParsed < 0) {
			return c.json("Project Id is not a number or is negative", 400);
		}

		const phenomenonIdParsed = parseInt(phenomenon);
		if (Number.isNaN(phenomenonIdParsed) || phenomenonIdParsed < 0) {
			return c.json("Phenomenon Id is not a number or is negative", 400);
		}
		const fetchedAnnotations = await getAnnotationsByPhaenAndProjectId(
			projectIdParsed,
			phenomenonIdParsed,
		);
		return c.json(fetchedAnnotations, 200);
	})
	/**
	 * Gets all the varieties (register in the frontend) from the frontend
	 * Returns them in a hierarchical structure
	 * If there are no varieties in the database, the query will return a status code 404
	 * @returns All varieties from the frontend
	 * @status 200 Returns all varieties from the frontend
	 * @status 404 Returns error if no varieties are found
	 */
	.get("/variety", async (c) => {
		const allVariety = await getAllRegister();
		if (allVariety.length === 0) {
			return c.json("No varieties found", 404);
		}
		return c.json(allVariety, 200);
	});

export default questions;

export type QuestionType = typeof questions;
