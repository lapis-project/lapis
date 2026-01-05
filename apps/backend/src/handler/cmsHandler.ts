/* eslint-disable @typescript-eslint/no-unused-vars */
import { log } from "@acdh-oeaw/lib";
import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { array, minLength, number, object, optional, pipe, string } from "valibot";

import { getAllUserRoles, getAllUsers } from "@/db/userRepository.ts";
import { restrictedRoute } from "@/lib/authHelper.ts";
import type { AppEnv } from "@/lib/context.ts";
import {
	insertBibliography,
	instanceOfAvailablelang,
	instanceOfPoststatus,
} from "@/lib/RepoHelper.ts";
import { generateSignedImageUrl } from "@/service/imageService.ts";
import { deleteFromS3 } from "@/service/storageService.ts";
import type { Article } from "@/types/apiTypes.ts";

import {
	createNewPost,
	deleteArticleById,
	deleteAuthorsFromArticleByArticleId,
	deleteBibliographyFromArticleByArticleId,
	deleteLinkedPhenomenonFromArticleByArticleId,
	getAllArticlesByProjectId,
	getAllUserPhenKat,
	getArticleById,
	getCoverById,
	getPostTypeIdsByName,
	linkArticleToPhenomenon,
	linkAuthorsToPost,
	linkProjectToPost,
	updateArticleById,
} from "./../db/cmsRepository.ts";

const createNewArticleSchema = object({
	title: pipe(string(), minLength(5)),
	alias: pipe(string(), minLength(5)),
	cover: optional(string()), // Wie sind die Bilder abgespeichert? Wo passiert der Optimierungsschritt? Was wird zurückgeliefert?
	abstract: optional(string()),
	content: optional(string()), // Wie wird der Content in verschiedenen Sprachen gespeichert? Innerhalb eines Tupels oder mehrere?
	category: optional(string()), // Does it allow as an enum? commentary | method | project
	authors: optional(array(number())),
	bibliography: optional(array(string())),
	status: string(), // Does it allow as an enum? DRAFT | PUBLISHED | ARCHIVED
	lang: string(), // Does it allow as an enum? de | en
	phenomenonId: optional(number()), // mn relation to phenomenon
	citation: optional(string()), // Gibt es eine direkte Verbindung oder geht diese Phänomen -> Bibliography
	projectId: optional(array(number())), // mn relation to project
	cover_alt: optional(string()),
	survey_conducted: optional(array(string())),
});

const searchArticleSchema = object({
	searchTerm: optional(string()),
	page: optional(number()),
	offset: optional(number()),
	pageSize: optional(number()),
	category: optional(string()), // Does it allow as an enum? ARTICLE | BLOG | NEWS
});

const cms = new Hono<AppEnv>();

cms.use("*", restrictedRoute);

cms
	/**
	 * Delete the article with the provided id as queryparam
	 * Returns code 200 when the article has been processed
	 */
	.delete("/articles/:id", async (c) => {
		const articleId = c.req.param("id");
		// Check if the id is a number
		if (!articleId || Number.isNaN(Number(articleId))) {
			return c.json("Provided id is not a number", 400);
		}

		const articleCover = await getCoverById(Number(articleId));
		if (articleCover?.cover) {
			try {
				await deleteFromS3(articleCover.cover);
			} catch (error) {
				console.error("Error while deleting asset from S3:", error);
				log.warn(`Could not delete S3 asset with URI: ${articleCover.cover}`);
			}
		}

		// Delete the article
		await deleteArticleById(Number(articleId));
		return c.json(`Article with the ID ${articleId} has been deleted`, 200);
	})
	/**
	 * Edit the article with the provided id as queryparam
	 *
	 * @returns code 200 when the article has been processed and the relevant entry has been updated with the updated object
	 * @returns code 400 when the provided id is not a number
	 */
	.put("/articles/:id", vValidator("json", createNewArticleSchema), async (c) => {
		const articleId = c.req.param("id");
		const body = c.req.valid("json");
		// Check if articleId is valid
		if (!articleId || Number.isNaN(Number(articleId))) {
			return c.json("Provided id is not a number", 400);
		}

		let postTypeId: number | null = null;
		const category = body.category;
		// Check the post_type if its provided
		if (category) {
			postTypeId = (await getPostTypeIdsByName(category))?.id ?? null;
			if (!postTypeId) {
				return c.json("No post type found", 400);
			}
		}

		// Check if the provided status is an element from the Poststatus enum
		if (!instanceOfPoststatus(body.status)) {
			return c.json("Invalid status provided", 400);
		}

		// Same for Lang
		if (!instanceOfAvailablelang(body.lang)) {
			return c.json("Invalid language provided", 400);
		}

		const creator = c.get("user");
		if (!creator) {
			return c.json("Error while fetching data", 500);
		}

		// get the instance of the article to check the date
		const articleInstance = await getArticleById(Number(articleId));

		// Has the article been found?
		if (!articleInstance) {
			return c.json("Article not found", 404);
		}

		let publishedDate = articleInstance.published_at;

		if (articleInstance.post_status !== "Published" && body.status === "Published") {
			publishedDate = new Date();
		}

		const updatedArticle: Article = {
			title: body.title,
			alias: body.alias,
			cover_alt: body.cover_alt ?? null,
			creator_id: creator.id, // FIX: Removed Number(), it is already a number
			abstract: body.abstract ?? null,
			content: body.content ?? null,
			post_type_id: postTypeId,
			post_status: body.status,
			lang: body.lang,
			publishedAt: publishedDate,
			updatedAt: new Date(),
			bibliography: body.bibliography ?? [],
			citation: body.citation ?? null,
		};
		const articleIdParsed = Number(articleId);
		const result = await updateArticleById(articleIdParsed, updatedArticle);
		// Check if the the authors have been updated and need to be updated
		if (body.authors && body.authors.length > 0) {
			await deleteAuthorsFromArticleByArticleId(articleIdParsed);
			try {
				await linkAuthorsToPost(articleIdParsed, body.authors);
			} catch (e) {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				return c.json(`Error while updating author, ${e}`, 500);
			}
		}

		// Remove the previous linked entries from the table
		await deleteBibliographyFromArticleByArticleId(articleIdParsed);
		// Check if the bibliography has been updated and if data needs to be inserted
		if (body.bibliography && body.bibliography.length > 0) {
			await insertBibliography(body.bibliography, articleIdParsed);
		}

		// Check if a phenomenon is provided and insert it if it is
		if (body.phenomenonId) {
			try {
				// Remove the previous entries from the table
				await deleteLinkedPhenomenonFromArticleByArticleId(articleIdParsed);
				// Link the phenomenon to the article
				await linkArticleToPhenomenon(articleIdParsed, [body.phenomenonId]);
			} catch (e) {
				return c.json(`Error while linking phenomenon, ${String(e)}`, 500);
			}
		}

		return c.json({ updatedRows: Number(result.numUpdatedRows) }, 201);
	})

	/**
	 * Get all articles (posts) from a project, Does not return articles where no project has been assigned
	 * @returns Object with all articleIds from the provided project id with the users who wrote them,
	 * Comes in a paged format
	 */
	.get("/articles/all/:project", async (c) => {
		const projectId = c.req.param("project");

		const { page, offset, pageSize, category, searchTerm } = c.req.query();

		// Check if the id is a number
		if (!projectId || Number.isNaN(Number(projectId))) {
			return c.json("Provided id is not a number", 400);
		}
		const pageSizeParsed = Number(pageSize ?? 20);
		const pageNumParsed = Number(page ?? 1);
		const queryOffset = (pageNumParsed - 1) * pageSizeParsed + Number(offset ?? 0);
		const allArticles = await getAllArticlesByProjectId(
			Number(projectId),
			pageSizeParsed,
			queryOffset,
			searchTerm ?? "",
			category ?? "",
		);
		const articles = allArticles[0]?.articles ?? [];
		const totalCount = Number(allArticles[0]?.total);

		// 2. Use the URL API for robust pagination link generation. Avoids brittle string replacement.
		const requestUrl = new URL(c.req.url);

		// Base the 'next' and 'prev' URLs on the current one to preserve other query params.
		const nextUrl = new URL(requestUrl);
		nextUrl.searchParams.set("page", String(pageNumParsed + 1));

		const prevUrl = new URL(requestUrl);
		prevUrl.searchParams.set("page", String(pageNumParsed - 1));

		// TODO: fix type inference
		return c.json(
			{
				prev: pageNumParsed > 1 ? prevUrl.href : null,
				next: totalCount > pageSizeParsed + queryOffset ? nextUrl.href : null,
				currentPage: requestUrl.href,
				totalResults: totalCount,
				articles: articles as Array<{
					post_id: number;
					title: string;
					alias: string;
					content: string;
					abstract: string;
					status: string | null;
					post_type: string;
					authors: Array<{
						user_id: number;
						username: string;
						email: string;
						firstname: string;
						lastname: string;
					}>;
				}>,
			},
			200,
		);
	})

	/*
	 * returns all fields of an article, Is identified by the id
	 */
	.get("/articles/:id", async (c) => {
		const providedId = c.req.param("id");

		if (!providedId) {
			return c.json("No id provided", 400);
		}
		// Check if the id is a number
		if (Number.isNaN(Number(providedId))) {
			return c.json("Provided id is not a number", 400);
		}

		let fetchedArticle = await getArticleById(Number(providedId));
		// TODO kkukelka: remove s3:// check once all images are migrated
		if (fetchedArticle?.cover?.startsWith("s3://")) {
			fetchedArticle = { ...fetchedArticle, cover: generateSignedImageUrl(fetchedArticle.cover) };
		}
		return c.json({ article: fetchedArticle }, 200);
	})
	/**
	 * Creates a new article with the provided information in the body
	 * Will also create the necessary relations to authors, bibliography and projects
	 * If a new bibliography entry is provided, which is not available in the bibliography table, it will be created and linked to the article
	 */
	.post("/articles/create", async (c) => {
		/*
    removed this code since this handler now only creates a new article entry in the database and
    returns the new id to the client
    // get the body
    const body = c.req.valid("json");

    // Check UserIds
    const userIds = body.authors;
    if (userIds && userIds.length >= 0) {
      const userList = await getUsersByList(userIds);

      if (userList.length !== userIds.length) {
        return c.json("Not all authors found", 400);
      }
    }
    // Check the post_type
    const category = body.category;
    if (!category) {
      return c.json("No category provided", 400);
    }
    const postTypeId = await getPostTypeIdsByName(category);

    if (!postTypeId) {
      return c.json("No post type found", 400);
    }

    // Check if the provided status is an element from the Poststatus enum
    if (!instanceOfPoststatus(body.status)) {
      return c.json("Invalid status provided", 400);
    }

    // Same for Lang
    if (!instanceOfAvailablelang(body.lang)) {
      return c.json("Invalid language provided", 400);
    }

    const creator = c.get("user");
    if (!creator) {
      return c.json("Error while fetching data", 500);
    }

    // Create the new article
    const articleId = await insertNewArticle(
      body.title,
      body.alias,
      body.cover,
      body.cover_alt,
      body.abstract,
      body.content,
      postTypeId.id,
      body.citation,
      body.status,
      body.lang,
      Number(creator.id),
    );

    if (!articleId) {
      return c.json("Error while creating article", 500);
    }
    if (userIds && userIds.length > 0) {
      // Link the authors to the article
      await linkAuthorsToPost(articleId.id, userIds);
    }

    // Check if bibliography is provided
    if (body.bibliography && body.bibliography.length > 0) {
      await insertBibliography(body.bibliography, articleId.id);
    }

    // Check if the project is provided and insert it if it is
    if (body.projectId && body.projectId.length > 0) {
      // Ask the DB if the article exists
      const existingProjects = await getProjectByIds(body.projectId);
      if (existingProjects.length !== body.projectId.length) {
        return c.json("Article not found", 404);
      }
      // Link the project to the article
      await linkProjectToPost(articleId.id, body.projectId);
    }

    // Check if a phenomenon is provided and insert it if it is
    if (body.phenomenonId) {
      try {
        // Link the phenomenon to the article
        await linkArticleToPhenomenon(articleId.id, [body.phenomenonId]);
      } catch (e) {
        return c.json(`Error while linking phenomenon, ${String(e)}`, 500);
      }
    }*/

		const creator = c.get("user");
		if (!creator) {
			return c.json("Error while fetching data", 500);
		}

		const articleId = await createNewPost(creator.id);

		await linkProjectToPost(articleId.id, [1]);

		return c.json(
			{
				articleId: articleId,
			},
			201,
		);
	})
	/**
	 * Provides all information about authors, categories and phenomenon based on the provided project id
	 * @returns Object with all authors, categories and phenomenon with a status code of 200 on success
	 * It contains the following fields:
	 * authors: Array of authors with the following fields: id, name, email
	 * categories: Array of categories with the following fields: id, name
	 * phenomenon: Array of phenomenon with the following fields: id, name
	 */
	.get("/articles/create/info", async (c) => {
		const information = await getAllUserPhenKat("1");
		const authors = information.filter((el) => el.category === "user");
		const categories = information.filter((el) => el.category === "category");
		const phenomenon = information.filter((el) => el.category === "phenomenon");
		const survey = information.filter((el) => el.category === "survey");
		const mappedAuthors = authors.map((a) => {
			const splitName = a.name?.split("$");
			return {
				id: a.id,
				value: a.id,
				firstName: splitName?.[0] ?? "",
				lastName: splitName?.[1] ?? "",
			};
		});

		const informationList = {
			authors: mappedAuthors,
			categories: categories,
			phenomenon: phenomenon,
			survey: survey,
		};
		return c.json(informationList, 200);
	})
	.get("/users/all", async (c) => {
		const users = await getAllUsers();
		const userRoles = await getAllUserRoles();
		return c.json(
			{
				users,
				userRoles,
			},
			200,
		);
	});

export default cms;
export type CmsRoute = typeof cms;
