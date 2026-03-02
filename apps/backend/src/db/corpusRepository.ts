import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import { db } from "@/db/connect.ts";

export async function getAllTranscripts(project_id: number) {
	return await db
		.selectFrom("project")
		.innerJoin("project_survey", "project_survey.project_id", "project.id")
		.innerJoin("survey", "survey.id", "project_survey.survey_id")
		.innerJoin("survey_type", "survey_type.id", "survey.survey_type_id")
		.innerJoin("survey_conducted", "survey_conducted.survey_id", "survey.id")
		.innerJoin("informant", "informant.survey_id", "survey_conducted.id")
		.innerJoin("age_group", "age_group.id", "informant.age_group_id")
		.innerJoin(
			"place_survey_conducted",
			"place_survey_conducted.survey_conducted_id",
			"survey_conducted.id",
		)
		.innerJoin("place", "place.id", "place_survey_conducted.place_id")
		.where("project.id", "=", project_id)
		.select(({ eb, fn }) => [
			eb.ref("project.project_name").as("project_name"),
			eb.ref("survey.survey_name").as("survey_name"),
			eb.ref("survey.id").as("survey_type_id"),
			eb.ref("survey_type.survey_type_name").as("survey_type_name"),
			eb.ref("survey_conducted.conducted_on").as("conducted_on"),
			eb.ref("survey_conducted.instance_id").as("transcript_id"),
			eb.ref("place.id").as("ort_id"),
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
						}),
					),
					sql`'[]'`,
				)
				.as("informants"),
		])
		.groupBy([
			"project.project_name",
			"survey.survey_name",
			"survey.id",
			"survey_type.id",
			"survey_type.survey_type_name",
			"survey_conducted.conducted_on",
			"survey_conducted.instance_id",
			"place.id",
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
		.innerJoin("informant", "informant.survey_id", "survey_conducted.id")
		.innerJoin("age_group", "age_group.id", "informant.age_group_id")
		.where("survey_conducted.instance_id", "=", transcript_id)
		.select(({ eb, fn }) => [
			"survey_conducted.conducted_on",
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

export type TranscriptMetadata = Awaited<ReturnType<typeof transcriptDetailView>>;
