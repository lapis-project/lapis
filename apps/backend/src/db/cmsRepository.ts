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
export async function getAllUserPhenKat(project_id: string) {
	const selectAllPhaen = db
		.selectFrom("phenomenon")
		.select(({ eb }) => [
			eb.val("phenomenon.id").as("id"),
			eb.val("phenomenon.phenomenon_name").as("name"),
			eb.val("phenomenon").as("category"),
		]);
	const selectAllKat = db
		.selectFrom("post_type")
		.select(({ eb }) => [
			eb.val("post_type.id").as("id"),
			eb.val("post_type.name").as("name"),
			eb.val("category").as("category"),
		]);

	const selectAllEditors = db
		.selectFrom("user_account")
		.select(({ eb }) => [
			eb.val("user_account.id").as("id"),
			eb.val("user_account.firstname || user_account.lastname").as("name"),
			eb.val("user").as("category"),
		])
		.innerJoin("user_has_role", "user_account.id", "user_has_role.user_id")
		.innerJoin("user_roles", "user_has_role.role_id", "user_roles.id")
		.where("user_roles.role_name", "=", "editor");
	const projectIdParsed = parseInt(project_id);
	if (Number.isNaN(projectIdParsed) || projectIdParsed < 0) {
		return await selectAllPhaen.unionAll(selectAllKat).unionAll(selectAllEditors).execute();
	}
	return await selectAllPhaen.unionAll(selectAllKat).unionAll(selectAllEditors).execute();
}
