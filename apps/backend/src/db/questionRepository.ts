import { log } from "@acdh-oeaw/lib";
import { type OrderByDirectionExpression, sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import { jsonbBuildObject } from "@/lib/dbHelper";

import { db } from "./connect";

export async function getAllPhenomenon(projectId: string) {
	const projectIdParsed = parseInt(projectId);
	if (Number.isNaN(projectIdParsed) || projectIdParsed < 0) {
		return await db
			.selectFrom("phenomenon")
			.leftJoin("phenomenon_post", "phenomenon.id", "phenomenon_post.phenomenon_id")
			.leftJoin("post", (join) =>
				join
					.onRef("phenomenon_post.post_id", "=", "post.id")
					.on("post.post_status", "=", "Published"),
			)
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
	return await db
		.selectFrom("phenomenon")
		.innerJoin("phenomenon_tagset", "phenomenon.id", "phenomenon_tagset.phenomenon_id")
		.innerJoin("tagset", "phenomenon_tagset.tagset_id", "tagset.id")
		.innerJoin("project_tagset", "tagset.id", "project_tagset.tagset_id")
		.leftJoin("phenomenon_post", "phenomenon.id", "phenomenon_post.phenomenon_id")
		.leftJoin("post", (join) =>
			join
				.onRef("phenomenon_post.post_id", "=", "post.id")
				.on("post.post_status", "=", "Published"),
		)
		.where("project_tagset.project_id", "=", projectIdParsed)
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

export async function getAllPhenomenonById(projectId: string, phenomenonId: string) {
	const projectIdParsed = parseInt(projectId);
	log.info(`Using following project: ${projectIdParsed.toString()}`);
	const phenomenonIdParsed = parseInt(phenomenonId);
	if (Number.isNaN(phenomenonIdParsed) || phenomenonIdParsed < 0) {
		return [];
	}

	if (Number.isNaN(projectIdParsed) || projectIdParsed < 0) {
		const dbQuery = db
			.with("annotation_data", (query) =>
				query
					.selectFrom("response")
					.innerJoin("annotation_response", "response.id", "annotation_response.response_id")
					.innerJoin("annotation", "annotation_response.annotation_id", "annotation.id")
					.innerJoin("task", "response.task_id", "task.id")
					.innerJoin("phenomenon_task", "task.id", "phenomenon_task.task_id")
					.innerJoin("phenomenon", "phenomenon_task.phenomenon_id", "phenomenon.id")
					.innerJoin("task_variety", "task.id", "task_variety.task_id")
					.innerJoin("variety", "task_variety.variety_id", "variety.id")
					.where("phenomenon.id", "=", phenomenonIdParsed)
					.select(({ eb }) => [
						"response.informant_id",
						eb.fn
							.jsonAgg(
								jsonBuildObject({
									annotation: eb.ref("annotation.annotation_name"),
									response: eb.ref("response.response_text"),
									phenomenon: eb.ref("phenomenon.phenomenon_name"),
									variety: eb.ref("variety.variety_name"),
								}),
							)
							.as("annotations"),
					])
					.groupBy(["response.informant_id"]),
			)
			.selectFrom("phenomenon")
			.innerJoin("phenomenon_tagset", "phenomenon.id", "phenomenon_tagset.phenomenon_id")
			.innerJoin("tagset", "phenomenon_tagset.tagset_id", "tagset.id")
			.innerJoin("annotation_tagset", "tagset.id", "annotation_tagset.tagset_id")
			.innerJoin("annotation", "annotation_tagset.annotation_id", "annotation.id")
			.innerJoin("annotation_response", "annotation.id", "annotation_response.annotation_id")
			.innerJoin("response", "annotation_response.response_id", "response.id")
			.innerJoin("phenomenon_task", "phenomenon.id", "phenomenon_task.phenomenon_id")
			.innerJoin("task", (join) =>
				join
					.onRef("phenomenon_task.task_id", "=", "task.id")
					.onRef("task.id", "=", "response.task_id"),
			)
			.innerJoin("task_variety", "task.id", "task_variety.task_id")
			.innerJoin("variety", "task_variety.variety_id", "variety.id")
			.innerJoin("informant", "response.informant_id", "informant.id")
			.innerJoin("age_group", "informant.age_group_id", "age_group.id")
			.innerJoin(
				"informant_lives_in_place",
				"informant.id",
				"informant_lives_in_place.informant_id",
			)
			.innerJoin("place", "informant_lives_in_place.place_id", "place.id")
			.innerJoin("annotation_data", "informant.id", "annotation_data.informant_id")
			.where("phenomenon.id", "=", phenomenonIdParsed)
			.select(({ eb }) => [
				"place.place_name",
				"place.plz",
				"place.lat",
				"place.lon",
				eb.fn.coalesce(
					eb.fn.jsonAgg(
						jsonbBuildObject({
							age: eb.ref("age_group.age_group_name"),
							gender: eb.ref("informant.gender"),
							informant_id: eb.ref("informant.id"),
							answers: eb.fn.coalesce(eb.ref("annotations"), sql`'[]'`),
						}),
					),
				),
			])
			.groupBy(["place.plz", "place.lat", "place.lon", "place.place_name"]);
		return await dbQuery.execute();
	}

	const request = db
		.with("annotation_data", (query) =>
			query
				.selectFrom("response")
				.innerJoin("annotation_response", "response.id", "annotation_response.response_id")
				.innerJoin("annotation", "annotation_response.annotation_id", "annotation.id")
				.innerJoin("task", "response.task_id", "task.id")
				.innerJoin("phenomenon_task", "task.id", "phenomenon_task.task_id")
				.innerJoin("phenomenon", "phenomenon_task.phenomenon_id", "phenomenon.id")
				.innerJoin("task_variety", "task.id", "task_variety.task_id")
				.innerJoin("variety", "task_variety.variety_id", "variety.id")
				.innerJoin("phenomenon_tagset", "phenomenon.id", "phenomenon_tagset.phenomenon_id")
				.innerJoin("tagset", "phenomenon_tagset.tagset_id", "tagset.id")
				.innerJoin("project_tagset", "tagset.id", "project_tagset.tagset_id")
				.where("phenomenon.id", "=", phenomenonIdParsed)
				.where("project_tagset.project_id", "=", projectIdParsed)
				// eslint-disable-next-line @typescript-eslint/unbound-method
				.select(({ fn, ref }) => [
					"response.informant_id",
					fn
						.jsonAgg(
							jsonBuildObject({
								annotation: ref("annotation.annotation_name"),
								response: ref("response.response_text"),
								phenomenon: ref("phenomenon.phenomenon_name"),
								variety: ref("variety.variety_name"),
							}),
						)
						.as("annotations"),
				])
				.groupBy(["response.informant_id"]),
		)
		.selectFrom("phenomenon")
		.innerJoin("phenomenon_tagset", "phenomenon.id", "phenomenon_tagset.phenomenon_id")
		.innerJoin("tagset", "phenomenon_tagset.tagset_id", "tagset.id")
		.innerJoin("project_tagset", "tagset.id", "project_tagset.tagset_id")
		.innerJoin("annotation_tagset", "tagset.id", "annotation_tagset.tagset_id")
		.innerJoin("annotation", "annotation_tagset.annotation_id", "annotation.id")
		.innerJoin("annotation_response", "annotation.id", "annotation_response.annotation_id")
		.innerJoin("response", "annotation_response.response_id", "response.id")
		.innerJoin("phenomenon_task", "phenomenon.id", "phenomenon_task.phenomenon_id")
		.innerJoin("task", (join) =>
			join
				.onRef("phenomenon_task.task_id", "=", "task.id")
				.onRef("task.id", "=", "response.task_id"),
		)
		.innerJoin("task_variety", "task.id", "task_variety.task_id")
		.innerJoin("variety", "task_variety.variety_id", "variety.id")
		.innerJoin("informant", "response.informant_id", "informant.id")
		.innerJoin("age_group", "informant.age_group_id", "age_group.id")
		.innerJoin("informant_lives_in_place", "informant.id", "informant_lives_in_place.informant_id")
		.innerJoin("place", "informant_lives_in_place.place_id", "place.id")
		.innerJoin("annotation_data", "informant.id", "annotation_data.informant_id")
		.where("phenomenon.id", "=", phenomenonIdParsed)
		.where("project_tagset.project_id", "=", projectIdParsed)
		.select(({ fn, ref }) => [
			"place.place_name",
			"place.plz",
			"place.lat",
			"place.lon",
			fn.coalesce(
				fn.jsonAgg(
					jsonbBuildObject({
						age: ref("age_group.age_group_name"),
						gender: ref("informant.gender"),
						informant_id: ref("informant.id"),
						answers: fn.coalesce(ref("annotations"), sql`'[]'`),
					}),
				),
			),
		])
		.groupBy(["place.plz", "place.lat", "place.lon", "place.place_name"]);

	return await request.execute();
}

export async function getAnnotationsByPhaenAndProjectId(projectId: number, phenId: number) {
	return await db
		.selectFrom("annotation")
		.innerJoin("annotation_tagset", "annotation.id", "annotation_tagset.annotation_id")
		.innerJoin("tagset", "annotation_tagset.tagset_id", "tagset.id")
		.innerJoin("phenomenon_tagset", "tagset.id", "phenomenon_tagset.tagset_id")
		.select(["annotation.id", "annotation.annotation_name", "annotation.description"])
		.where("annotation.project_id", "=", projectId)
		.where("phenomenon_tagset.phenomenon_id", "=", phenId)
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
	order_by_dir: OrderByDirectionExpression,
) {
	// eslint-disable-next-line @typescript-eslint/unbound-method
	const { ref } = db.dynamic;

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
				sql<number>`ROW_NUMBER() OVER (order by response.id)`.as("rn"),
				eb.ref("response.response_text").as("response"),
				eb.ref("annotation.annotation_name").as("annotation"),
				eb.ref("phenomenon.phenomenon_name").as("phenomenon"),
				eb.fn.coalesce(eb.ref("variety.variety_name"), eb.val("Weitere Antwort")).as("variety"),
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

		if (order_by) {
			dbQuery = dbQuery.orderBy(ref(order_by), order_by_dir);
		}
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
