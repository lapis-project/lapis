import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import { db } from "@/db/connect.ts";

export async function getAllTranscripts(
	project_id: number,
	filters?: {
		age_lower?: number;
		age_upper?: number;
		locations?: string;
		dialect_competence?: number;
		standard_competence?: number;
		gender?: string;
		comment_search?: string;
		comment_search_mode?: "simple" | "regex";
		transcript_name?: string;
		instance_id?: number;
	},
) {
	let query = db
		.selectFrom("project")
		.innerJoin("project_survey", "project_survey.project_id", "project.id")
		.innerJoin("survey", "survey.id", "project_survey.survey_id")
		.innerJoin("survey_type", "survey_type.id", "survey.survey_type_id")
		.innerJoin("survey_conducted", "survey_conducted.survey_id", "survey.id")
		.innerJoin(
			"informant_survey_conducted",
			"informant_survey_conducted.survey_conducted_id",
			"survey_conducted.id",
		)
		.innerJoin("informant", "informant.id", "informant_survey_conducted.informant_id")
		.innerJoin("age_group", "age_group.id", "informant.age_group_id")
		.innerJoin("informant_lives_in_place", "informant_lives_in_place.informant_id", "informant.id")
		.innerJoin("place", "place.id", "informant_lives_in_place.place_id")
		.where("project.id", "=", project_id);

	// Apply optional filters
	if (filters?.age_lower !== undefined) {
		query = query.where("age_group.lower_limit", ">=", filters.age_lower);
	}
	if (filters?.age_upper !== undefined) {
		query = query.where("age_group.upper_limit", "<=", filters.age_upper);
	}
	if (filters?.locations) {
		query = query.where("place.place_name", "ilike", `%${filters.locations}%`);
	}
	if (filters?.dialect_competence !== undefined) {
		query = query.where("informant.dialect_competence", "=", filters.dialect_competence);
	}
	if (filters?.standard_competence !== undefined) {
		query = query.where("informant.standard_competence", "=", filters.standard_competence);
	}
	if (filters?.gender) {
		query = query.where("informant.gender", "=", filters.gender);
	}
	if (filters?.comment_search) {
		const searchMode = filters.comment_search_mode ?? "simple";
		if (searchMode === "regex") {
			// Use PostgreSQL regex match operator (~)
			query = query.where("survey_conducted.comment", "~", filters.comment_search);
		} else {
			// Simple case-insensitive substring match
			query = query.where("survey_conducted.comment", "ilike", `%${filters.comment_search}%`);
		}
	}
	if (filters?.transcript_name) {
		query = query.where("survey_conducted.comment", "ilike", `%${filters?.transcript_name}%`);
	}

	if (filters?.instance_id) {
		query = query.where("survey_conducted.instance_id", "=", filters.instance_id);
	}

	return await query
		.select(({ eb, fn }) => [
			eb.ref("survey_conducted.comment").as("transcript_name"),
			eb.ref("survey_conducted.conducted_on").as("conducted_on"),
			eb.ref("survey_conducted.instance_id").as("instance_id"),
			eb.ref("survey.id").as("survey_id"),
			eb.ref("survey.survey_name").as("survey_name"),
			eb.ref("survey_type.id").as("survey_type_id"),
			eb.ref("survey_type.survey_type_name").as("survey_type_name"),
			eb.ref("place.id").as("place_id"),
			eb.ref("place.place_name").as("place_name"),
			eb.ref("place.lat").as("lat"),
			eb.ref("place.lon").as("lon"),
			eb.ref("place.plz").as("plz"),
			fn
				.coalesce(
					fn.jsonAgg(
						jsonBuildObject({
							gender: eb.ref("informant.gender"),
							sigle: eb.ref("informant.comment"),
							age: eb.ref("age_group.age_group_name"),
							dialect_competence: eb.ref("informant.dialect_competence"),
							standard_competence: eb.ref("informant.standard_competence"),
							misc: eb.ref("informant.misc"),
						}),
					),
					sql`'[]'`,
				)
				.as("informants"),
		])
		.groupBy([
			"survey_conducted.id",
			"survey_conducted.comment",
			"survey_conducted.conducted_on",
			"survey_conducted.instance_id",
			"survey.id",
			"survey.survey_name",
			"survey_type.id",
			"survey_type.survey_type_name",
			"place.id",
			"place.place_name",
			"place.lat",
			"place.lon",
			"place.plz",
		])
		.execute();
}

export async function transcriptDetailView(transcript_id: number) {
	return await db
		.selectFrom("survey_conducted")
		.innerJoin(
			"place_survey_conducted",
			"survey_conducted.id",
			"place_survey_conducted.survey_conducted_id",
		)
		.innerJoin("place", "place.id", "place_survey_conducted.place_id")
		.innerJoin("survey", "survey.id", "survey_conducted.survey_id")
		.innerJoin("survey_type", "survey_type.id", "survey.survey_type_id")
		.innerJoin(
			"informant_survey_conducted",
			"informant_survey_conducted.survey_conducted_id",
			"survey_conducted.id",
		)
		.innerJoin("informant", "informant.id", "informant_survey_conducted.informant_id")
		.innerJoin("age_group", "age_group.id", "informant.age_group_id")
		.where("survey_conducted.instance_id", "=", transcript_id)
		.select(({ eb, fn }) => [
			"survey_conducted.conducted_on",
			eb.ref("survey_conducted.comment").as("transcript_name"),
			eb.ref("survey_conducted.instance_id").as("transcript_id"),
			"place.place_name",
			"place.plz",
			"place.lat",
			"place.lon",
			"survey.survey_name",
			"survey_type.survey_type_name",
			fn
				.jsonAgg(
					jsonBuildObject({
						gender: eb.ref("informant.gender"),
						sigle: eb.ref("informant.comment"),
						age: eb.ref("age_group.age_group_name"),
					}),
				)
				.as("informants"),
		])
		.groupBy([
			"survey_conducted.instance_id",
			"survey_conducted.comment",
			"survey_conducted.conducted_on",
			"place.place_name",
			"place.lat",
			"place.lon",
			"place.plz",
			"survey.survey_name",
			"survey_type.survey_type_name",
		])
		.execute();
}

export async function getAllLocationsByProject(project_id: number) {
	return db
		.selectFrom("place")
		.innerJoin("place_survey_conducted", "place_survey_conducted.place_id", "place.id")
		.innerJoin(
			"survey_conducted",
			"survey_conducted.id",
			"place_survey_conducted.survey_conducted_id",
		)
		.innerJoin("survey", "survey.id", "survey_conducted.survey_id")
		.innerJoin("project_survey", "survey.id", "project_survey.survey_id")
		.innerJoin("project", "project.id", "project_survey.project_id")
		.select(["place.id", "place.lat", "place.lon", "place.place_name", "place.plz"])
		.where("project.id", "=", project_id)
		.distinct()
		.execute();
}

export async function getFilterInformation() {
	const selectAllSettings = db
		.selectFrom("survey_type")
		.innerJoin("survey", "survey.survey_type_id", "survey_type.id")
		.innerJoin("project_survey", "survey.id", "project_survey.survey_id")
		.innerJoin("project", "project.id", "project_survey.project_id")
		.distinct()
		.select(({ eb }) => [
			eb.ref("survey_type.id").as("id"),
			eb.ref("survey_type_name").as("name"),
			eb.val("setting").as("category"),
		])
		.where((eb) => eb.or([eb("project.id", "=", 2), eb("project.main_project_id", "=", 2)]));
	const selectAllProjects = db
		.selectFrom("project")
		.select(({ eb }) => [
			eb.ref("project.id").as("id"),
			eb.ref("project.project_name").as("name"),
			eb.val("project").as("category"),
		])
		.where((eb) => eb.or([eb("project.id", "=", 2), eb("project.main_project_id", "=", 2)]));

	return await selectAllSettings.unionAll(selectAllProjects).execute();
}
