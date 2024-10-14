import { db } from "@/db/connect";

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

// export async function get
