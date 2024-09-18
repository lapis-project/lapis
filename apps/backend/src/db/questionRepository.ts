import { log } from "@acdh-oeaw/lib";
import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import { db } from "./connect";

export async function getAllPhenomenon(projectId: string) {
	const projectIdParsed = parseInt(projectId);
	if (Number.isNaN(projectIdParsed) || projectIdParsed < 0) {
		return await db
			.selectFrom("phenomenon")
			.orderBy("phenomenon.phenomenon_name")
			.distinct()
			.select(["phenomenon.id", "phenomenon.phenomenon_name", "phenomenon.description"])
			.execute();
	}
	return await db
		.selectFrom("phenomenon")
		.innerJoin("phenomenon_tagset", "phenomenon.id", "phenomenon_tagset.phenomenon_id")
		.innerJoin("tagset", "phenomenon_tagset.tagset_id", "tagset.id")
		.innerJoin("project_tagset", "tagset.id", "project_tagset.tagset_id")
		.where("project_tagset.project_id", "=", projectIdParsed)
		.orderBy("phenomenon.phenomenon_name")
		.distinct()
		.select(["phenomenon.id", "phenomenon.phenomenon_name", "phenomenon.description"])
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
		return await db
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
			.leftJoin("annotation_data", "informant.id", "annotation_data.informant_id")
			.where("phenomenon.id", "=", phenomenonIdParsed)
			.select(({ fn, ref }) => [
				"place.place_name",
				"place.plz",
				"place.lat",
				"place.lon",
				fn.coalesce(
					fn.jsonAgg(
						jsonBuildObject({
							age: ref("age_group.age_group_name"),
							gender: ref("informant.gender"),
							informant_id: ref("informant.id"),
							answers: fn.coalesce(ref("annotations"), sql`'[]'`),
						}),
					),
				),
			])
			.groupBy(["place.plz", "place.lat", "place.lon", "place.place_name"])
			.execute();
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
		.leftJoin("annotation_data", "informant.id", "annotation_data.informant_id")
		.where("phenomenon.id", "=", phenomenonIdParsed)
		.where("project_tagset.project_id", "=", projectIdParsed)
		.select(({ fn, ref }) => [
			"place.place_name",
			"place.plz",
			"place.lat",
			"place.lon",
			fn.coalesce(
				fn.jsonAgg(
					jsonBuildObject({
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
