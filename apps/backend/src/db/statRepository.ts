import { sql } from "kysely";

import { jsonbBuildObject } from "@/lib/dbHelper";

import { db } from "./connect";

export async function getAllInfByGender() {
	return await db
		.selectFrom("informant")
		.select(({ eb }) => ["gender", eb.fn.count("gender").as("gendercount")])
		.groupBy("gender")
		.execute();
}

export async function getAllLocations() {
	return await db
		.selectFrom("place")
		.select(({ eb }) => [eb.fn.countAll().as("total")])
		.execute();
}

export async function getAllPhenCount() {
	return await db
		.selectFrom("phenomenon")
		.select(({ eb }) => [eb.fn.countAll().as("total")])
		.execute();
}

export async function getAgeBuckets(project_id: number, bucket_border: Array<number>) {
	const ageGroupQuery = db
		.selectFrom("informant")
		.innerJoin("age_group", "informant.age_group_id", "age_group.id")
		.innerJoin("survey_conducted", "informant.survey_id", "survey_conducted.id")
		.innerJoin("survey", "survey_conducted.survey_id", "survey.id")
		.innerJoin("project_survey", "survey.id", "project_survey.survey_id")
		.where("project_survey.project_id", "=", project_id)
		.select(({ eb }) => {
			const bucket_cases = [];
			let lower_age_limit = 0;
			for (const curr of bucket_border) {
				bucket_cases.push(
					eb.fn
						.sum(
							eb
								.case()
								.when(
									eb.and([
										eb("age_group.lower_limit", ">=", lower_age_limit),
										eb("age_group.upper_limit", "<", curr),
									]),
								)
								.then(1)
								.else(0)
								.end(),
						)
						.as(`bucket_${String(lower_age_limit)}_${String(curr)}`),
				);
				lower_age_limit = curr;
			}

			return bucket_cases;
		});

	return await ageGroupQuery.execute();
}

export async function getAllStatData(project_id: number) {
	const dbQuery = db
		.with("gender_count", (query) =>
			query
				.selectFrom("informant")
				.select(({ eb }) => [
					eb.ref("informant.gender").as("type"),
					eb.fn.count("gender").as("total"),
					eb.val("query").as("inftype"),
				])
				.groupBy("gender"),
		)
		.with("place_count", (query) =>
			query
				.selectFrom("place")
				.select(({ eb }) => [eb.val("query").as("type"), eb.fn.countAll().as("total")]),
		)
		.with("phen_count", (query) =>
			query
				.selectFrom("phenomenon")
				.select(({ eb }) => [eb.val("query").as("type"), eb.fn.countAll().as("total")]),
		)
		.with("inf_count", (query) =>
			query
				.selectFrom("informant")
				.select(({ eb }) => [eb.val("query").as("type"), eb.fn.countAll().as("total")]),
		)
		.with("survey_count", (query) =>
			query
				.selectFrom("survey_conducted")
				.innerJoin("survey", "survey_conducted.survey_id", "survey.id")
				.innerJoin("project_survey", "survey.id", "project_survey.survey_id")
				.select(({ eb }) => [eb.val("query").as("type"), eb.fn.countAll().as("total")])
				.where("project_survey.project_id", "=", project_id)
				.groupBy("survey_conducted.survey_id"),
		);

	const unionQuery = dbQuery
		.selectFrom("gender_count")
		// kysely is weird and will not allow me to use unionAll => Bit hacky solution but it works
		// Maybe can be changed if kysely is updated
		.innerJoin("place_count", "place_count.type", "gender_count.inftype")
		.innerJoin("phen_count", "phen_count.type", "gender_count.inftype")
		.innerJoin("inf_count", "inf_count.type", "gender_count.inftype")
		.innerJoin("survey_count", "survey_count.type", "gender_count.inftype")
		.select(({ eb }) => [
			eb.fn
				.jsonAgg(
					jsonbBuildObject({
						gender: eb.ref("gender_count.type"),
						total: eb.ref("gender_count.total"),
					}),
				)
				.filterWhere("gender_count.type", "is not", null)
				.as("gender"),
			eb.fn
				.coalesce(
					eb.fn
						.jsonAgg(
							jsonbBuildObject({
								total: eb.ref("place_count.total"),
							}),
						)
						.filterWhere("place_count.type", "is not", null),
					sql`'[]'`,
				)
				.as("place"),
			eb.fn
				.jsonAgg(
					jsonbBuildObject({
						total: eb.ref("phen_count.total"),
					}),
				)
				.filterWhere("phen_count.type", "is not", null)
				.as("phen"),
			eb.fn
				.jsonAgg(
					jsonbBuildObject({
						total: eb.ref("inf_count.total"),
					}),
				)
				.filterWhere("inf_count.type", "is not", null)
				.as("inf"),
			eb.fn
				.jsonAgg(
					jsonbBuildObject({
						total: eb.ref("survey_count.total"),
					}),
				)
				.filterWhere("gender_count.type", "is not", null)
				.as("survey"),
		]);
	return await unionQuery.execute();
}
