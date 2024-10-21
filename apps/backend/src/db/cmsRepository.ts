import { sql } from "kysely";

import { db } from "@/db/connect";
import type { Availablelang, Poststatus } from "@/types/db";

// export async function get
export async function getAllUserPhenKat(project_id: string) {
	const selectAllPhaen = db
		.selectFrom("phenomenon")
		.select(({ eb }) => [
			eb.ref("phenomenon.id").as("id"),
			eb.ref("phenomenon.phenomenon_name").as("name"),
			eb.val("phenomenon").as("category"),
		]);
	const selectAllKat = db
		.selectFrom("post_type")
		.select(({ eb }) => [
			eb.ref("post_type.id").as("id"),
			eb.ref("post_type.post_type_name").as("name"),
			eb.val("category").as("category"),
		]);

	const selectAllEditors = db
		.selectFrom("user_account")
		.select(({ eb }) => [
			eb.ref("user_account.id").as("id"),
			eb
				.cast<string>( // Cast the expression into a TEXT so the TS Compiler also understands that this expressions results in a string
					eb.fn("concat", [
						// First and lastname could also be null => use coalesce to replace null with an empty string
						eb.fn.coalesce("user_account.firstname", sql<string>`''`),
						eb.fn.coalesce(eb.ref("user_account.lastname"), sql<string>`''`),
					]),
					"text",
				)
				.as("name"),
			//eb.fn.coalesce(eb.ref("user_account.firstname"), "no name"),
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

export async function getPostTypeIdsByName(name: string) {
	return await db
		.selectFrom("post_type")
		.where("post_type_name", "=", name)
		.select(["id"])
		.executeTakeFirst();
}

export async function insertNewArticle(
	title: string,
	alias: string,
	cover: string | undefined,
	abstract: string | undefined,
	content: string | undefined,
	post_type_id: number | undefined,
	post_status: Poststatus,
	lang: Availablelang,
) {
	return await db
		.insertInto("post")
		.columns([
			"title",
			"alias",
			"cover",
			"abstract",
			"content",
			"post_type_id",
			"post_status",
			"lang",
		])
		.values({ title, alias, cover, abstract, content, post_type_id, post_status, lang })
		.returning(["id"])
		.executeTakeFirst();
}

export async function linkAuthorsToPost(postId: number, authorIds: Array<number>) {
	const insertAuthors = db
		.insertInto("user_post")
		.columns(["post_id", "user_id"])
		.values(
			authorIds.map((authorId) => ({
				post_id: postId,
				user_id: authorId,
			})),
		);
	return await insertAuthors.execute();
}

export async function checkBibliographyExists(bibliography: Array<string>) {
	return await db
		.selectFrom("bibliography")
		.where("name_bibliography", "in", bibliography)
		.select(["id"])
		.execute();
}

export async function insertNewBibliography(name: Array<string>) {
	return await db
		.insertInto("bibliography")
		.columns(["name_bibliography"])
		.values(name)
		.returning(["id"])
		.execute();
}

export async function insertNewBibliographyPost(bibIds: Array<number>, postid: number) {
	return await db
		.insertInto("bibliography_post")
		.columns(["post_id", "bibliography_id"])
		.values(
			bibIds.map((el) => ({
				post_id: postid,
				bibliography_id: el,
			})),
		)
		.execute();
}
