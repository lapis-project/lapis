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

export async function getAllStatData(project_id: number) {
	const dbQuery = db
		.with("gender_count", (query) =>
			query
				.selectFrom("informant")
				.select(({ eb }) => [eb.val("gender").as("type"), eb.fn.count("gender").as("total")])
				.groupBy("gender"),
		)
		.with("place_count", (query) =>
			query
				.selectFrom("place")
				.select(({ eb }) => [eb.val("place").as("type"), eb.fn.countAll().as("total")]),
		)
		.with("phen_count", (query) =>
			query
				.selectFrom("phenomenon")
				.select(({ eb }) => [eb.val("phen").as("type"), eb.fn.countAll().as("total")]),
		)
		.with("inf_count", (query) =>
			query
				.selectFrom("informant")
				.select(({ eb }) => [eb.val("inf").as("type"), eb.fn.countAll().as("total")]),
		)
		.with("survey_count", (query) =>
			query
				.selectFrom("survey_conducted")
				.innerJoin("survey", "survey_conducted.survey_id", "survey.id")
				.innerJoin("project_survey", "survey.id", "project_survey.survey_id")
				.select(({ eb }) => [eb.val("survey").as("type"), eb.fn.countAll().as("total")])
				.where("project_survey.project_id", "=", project_id)
				.groupBy("survey_id"),
		);
	const unionQuery = dbQuery
		.selectFrom("gender_count")
		.unionAll(dbQuery.selectFrom("place_count"))
		.unionAll(dbQuery.selectFrom("phen_count"))
		.unionAll(dbQuery.selectFrom("inf_count"))
		.unionAll(dbQuery.selectFrom("survey_count"));
	return await unionQuery.execute();
}
