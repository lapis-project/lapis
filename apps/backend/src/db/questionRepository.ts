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
	const phenomenonIdParsed = parseInt(phenomenonId);
	if (Number.isNaN(phenomenonIdParsed) || phenomenonIdParsed < 0) {
		return [];
	}
	const request = db
		.selectFrom("phenomenon")
		.innerJoin("phenomenon_tagset", "phenomenon.id", "phenomenon_tagset.phenomenon_id")
		.innerJoin("tagset", "phenomenon_tagset.tagset_id", "tagset.id")
		.innerJoin("annotation_tagset", "tagset.id", "annotation_tagset.tagset_id")
		.innerJoin("annotation", "annotation_tagset.annotation_id", "annotation.id")
		.innerJoin("annotation_response", "annotation.id", "annotation_response.annotation_id")
		.innerJoin("response", "annotation_response.response_id", "response.id")
		.innerJoin("variety", "response.variety_id", "variety.id")
		.innerJoin("informant", "response.informant_id", "informant.id")
		.innerJoin("age_group", "informant.age_group_id", "age_group.id")
		.innerJoin("informant_lives_in_place", "informant.id", "informant_lives_in_place.informant_id")
		.innerJoin("place", "informant_lives_in_place.place_id", "place.id")
		.where("phenomenon.id", "=", phenomenonIdParsed)
		.select([
			"phenomenon.id",
			"phenomenon.phenomenon_name",
			"annotation.annotation_name",
			"response.response_text",
			"informant.gender",
			"age_group.age_group_name",
			"place.place_name",
			"place.position",
			"place.plz",
			"variety.variety_name",
		]);
	if (Number.isNaN(projectIdParsed) || projectIdParsed < 0) {
		return await request.execute();
	}
	return await request
		.innerJoin("project_tagset", "tagset.id", "project_tagset.tagset_id")
		.where("project_tagset.project_id", "=", projectIdParsed)
		.execute();
}
