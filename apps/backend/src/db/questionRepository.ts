import { log } from "@acdh-oeaw/lib";
import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import { jsonbBuildObject } from "@/lib/dbHelper.ts";

import { db } from "./connect.ts";

export async function getAllPhenomenon(projectId: string, surveyId?: string) {
	const projectIdParsed = parseInt(projectId);
	const surveyIdParsed = surveyId ? parseInt(surveyId) : undefined;
	const hasValidProjectId = !Number.isNaN(projectIdParsed) && projectIdParsed >= 0;
	const hasValidSurveyId = surveyIdParsed !== undefined && !Number.isNaN(surveyIdParsed);

	// Start base query
	let query = db
		.selectFrom("phenomenon")
		.leftJoin("phenomenon_post", "phenomenon.id", "phenomenon_post.phenomenon_id")
		.leftJoin("post", (join) =>
			join
				.onRef("phenomenon_post.post_id", "=", "post.id")
				.on("post.post_status", "=", "Published"),
		);

	// Apply project filter if valid project ID provided
	if (hasValidProjectId) {
		query = query
			.innerJoin("phenomenon_tagset", "phenomenon.id", "phenomenon_tagset.phenomenon_id")
			.innerJoin("tagset", "phenomenon_tagset.tagset_id", "tagset.id")
			.innerJoin("project_tagset", "tagset.id", "project_tagset.tagset_id")
			.where("project_tagset.project_id", "=", projectIdParsed);
	}

	// Apply survey filter if provided
	if (hasValidSurveyId) {
		query = query
			.innerJoin("phenomenon_task", "phenomenon.id", "phenomenon_task.phenomenon_id")
			.innerJoin("task", "phenomenon_task.task_id", "task.id")
			.innerJoin("survey_contains_task", "task.id", "survey_contains_task.task_id")
			.innerJoin("survey", "survey_contains_task.survey_id", "survey.id")
			.where("survey.id", "=", surveyIdParsed);
	}

	return await query
		.orderBy("phenomenon.phenomenon_name")
		.distinct()
		.select([
			"phenomenon.id",
			"phenomenon.phenomenon_name",
			"phenomenon.description",
			"post.alias as post_alias",
		])
		.execute();
}

export async function getAllPhenomenonById(
	projectId: number,
	phenomenonId: number,
	surveyIds: Array<number>,
) {
	log.info(`Using following project: ${projectId.toString()}`);
	if (phenomenonId < 0) {
		return [];
	}

	// Optimized query: single pass aggregation with early filtering
	let query = db
		.selectFrom("response")
		.innerJoin("annotation_response", "response.id", "annotation_response.response_id")
		.innerJoin("annotation", "annotation_response.annotation_id", "annotation.id")
		.innerJoin("task", "response.task_id", "task.id")
		.innerJoin("phenomenon_task", "task.id", "phenomenon_task.task_id")
		.innerJoin("phenomenon", "phenomenon_task.phenomenon_id", "phenomenon.id")
		.innerJoin("task_variety", "task.id", "task_variety.task_id")
		.innerJoin("variety", "task_variety.variety_id", "variety.id")
		.innerJoin("informant", "response.informant_id", "informant.id")
		.innerJoin("age_group", "informant.age_group_id", "age_group.id")
		.innerJoin("informant_lives_in_place", "informant.id", "informant_lives_in_place.informant_id")
		.innerJoin("place", "informant_lives_in_place.place_id", "place.id")
		.where("phenomenon.id", "=", phenomenonId);

	// Apply project filter early if provided
	if (projectId > 0) {
		query = query
			.innerJoin("phenomenon_tagset", "phenomenon.id", "phenomenon_tagset.phenomenon_id")
			.innerJoin("tagset", "phenomenon_tagset.tagset_id", "tagset.id")
			.innerJoin("project_tagset", "tagset.id", "project_tagset.tagset_id")
			.where("project_tagset.project_id", "=", projectId);
	}

	// Apply survey filter early if provided
	if (surveyIds.length > 0) {
		query = query
			.innerJoin("survey_contains_task", "survey_contains_task.task_id", "task.id")
			.innerJoin("survey", "survey.id", "survey_contains_task.survey_id")
			.where("survey.id", "in", surveyIds);
	}

	// Single aggregation: group by place, then informant, then answers
	const result = await query
		.select(({ eb }) => [
			eb.ref("place.place_name").as("place_name"),
			eb.ref("place.plz").as("plz"),
			eb.ref("place.lat").as("lat"),
			eb.ref("place.lon").as("lon"),
			eb.ref("informant.id").as("informant_id"),
			eb.ref("age_group.age_group_name").as("age"),
			eb.ref("informant.gender").as("gender"),
			eb.ref("annotation.annotation_name").as("annotation"),
			eb.ref("response.response_text").as("response_text"),
			eb.ref("phenomenon.phenomenon_name").as("phenomenon_name"),
			eb.ref("variety.variety_name").as("variety_name"),
		])
		.orderBy("place.place_name", "asc")
		.orderBy("informant.id", "asc")
		.execute();

	// Group results in memory (more efficient than nested JSON aggregation in DB)
	const placeMap = new Map<
		string,
		{
			place_name: string;
			plz: number;
			lat: number;
			lon: number;
			informants: Array<{
				age: string;
				gender: string;
				informant_id: number;
				answers: Array<{
					annotation: string;
					response: string;
					phenomenon: string;
					variety: string;
				}>;
			}>;
		}
	>();

	for (const row of result) {
		const placeKey = `${String(row.plz)}_${String(row.lat)}_${String(row.lon)}`;

		if (!placeMap.has(placeKey)) {
			placeMap.set(placeKey, {
				place_name: row.place_name ?? "",
				plz: row.plz ?? 0,
				lat: row.lat ?? 0,
				lon: row.lon ?? 0,
				informants: [],
			});
		}

		const place = placeMap.get(placeKey)!;
		let informant = place.informants.find((inf) => inf.informant_id === row.informant_id);

		if (!informant) {
			informant = {
				age: row.age ?? "",
				gender: row.gender ?? "",
				informant_id: row.informant_id,
				answers: [],
			};
			place.informants.push(informant);
		}

		informant.answers.push({
			annotation: row.annotation ?? "",
			response: row.response_text ?? "",
			phenomenon: row.phenomenon_name ?? "",
			variety: row.variety_name ?? "",
		});
	}

	return Array.from(placeMap.values());
}

export async function getAnnotationsByPhaenAndProjectId(projectId: number, phenId: number) {
	// This is currently commented out till the data has been completed
	// return await db
	// 	.selectFrom("annotation")
	// 	.innerJoin("annotation_tagset", "annotation.id", "annotation_tagset.annotation_id")
	// 	.innerJoin("tagset", "annotation_tagset.tagset_id", "tagset.id")
	// 	.innerJoin("phenomenon_tagset", "tagset.id", "phenomenon_tagset.tagset_id")
	// 	.select(["annotation.id", "annotation.annotation_name", "annotation.description"])
	// 	.where("annotation.project_id", "=", projectId)
	// 	.where("phenomenon_tagset.phenomenon_id", "=", phenId)
	// 	.execute();

	// WORKAROUND TODO DELETE THIS WHEN DATA HAS BEEN MENDED
	return await db
		.selectFrom("response")
		.innerJoin("annotation_response", "response.id", "annotation_response.response_id")
		.innerJoin("annotation", "annotation_response.annotation_id", "annotation.id")
		.innerJoin("task", "response.task_id", "task.id")
		.innerJoin("phenomenon_task", "task.id", "phenomenon_task.task_id")
		.innerJoin("phenomenon", "phenomenon_task.phenomenon_id", "phenomenon.id")
		.select(["annotation.id", "annotation.annotation_name", "annotation.description"])
		.where("annotation.project_id", "=", projectId)
		.where("phenomenon.id", "=", phenId)
		.distinct()
		.execute();
}

export async function getAllRegister() {
	const query = db
		.with("variety_entry", (query) =>
			query
				.selectFrom("variety as p")
				.leftJoin("variety as v", "v.variety_id", "p.id")
				.where("p.variety_id", "is", null)
				.select(({ eb }) => [
					"p.id",
					"p.variety_name",
					"p.variety_id",
					eb.fn
						.jsonAgg(
							jsonbBuildObject({
								id: eb.ref("v.id"),
								variety_name: eb.ref("v.variety_name"),
								children: sql`'[]'`,
							}),
						)
						.filterWhere("v.id", "is not", null)
						.as("children"),
				])
				.groupBy(["p.id", "p.variety_name", "p.variety_id"]),
		)
		.selectFrom("variety_entry")
		.select(({ eb }) =>
			jsonbBuildObject({
				id: eb.ref("variety_entry.id"),
				variety_name: eb.ref("variety_entry.variety_name"),
				children: eb.ref("variety_entry.children"),
			}).as("variety_entry"),
		);
	return await query.execute();
	//return await db.selectFrom("variety").select(["variety.id", "variety.variety_name"]).execute();
}

export async function getResultsByPhaen(
	phaenId: number,
	pageSize: number,
	offset: number,
	varIds: Array<number>,
	annotations: Array<string>,
	lower_age_limit: number,
	upper_age_limit: number,
	order_by: string,
	order_by_dir: string,
) {
	let row_num_query = sql<number>`ROW_NUMBER() OVER (ORDER BY ${sql.ref(order_by)} ${sql.raw(order_by_dir)})`;
	if (order_by === "") {
		row_num_query = sql<number>`ROW_NUMBER() OVER ()`;
	}
	const baseQuery = db.with("post_query", (query) => {
		let dbQuery = query
			.selectFrom("response")
			.innerJoin("annotation_response", "response.id", "annotation_response.response_id")
			.innerJoin("annotation", "annotation_response.annotation_id", "annotation.id")
			.innerJoin("task", "response.task_id", "task.id")
			.innerJoin("phenomenon_task", "task.id", "phenomenon_task.task_id")
			.innerJoin("phenomenon", "phenomenon_task.phenomenon_id", "phenomenon.id")
			.leftJoin("task_variety", "task.id", "task_variety.task_id")
			.leftJoin("variety", "task_variety.variety_id", "variety.id")
			.innerJoin("informant", "response.informant_id", "informant.id")
			.innerJoin("age_group", "informant.age_group_id", "age_group.id")
			.innerJoin(
				"informant_lives_in_place",
				"informant.id",
				"informant_lives_in_place.informant_id",
			)
			.innerJoin("place", "informant_lives_in_place.place_id", "place.id")
			.select(({ eb }) => [
				row_num_query.as("rn"),
				eb.ref("response.response_text").as("response"),
				eb.ref("annotation.annotation_name").as("annotation"),
				eb.ref("phenomenon.phenomenon_name").as("phenomenon"),
				eb.fn.coalesce(eb.ref("variety.variety_name"), eb.val("weitere Bezeichnung")).as("variety"),
				eb.ref("place.place_name").as("place"),
				eb.ref("age_group.age_group_name").as("age"),
				eb.ref("informant.comment").as("informant"),
			])
			.where("phenomenon.id", "=", phaenId)
			.where("age_group.lower_limit", ">", lower_age_limit)
			.where("age_group.upper_limit", "<=", upper_age_limit)
			.groupBy([
				"response.id",
				"annotation.annotation_name",
				"phenomenon.phenomenon_name",
				"variety.variety_name",
				"place.place_name",
				"age_group.age_group_name",
				"informant.comment",
			]);

		if (varIds.length > 0) {
			dbQuery = dbQuery.where("variety.id", "in", varIds);
		}

		if (annotations.length > 0) {
			dbQuery = dbQuery.where("annotation.annotation_name", "in", annotations);
		}

		return dbQuery;
	});
	const query = baseQuery.selectFrom("post_query").select(({ eb, fn }) => [
		fn
			.jsonAgg(
				jsonBuildObject({
					informant: eb.ref("informant"),
					response: eb.ref("response"),
					annotation: eb.ref("annotation"),
					// phenomenon: eb.ref("phenomenon"), LETS AWAIT FEEDBACK IF NEEDED
					variety: eb.ref("variety"),
					place: eb.ref("place"),
					age: eb.ref("age"),
				}),
			)
			.filterWhere("rn", ">", offset)
			.filterWhere("rn", "<=", pageSize + offset)
			.as("post_query"),
		eb.fn.countAll().as("total"),
	]);

	return await query.execute();
}

export async function getAllSurveys() {
	return await db
		.selectFrom("survey")
		.innerJoin("survey_conducted", "survey.id", "survey_conducted.survey_id")
		.select([
			"survey.id",
			"survey.description",
			"survey.survey_name",
			// workaround to return the count as number instead of string
			sql<number>`CAST(COUNT(survey_conducted.id) AS INTEGER)`.as("conducted_num"),
		])
		.groupBy("survey.id")
		.execute();
}

export async function getImpulsImageForPhen(phen_id: number) {
	return await db
		.selectFrom("phenomenon")
		.innerJoin("phenomenon_task", "phenomenon_task.phenomenon_id", "phenomenon.id")
		.innerJoin("task", "task.id", "phenomenon_task.task_id")
		.select(["task.stimulus_media", "phenomenon.id", "phenomenon.phenomenon_name"])
		.groupBy(["phenomenon.id", "task.stimulus_media"])
		.where("phenomenon.id", "=", phen_id)
		.executeTakeFirst();
}

export async function getAllImpulseImagesForPhen() {
	return await db
		.selectFrom("phenomenon")
		.innerJoin("phenomenon_task", "phenomenon_task.phenomenon_id", "phenomenon.id")
		.innerJoin("task", "task.id", "phenomenon_task.task_id")
		.where("task.stimulus_media", "is not", null)
		.select(["task.stimulus_media", "phenomenon.id", "phenomenon.phenomenon_name"])
		.groupBy(["phenomenon.id", "task.stimulus_media"])
		.execute();
}

export async function updatePhenWithNewImage(phen_id: number, image_url: string | null) {
	return await db
		.updateTable("task")
		.set({
			stimulus_media: image_url,
		})
		.where("id", "in", (eb) =>
			eb
				.selectFrom("phenomenon_task")
				.select("phenomenon_task.task_id")
				.where("phenomenon_task.phenomenon_id", "=", phen_id),
		)
		.execute();
}
