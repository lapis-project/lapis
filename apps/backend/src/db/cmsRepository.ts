import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import { db } from "@/db/connect";
import { jsonbBuildObject } from "@/lib/dbHelper";
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

export async function getArticleById(id: number) {
	const query = db
		.selectFrom("post")
		.leftJoin("bibliography_post", "post.id", "bibliography_post.post_id")
		.leftJoin("bibliography", "bibliography_post.bibliography_id", "bibliography.id")
		.innerJoin("post_type", "post.post_type_id", "post_type.id")
		.leftJoin("user_post", "post.id", "user_post.post_id")
		.leftJoin("user_account", "user_post.user_id", "user_account.id")
		.where("post.id", "=", id)
		.select([
			"post.id as post_id",
			"post.title",
			"post.alias",
			"post.cover",
			"post.abstract",
			"post.content",
			"post.post_status",
			"post.lang",
			"post_type.post_type_name",
			"bibliography.name_bibliography",
			"user_account.id as user_id",
			"user_account.firstname",
			"user_account.lastname",
		]);
	return await query.executeTakeFirst();
}

export async function getAllArticlesByProjectId(
	projectId: number,
	pageSize: number,
	offset: number,
	searchTerm: string,
	postType: string,
) {
	const query = db
		.with("post_query", (query) =>
			query
				.selectFrom("post")
				.innerJoin("project_post", "post.id", "project_post.post_id")
				.leftJoin("user_post", "post.id", "user_post.post_id")
				.leftJoin("user_account", "user_post.user_id", "user_account.id")
				.innerJoin("post_type", "post.post_type_id", "post_type.id")
				.where("project_post.project_id", "=", projectId)
				.where("post.title", "~*", searchTerm)
				.where("post_type.post_type_name", "~*", postType)
				.select(({ eb }) => [
					sql<number>`ROW_NUMBER() OVER (order by post.id) as rn`,
					eb.ref("post.id").as("post_id"),
					eb.ref("post.title").as("title"),
					eb.ref("post.alias").as("alias"),
					eb.ref("post.content").as("content"),
					eb.ref("post.abstract").as("abstract"),
					eb.ref("post.post_status").as("status"),
					eb.ref("post_type.post_type_name").as("post_type"),
					eb.fn
						.jsonAgg(
							jsonbBuildObject({
								user_id: eb.ref("user_account.id"),
								username: eb.ref("user_account.username"),
								email: eb.ref("user_account.email"),
								firstname: eb.ref("user_account.firstname"),
								lastname: eb.ref("user_account.lastname"),
							}),
						)
						.as("authors"),
				])
				.groupBy(["post.id", "post_type.post_type_name"]),
		)
		.selectFrom("post_query")
		//.select(({ eb, fn }) => [fn.jsonAgg(eb.ref("post_query")).as("articles")])
		.select(({ eb, fn }) => [
			fn
				.jsonAgg(
					jsonBuildObject({
						post_id: eb.ref("post_query.post_id"),
						title: eb.ref("post_query.title"),
						alias: eb.ref("post_query.alias"),
						content: eb.ref("post_query.content"),
						abstract: eb.ref("post_query.abstract"),
						status: eb.ref("post_query.status"),
						post_type: eb.ref("post_query.post_type"),
						authors: eb.ref("authors"),
					}),
				)
				.filterWhere("rn", ">", offset)
				.filterWhere("rn", "<=", pageSize + offset)
				.as("articles"),
			fn.countAll().as("total"),
		]);
	return await query.execute();
	/* .select(({ eb, fn }) => [
			fn.jsonAgg(jsonbBuildObject({ abstract: eb.ref("post_query.abstract") })).as("articles"),
		])*/
}

export async function getProjectByIds(ids: Array<number>) {
	return await db
		.selectFrom("project")
		.where("project.id", "in", ids)
		.select(["project_name", "description"])
		.execute();
}

export async function linkProjectToPost(postId: number, projectId: Array<number>) {
	return await db
		.insertInto("project_post")
		.columns(["post_id", "project_id"])
		.values(
			projectId.map((proj) => ({
				post_id: postId,
				project_id: proj,
			})),
		)
		.execute();
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
		.select(["id", "name_bibliography"])
		.execute();
}

export async function insertNewBibliography(name: Array<string>) {
	return await db
		.insertInto("bibliography")
		.columns(["name_bibliography"])
		.values(name.map((el) => ({ name_bibliography: el })))
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

export async function deleteArticleById(articleId: number) {
	return await db.deleteFrom("post").where("id", "=", articleId).execute();
}
