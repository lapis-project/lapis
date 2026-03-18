import { sql } from "kysely";
import { jsonBuildObject } from "kysely/helpers/postgres";

import { db } from "@/db/connect.ts";
import { jsonbBuildObject } from "@/lib/dbHelper.ts";
import type { Availablelang, Poststatus } from "@/types/db.ts";

import type { PagedArticlesResult } from "../types/apiTypes.ts";

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
	sort: string,
	lang?: Availablelang,
) {
	let orderByClause;

	if (searchTerm === "" && postType === "" && sort === "type") {
		orderByClause = sql`
      CASE
        WHEN post_type.post_type_name = 'short_description' THEN 2
        ELSE 1
      END,
      post.published_at DESC,
      post.created_at DESC
    `;
	} else if (sort === "variable") {
		orderByClause = sql`phenomenon.phenomenon_name`;
	} else {
		// If expanded should use else if(sort === "published_date")
		orderByClause = sql`post.published_at DESC`;
	}
	const query = db.with("post_query", (query) => {
		return query
			.selectFrom("post")
			.innerJoin("project_post", "post.id", "project_post.post_id")
			.leftJoin("user_post", "post.id", "user_post.post_id")
			.leftJoin("user_account", (join) => join.onRef("user_post.user_id", "=", "user_account.id"))
			.leftJoin("phenomenon_post", "post.id", "phenomenon_post.post_id")
			.leftJoin("phenomenon", "phenomenon.id", "phenomenon_post.phenomenon_id")
			.innerJoin("post_type", "post.post_type_id", "post_type.id")
			.where((eb) => {
				const conditions = [];
				conditions.push(eb("post_type.post_type_name", "<>", "project_description"));
				conditions.push(eb("project_post.project_id", "=", projectId));
				conditions.push(eb("post.title", "~*", searchTerm));
				conditions.push(eb("post_type.post_type_name", "~*", postType));
				conditions.push(eb("post.post_status", "=", postStatus));
				if (lang) {
					conditions.push(eb("post.lang", "=", lang));
				}
				return eb.and(conditions);
			})
			.select(({ eb }) => [
				sql<number>`ROW_NUMBER() OVER (ORDER BY ${orderByClause})`.as("rn"),
				eb.ref("post.id").as("post_id"),
				eb.ref("post.title").as("title"),
				eb.ref("post.alias").as("alias"),
				eb.ref("post.abstract").as("abstract"),
				eb.ref("post.cover").as("cover"),
				eb.ref("post.cover_alt").as("cover_alt"),
				eb.ref("post_type.post_type_name").as("type_name"),
				eb.ref("post.creator_id").as("creator_id"),
				eb.ref("post.created_at").as("created_at"),
				eb.ref("post.published_at").as("published_at"),
				eb.fn
					.jsonAgg(
						jsonBuildObject({
							firstname: eb.cast<string>(eb.ref("user_account.firstname"), "text"),
							lastname: eb.cast<string>(eb.ref("user_account.lastname"), "text"),
						}),
					)
					.as("authors"),
			])
			.groupBy(["post.id", "post_type.post_type_name", "phenomenon.phenomenon_name"]);
	});

	const dbQuery = query.selectFrom("post_query").select(({ eb, fn }) => {
		const agg = fn.jsonAgg(
			jsonBuildObject({
				post_id: eb.cast<number>(eb.ref("post_query.post_id"), "integer"),
				title: eb.cast<string>(eb.ref("post_query.title"), "text"),
				alias: eb.cast<string>(eb.ref("post_query.alias"), "text"),
				abstract: eb.cast<string>(eb.ref("post_query.abstract"), "text"),
				post_type: eb.cast<string>(eb.ref("post_query.type_name"), "text"),
				authors: eb.ref("post_query.authors"),
				cover: eb.cast<string>(eb.ref("post_query.cover"), "text"),
				cover_alt: eb.cast<string>(eb.ref("post_query.cover_alt"), "text"),
				published_at: eb.cast<string>(eb.ref("post_query.published_at"), "text"),
			}),
		);
		return [
			agg
				.filterWhere("rn", ">", offset)
				.filterWhere("rn", "<=", pageSize + offset)
				.as("articles"),
			eb.fn.countAll().as("total"),
		];
	});

	// Workaround since execute() causes problems with the type inference in the frontend
	// Should be checked after a bit of time => Maybe this issue will be resolved
	return (await dbQuery.execute()) as Array<PagedArticlesResult>;
}
