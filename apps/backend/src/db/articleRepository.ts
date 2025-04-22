import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import { db } from "@/db/connect";
import { jsonbBuildObject } from "@/lib/dbHelper";
import type { Availablelang, Poststatus } from "@/types/db";

export async function getArticleByAlias(alias: string) {
	const query = db
		.with("authors", (query) =>
			query
				.selectFrom("user_post")
				.innerJoin("user_account", "user_post.user_id", "user_account.id")
				.innerJoin("post", "user_post.post_id", "post.id")
				.where("post.alias", "=", alias)
				.where("user_post.user_id", "is not", null)
				.select(["user_account.firstname", "user_account.lastname", "user_post.post_id"]),
		)
		.with("bibliography_query", (query) =>
			query
				.selectFrom("bibliography_post")
				.innerJoin("bibliography", "bibliography_post.bibliography_id", "bibliography.id")
				.innerJoin("post", "bibliography_post.post_id", "post.id")
				.where("post.alias", "=", alias)
				.select(["bibliography.name_bibliography", "bibliography_post.post_id"]),
		)
		.with("phenomenon_query", (query) =>
			query
				.selectFrom("phenomenon_post")
				.innerJoin("phenomenon", "phenomenon_post.phenomenon_id", "phenomenon.id")
				.innerJoin("post", "phenomenon_post.post_id", "post.id")
				.where("post.alias", "=", alias)
				.select(["phenomenon.id", "phenomenon.phenomenon_name", "phenomenon_post.post_id"]),
		)
		.selectFrom("post")
		.innerJoin("post_type", "post.post_type_id", "post_type.id")
		.innerJoin("user_account", "user_account.id", "post.creator_id")
		.leftJoin("bibliography_query", "bibliography_query.post_id", "post.id")
		.leftJoin("authors", "authors.post_id", "post.id")
		.leftJoin("phenomenon_query", "phenomenon_query.post_id", "post.id")
		.where("post.alias", "=", alias)
		.select(({ eb }) => [
			"post.id as post_id",
			"post.title",
			"post.alias",
			"post.cover",
			"post.cover_alt",
			"post.abstract",
			"post.content",
			"post.lang",
			"post.published_at",
			"post.updated_at",
			"post.created_at",
			"post.citation",
			"user_account.firstname as creator_firstname",
			"user_account.lastname as creator_lastname",
			"post_type.post_type_name",
			eb.fn
				.coalesce(
					eb.fn
						.jsonAgg(
							jsonBuildObject({
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
								firstname: eb.ref("authors.firstname"),
								lastname: eb.ref("authors.lastname"),
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

export async function getAllArticlesByProject(
	projectId: number,
	pageSize: number,
	offset: number,
	searchTerm: string,
	postType: string,
	postStatus: Poststatus,
	lang?: Availablelang,
) {
	const query = db
		.with("post_query", (query) => {
			let baseQuery = query
				.selectFrom("post")
				.innerJoin("project_post", "post.id", "project_post.post_id")
				.leftJoin("user_post", "post.id", "user_post.post_id")
				.leftJoin("user_account", (join) => join.onRef("user_post.user_id", "=", "user_account.id"))
				.innerJoin("post_type", "post.post_type_id", "post_type.id")
				.where("project_post.project_id", "=", projectId)
				.where("post.title", "~*", searchTerm)
				.where("post_type.post_type_name", "~*", postType)
				.where("post.post_status", "=", postStatus);
			if (lang) {
				baseQuery = baseQuery.where("post.lang", "=", lang);
			}
			if (searchTerm === "" && postType === "") {
				baseQuery = baseQuery.orderBy(sql`CASE
					WHEN post_type.post_type_name = 'project_description' THEN 1
					WHEN post_type.post_type_name = 'short_description' THEN 3
					ELSE 2
				END,
				post.created_at,
				post.published_at
				`);
			}

			return baseQuery
				.select(({ eb }) => [
					sql<number>`ROW_NUMBER() OVER (order by post.id) as rn`,
					eb.ref("post.id").as("post_id"),
					eb.ref("post.title").as("title"),
					eb.ref("post.alias").as("alias"),
					eb.ref("post.abstract").as("abstract"),
					eb.ref("post.cover").as("cover"),
					eb.ref("post.cover_alt").as("cover_alt"),
					eb.ref("post_type.post_type_name").as("post_type"),
					eb.ref("post.creator_id").as("creator_id"),
					eb.ref("post.published_at").as("published_at"),
					eb.fn
						.coalesce(
							eb.fn
								.jsonAgg(
									jsonBuildObject({
										firstname: eb.cast<string>(eb.ref("user_account.firstname"), "text"),
										lastname: eb.cast<string>(eb.ref("user_account.lastname"), "text"),
									}),
								)
								.filterWhere("user_post.post_id", "is not", null)
								.filterWhere("post.creator_id", "is not", null),
							sql`'[]'`,
						)
						.as("authors"),
				])
				.groupBy(["post.id", "post_type.post_type_name"]);
		})
		.selectFrom("post_query")
		//.select(({ eb, fn }) => [fn.jsonAgg(eb.ref("post_query")).as("articles")])
		.select(({ eb, fn }) => [
			fn
				.jsonAgg(
					jsonBuildObject({
						post_id: eb.cast<number>(eb.ref("post_query.post_id"), "integer"),
						title: eb.cast<string>(eb.ref("post_query.title"), "text"),
						alias: eb.cast<string>(eb.ref("post_query.alias"), "text"),
						abstract: eb.cast<string>(eb.ref("post_query.abstract"), "text"),
						post_type: eb.cast<string>(eb.ref("post_query.post_type"), "text"),
						authors: eb.ref("post_query.authors"),
						cover: eb.cast<string>(eb.ref("post_query.cover"), "text"),
						cover_alt: eb.cast<string>(eb.ref("post_query.cover_alt"), "text"),
						published_at: eb.cast<string>(eb.ref("post_query.published_at"), "text"),
					}),
				)
				.filterWhere("rn", ">", offset)
				.filterWhere("rn", "<=", pageSize + offset)
				.as("articles"),
			fn.countAll().as("total"),
		]);
	return await query.execute();
}
