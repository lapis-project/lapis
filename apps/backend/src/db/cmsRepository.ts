import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import { db } from "@/db/connect";
import { jsonbBuildObject } from "@/lib/dbHelper";
import type { Article } from "@/types/apiTypes";
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

	const selectAllSurveyConducted = db
		.selectFrom("survey_conducted")
		.select(({ eb }) => [
			eb.ref("survey_conducted.id").as("id"),
			eb.cast<string>(eb.ref("survey_conducted.instance_id"), "text").as("name"),
			eb.val("survey").as("category"),
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
						sql<string>` '$' `,
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
		return await selectAllPhaen
			.unionAll(selectAllKat)
			.unionAll(selectAllEditors)
			.unionAll(selectAllSurveyConducted)
			.execute();
	}
	return await selectAllPhaen
		.unionAll(selectAllKat)
		.unionAll(selectAllEditors)
		.unionAll(selectAllSurveyConducted)
		.execute();
}

export async function getArticleById(id: number) {
	const query = db
		.with("authors", (query) =>
			query
				.selectFrom("user_post")
				.where("post_id", "=", id)
				.where("user_post.user_id", "is not", null)
				.innerJoin("user_account", "user_post.user_id", "user_account.id")
				.select([
					"user_account.id",
					"user_account.firstname",
					"user_account.lastname",
					"user_account.username",
					"user_account.email",
					"user_post.post_id",
				]),
		)
		.with("bibliography_query", (query) =>
			query
				.selectFrom("bibliography_post")
				.innerJoin("bibliography", "bibliography_post.bibliography_id", "bibliography.id")
				.where("bibliography_post.post_id", "=", id)
				.select(["bibliography.name_bibliography", "bibliography_post.post_id"]),
		)
		.with("phenomenon_query", (query) =>
			query
				.selectFrom("phenomenon_post")
				.innerJoin("phenomenon", "phenomenon_post.phenomenon_id", "phenomenon.id")
				.where("phenomenon_post.post_id", "=", id)
				.select(["phenomenon.id", "phenomenon.phenomenon_name", "phenomenon_post.post_id"]),
		)
		.selectFrom("post")
		.innerJoin("user_account", "user_account.id", "post.creator_id")
		.leftJoin("post_type", "post.post_type_id", "post_type.id")
		.leftJoin("bibliography_query", "bibliography_query.post_id", "post.id")
		.leftJoin("authors", "authors.post_id", "post.id")
		.leftJoin("phenomenon_query", "phenomenon_query.post_id", "post.id")
		.where("post.id", "=", id)
		.select(({ eb }) => [
			"post.id as post_id",
			"post.title",
			"post.alias",
			"post.cover",
			"post.cover_alt",
			"post.abstract",
			"post.content",
			"post.post_status",
			"post.lang",
			"post.published_at",
			"post.updated_at",
			"post.created_at",
			"post.citation",
			"user_account.id as creator_id",
			"user_account.firstname as creator_firstname",
			"user_account.lastname as creator_lastname",
			"user_account.username as creator_username",
			"user_account.email as creator_email",
			"post_type.post_type_name",
			eb.fn
				.coalesce(
					eb.fn
						.jsonAgg(
							jsonbBuildObject({
								phenomenon_id: eb.ref("phenomenon_query.id"),
								name: eb.ref("phenomenon_query.phenomenon_name"),
							}),
						)
						.filterWhere("phenomenon_query.post_id", "is not", null),
					sql`'[]'`,
				)
				.as("phenomenon"),
			eb.fn
				.coalesce(
					eb.fn
						.jsonAgg(
							jsonbBuildObject({
								name: eb.ref("bibliography_query.name_bibliography"),
							}),
						)
						.filterWhere("bibliography_query.post_id", "is not", null),
					sql`'[]'`,
				)
				.as("bibliography"),
			eb.fn
				.coalesce(
					eb.fn
						.jsonAgg(
							jsonbBuildObject({
								id: eb.ref("authors.id"),
								firstname: eb.ref("authors.firstname"),
								lastname: eb.ref("authors.lastname"),
								username: eb.ref("authors.username"),
								email: eb.ref("authors.email"),
							}),
						)
						.filterWhere("authors.post_id", "is not", null),
					sql`'[]'`,
				)
				.as("authors"),
		])
		.groupBy(["post.id", "post_type.post_type_name", "user_account.id"]);
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
		.with("post_query", (query) => {
			let baseQuery = query
				.selectFrom("post")
				.innerJoin("project_post", "post.id", "project_post.post_id")
				.leftJoin("user_post", "post.id", "user_post.post_id")
				.leftJoin("user_account", (join) =>
					join
						.onRef("user_post.user_id", "=", "user_account.id")
						.onRef("post.creator_id", "=", "user_account.id"),
				)
				.leftJoin("post_type", "post.post_type_id", "post_type.id")
				.where("project_post.project_id", "=", projectId)
				.select(({ eb }) => [
					sql<number>`ROW_NUMBER() OVER (order by post.id) as rn`,
					eb.ref("post.id").as("post_id"),
					eb.ref("post.title").as("title"),
					eb.ref("post.alias").as("alias"),
					eb.ref("post.content").as("content"),
					eb.ref("post.abstract").as("abstract"),
					eb.ref("post.post_status").as("status"),
					eb.ref("post_type.post_type_name").as("post_type"),
					eb.ref("post.creator_id").as("creator_id"),
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
				.groupBy(["post.id", "post_type.post_type_name"]);
			if (searchTerm !== "" || searchTerm.length > 0) {
				baseQuery = baseQuery.where("post.title", "~*", searchTerm);
			}
			if (postType !== "" || postType.length > 0) {
				baseQuery = baseQuery.where("post_type.post_type_name", "~*", postType);
			}
			return baseQuery;
		})
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

export async function createNewPost(creator_id: number) {
	return await db
		.insertInto("post")
		.columns(["creator_id"])
		.values({ creator_id })
		.returning(["id"])
		.executeTakeFirstOrThrow();
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
	cover_alt: string | undefined,
	abstract: string | undefined,
	content: string | undefined,
	post_type_id: number | undefined,
	citation: string | undefined,
	post_status: Poststatus,
	lang: Availablelang,
	creator_id: number,
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
			"citation",
			"creator_id",
			"cover_alt",
		])
		.values({
			title,
			alias,
			cover,
			abstract,
			content,
			post_type_id,
			post_status,
			lang,
			citation,
			creator_id,
			cover_alt,
		})
		.returning(["id"])
		.executeTakeFirst();
}

export async function linkArticleToPhenomenon(postId: number, phenomenonId: Array<number>) {
	return await db
		.insertInto("phenomenon_post")
		.columns(["post_id", "phenomenon_id"])
		.values(
			phenomenonId.map((phen) => ({
				post_id: postId,
				phenomenon_id: phen,
			})),
		)
		.execute();
}

export async function deleteLinkedPhenomenonFromArticleByArticleId(articleId: number) {
	return await db.deleteFrom("phenomenon_post").where("post_id", "=", articleId).execute();
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

export async function deleteAuthorsFromArticleByArticleId(articleId: number) {
	return await db.deleteFrom("user_post").where("post_id", "=", articleId).execute();
}

export async function deleteBibliographyFromArticleByArticleId(articleId: number) {
	return await db.deleteFrom("bibliography_post").where("post_id", "=", articleId).execute();
}

export async function updateArticleCover(url: string, articleId: number) {
	return await db.updateTable("post").set({ cover: url }).where("id", "=", articleId).execute();
}

export async function getCoverById(articleId: number) {
	return await db.selectFrom("post").select("cover").where("id", "=", articleId).executeTakeFirst();
}

export async function updateArticleById(articleId: number, articleBody: Article) {
	return await db
		.updateTable("post")
		.set({
			title: articleBody.title,
			alias: articleBody.alias,
			cover: articleBody.cover,
			cover_alt: articleBody.cover_alt,
			abstract: articleBody.abstract,
			content: articleBody.content,
			post_type_id: articleBody.post_type_id,
			post_status: articleBody.post_status,
			lang: articleBody.lang,
			published_at: articleBody.publishedAt,
			updated_at: articleBody.updatedAt,
			citation: articleBody.citation,
		})
		.where("id", "=", articleId)
		.executeTakeFirst();
}
