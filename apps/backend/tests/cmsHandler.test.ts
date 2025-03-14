/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { afterEach } from "node:test";

import { hash } from "@node-rs/argon2";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { app } from "@/app";
import { argon2Config } from "@/config/config";
import { db } from "@/db/connect";

import { apiHeaders, loginUserAndReturnCookie, logoutUser } from "./testutils";
// import user from "@/handler/userHandler";

/*
TODO: Saving for later when kysely gets it next update => Use transactions to make the tests easier
Mock the db connection to use transactions
vi.mock("@/db/connect", async () => {
	const database = (await import("@/db/connect")).db;
	const transaction = await database.transaction().execute();
	return { db: transaction };
});
*/

describe("test endpoint /cms/articles/create/info", () => {
	// let honoClient;
	const loginHeaders = structuredClone(apiHeaders);
	beforeAll(async () => {
		/*
		const userIds = await db
		.insertInto("user_account")
			.columns(["email", "password", "firstname", "lastname"])
			.values([
				{
					email: "editor@oeaw.ac.at",
					password: await hash("editoreditor", argon2Config),
					firstname: "editor",
					lastname: "editor",
				},
				{
					email: "admin@oeaw.ac.at",
					password: await hash("adminadmin", argon2Config),
					firstname: "admin",
					lastname: "admin",
				},
			])
			.returning(["id"])
			.execute();
		if (userIds.length !== 2) {
			throw new Error("Could not create users");
		}

		// TS is weird
		const userIdAdmin = userIds[0] ? userIds[0].id : 0;
		const editorId = userIds[1] ? userIds[1].id : 0;
		await db
			.insertInto("user_has_role")
			.columns(["user_id", "role_id"])
			.values({ user_id: userIdAdmin, role_id: 2 })
			.execute();
		await db
			.insertInto("user_has_role")
			.columns(["user_id", "role_id"])
			.values({ user_id: editorId, role_id: 2 })
			.execute();
			*/
		// const honoClient = hc<GetAuthorInformationType>("");
		const sessionCookie = await loginUserAndReturnCookie("editor@oeaw.ac.at", "editoreditor");
		loginHeaders.Cookie = sessionCookie;
	});
	afterAll(async () => {
		await logoutUser(loginHeaders);
		//await db.deleteFrom("user_account").where("email", "=", "editor2@oeaw.ac.at").execute();
	});
	test("Should return status code 200", async () => {
		const response = await app.request("/cms/articles/create/info", { headers: loginHeaders });
		expect(response.status).toBe(200);
	});
	test("Should return object containing authors, categories and phenomenon", async () => {
		const response = await app.request("/cms/articles/create/info", { headers: loginHeaders });

		const body = await response.json();
		expect(body).toHaveProperty("authors");
		expect(body).toHaveProperty("categories");
		expect(body).toHaveProperty("phenomenon");
		expect(body).toHaveProperty("survey");
		expect(body.survey.length).toBe(3);
	});
});

describe("test endpoint GET /cms/articles/:id", () => {
	let articleId = 0;
	const loginHeaders = structuredClone(apiHeaders);
	beforeAll(async () => {
		const sessionCookie = await loginUserAndReturnCookie("admin@oeaw.ac.at", "adminadmin");
		loginHeaders.Cookie = sessionCookie;

		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({
				title: "Test Article",
				alias: "test-article",
				abstract: "test-abstract",
				cover: "test-cover",
				cover_alt: "test-cover-alt",
				content: "test-content",
				category: "commentary",
				status: "Draft",
				lang: "en",
				projectId: [1],
				authors: [14],
				phenomenonId: 2,
				citation: "test-citation",
			}),
			headers: loginHeaders,
		});
		console.error(response.statusText);
		expect(response.status).toBe(201);

		const body = await response.json();

		articleId = body.articleId.id;
	});

	afterAll(async () => {
		await db.deleteFrom("post").where("title", "=", "Test Article").execute();
		await logoutUser(loginHeaders);
	});

	test("Should return status code 201", async () => {
		const response = await app.request("/cms/articles/1", { headers: loginHeaders });
		expect(response.status).toBe(201);
	});

	test("Provide correct article id, should return the article with the provided id and status code 201", async () => {
		const response = await app.request(`/cms/articles/${String(articleId)}`, {
			headers: loginHeaders,
		});
		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("article");

		const articleBody = body.article;

		expect(articleBody.post_id).toBe(articleId);
		expect(articleBody.title).toBe("Test Article");
		expect(articleBody.alias).toBe("test-article");
		expect(articleBody.cover).toBe("test-cover");
		expect(articleBody.abstract).toBe("test-abstract");
		expect(articleBody.citation).toBe("test-citation");
		expect(articleBody.content).toBe("test-content");
		expect(articleBody.post_type_name).toBe("commentary");
		expect(articleBody.post_status).toBe("Draft");
		expect(articleBody.lang).toBe("en");
		expect(articleBody.published_at).toBeNull();
		expect(articleBody.updated_at).not.toBeNull();
		expect(articleBody.created_at).not.toBeNull();
		expect(articleBody.authors).not.toBeNull();
		expect(articleBody.authors?.[0].id).toBe(151);
		expect(articleBody.phenomenon).not.toBeNull();
		expect(articleBody.phenomenon?.[0].phenomenon_id).toBe(2);
		expect(articleBody.cover_alt).toBe("test-cover-alt");
	});
});

describe("test endpoint POST /cms/articles/create", () => {
	const existingBibliography = "TestBibliography2";
	const userIds: Array<number> = [];
	const loginHeaders = structuredClone(apiHeaders);

	afterEach(async () => {
		await db.deleteFrom("user_post").where("user_id", "=", 4).execute();
		await db.deleteFrom("post").where("title", "=", "Test Article").execute();
	});
	afterAll(async () => {
		await logoutUser(loginHeaders);
		await db.deleteFrom("user_post").where("user_id", "=", 4).execute();
		await db.deleteFrom("post").where("title", "=", "Test Article").execute();
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		userIds.forEach(async (el) => {
			await db.deleteFrom("user_session").where("user_id", "=", el).execute();
		});
		await db.deleteFrom("user_account").where("firstname", "=", "Test").execute();
		await db
			.deleteFrom("user_account")
			.where("firstname", "=", "Admin")
			.where("lastname", "=", "User")
			.execute();
		await db
			.deleteFrom("bibliography")
			.where("name_bibliography", "ilike", "TestBibliography%")
			.execute();
	});
	beforeAll(async () => {
		// Create two new users who are editors
		const newUserIds = await db
			.insertInto("user_account")
			.columns(["email", "password", "firstname", "lastname"])
			.values([
				{
					email: "testuser1@oeaw.ac.at",
					password: await hash("testpassword", argon2Config),
					firstname: "Test",
					lastname: "User1",
				},
				{
					email: "testuser2@oeaw.ac.at",
					password: await hash("testpassword", argon2Config),
					firstname: "Test",
					lastname: "User2",
				},
				{
					email: "adminuser@oeaw.ac.at",
					password: await hash("adminpassword", argon2Config),
					firstname: "Admin",
					lastname: "User",
				},
			])
			.returning(["id", "firstname"])
			.execute();
		userIds.push(...newUserIds.map((el) => el.id));
		expect(newUserIds.length).toBe(3);
		const editorRoleId = await db
			.selectFrom("user_roles")
			.where("role_name", "=", "editor")
			.select(["id"])
			.executeTakeFirst();

		const adminRoleId = await db
			.selectFrom("user_roles")
			.where("role_name", "=", "admin")
			.select(["id"])
			.executeTakeFirst();
		expect(editorRoleId).not.toBeNull();
		expect(editorRoleId).toHaveProperty("id");
		if (!editorRoleId || !adminRoleId) {
			return;
		}

		for (const el of newUserIds) {
			if (el.firstname === "Admin") {
				await db
					.insertInto("user_has_role")
					.columns(["user_id", "role_id"])
					.values({ user_id: el.id, role_id: adminRoleId.id })
					.execute();

				continue;
			}
			await db
				.insertInto("user_has_role")
				.columns(["user_id", "role_id"])
				.values({ user_id: el.id, role_id: editorRoleId.id })
				.execute();
		}

		// Create a new bibliography
		await db
			.insertInto("bibliography")
			.columns(["name_bibliography"])
			.values({ name_bibliography: existingBibliography })
			.execute();

		// login as editor
		const responseLogin = await app.request("/auth/login", {
			method: "POST",
			body: JSON.stringify({
				email: "testuser1@oeaw.ac.at",
				password: "testpassword",
			}),
			headers: apiHeaders,
		});

		loginHeaders.Cookie = responseLogin.headers.get("Set-Cookie") ?? "";
	});
	test("Create new article with all fields provided, should create the article, return the id of the new article and return status code 201", async () => {
		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({
				title: "Test Article",
				alias: "test-article",
				abstract: "test-abstract",
				content: "test-content",
				category: "commentary",
				status: "Draft",
				lang: "en",
				phenomenonId: 2,
				citation: "test-citation",
			}),
			headers: loginHeaders,
		});
		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");

		const articleId = body.articleId.id;

		// get the new article from the database
		const newArticle = await db
			.selectFrom("post")
			.where("id", "=", articleId)
			.selectAll()
			.executeTakeFirstOrThrow();

		expect(newArticle.title).toBe("Test Article");
		expect(newArticle.alias).toBe("test-article");
		expect(newArticle.cover).toBeNull();
		expect(newArticle.abstract).toBe("test-abstract");
		expect(newArticle.content).toBe("test-content");
		expect(newArticle.post_type_id).toBe(1);
		expect(newArticle.post_status).toBe("Draft");
		expect(newArticle.lang).toBe("en");
		expect(newArticle.published_at).toBeNull();
		expect(newArticle.updated_at).not.toBeNull();
		expect(newArticle.created_at).not.toBeNull();
		expect(newArticle.citation).toBe("test-citation");

		// Check if the phenomenon is linked to the article
		const linkPhenomenonPost = await db
			.selectFrom("phenomenon_post")
			.where("post_id", "=", articleId)
			.selectAll()
			.executeTakeFirst();

		expect(linkPhenomenonPost?.phenomenon_id).toBe(2);
	});
	test("Try to create new article with no fields provided, should return status code 400", async () => {
		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({}),
			headers: loginHeaders,
		});
		expect(response.status).toBe(400);
	});
	test("Create new article with one author provided (id: 151), should create a new article and link the author to the article, returns new article ID and status code 201", async () => {
		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({
				title: "Test Article",
				alias: "test-article",
				abstract: "test-abstract",
				content: "test-content",
				category: "commentary",
				status: "Draft",
				lang: "en",
				authors: [151],
			}),
			headers: loginHeaders,
		});

		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");

		const articleId = body.articleId.id;

		// Check if the author is linked to the article
		const linkAuthorPost = await db
			.selectFrom("user_post")
			.where("post_id", "=", articleId)
			.selectAll()
			.execute();
		expect(linkAuthorPost.length).toBe(1);
		if (linkAuthorPost.length === 0) {
			return;
		}
		expect(linkAuthorPost[0]?.user_id).toBe(151);
	});
	test("Create a new article with two new authors provided (firstname: Test), should create new article and link the two authors to the article, returns new article ID and status code 201", async () => {
		const userIds = await db
			.selectFrom("user_account")
			.where("firstname", "=", "Test")
			.select(["id"])
			.execute();
		expect(userIds.length).toBe(2);
		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({
				title: "Test Article",
				alias: "test-article",
				abstract: "test-abstract",
				content: "test-content",
				category: "commentary",
				status: "Draft",
				lang: "en",
				authors: userIds.map((el) => el.id),
			}),
			headers: loginHeaders,
		});

		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");

		const articleId = body.articleId.id;

		// Check if the author is linked to the article
		const linkAuthorPost = await db
			.selectFrom("user_post")
			.where("post_id", "=", articleId)
			.selectAll()
			.execute();
		expect(linkAuthorPost.length).toBe(2);
	});

	test("Create a new article with one bibliography provided, should create new article, create a new entry in the bibliography table, link the bibliography to the article and return new article ID and status code 201", async () => {
		const bibliographyName = "TestBibliography1";
		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({
				title: "Test Article",
				alias: "test-article",
				abstract: "test-abstract",
				content: "test-content",
				category: "commentary",
				status: "Draft",
				lang: "en",
				bibliography: [bibliographyName],
			}),
			headers: loginHeaders,
		});

		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");

		const articleId = body.articleId.id;

		// Check if the bibliography is linked to the article
		const linkBibliographyPost = await db
			.selectFrom("bibliography_post")
			.where("post_id", "=", articleId)
			.selectAll()
			.execute();
		expect(linkBibliographyPost.length).toBe(1);
		// Check if the bibliography entry has been created
		const bibliography = await db
			.selectFrom("bibliography")
			.where("name_bibliography", "=", "TestBibliography1")
			.selectAll()
			.execute();
		expect(bibliography.length).toBe(1);
		expect(bibliography[0]?.name_bibliography).toBe(bibliographyName);
	});

	test("Create a new article with two new bibliographies provided one already exists, should create new article, create one new entry in the bibliography table, link the bibliographies to the article and return new article ID and status code 201", async () => {
		const bibliographyName = "TestBibliography1";
		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({
				title: "Test Article",
				alias: "test-article",
				abstract: "test-abstract",
				content: "test-content",
				category: "commentary",
				status: "Draft",
				lang: "en",
				bibliography: [bibliographyName, existingBibliography],
			}),
			headers: loginHeaders,
		});

		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");

		const articleId = body.articleId.id;

		// Check if the bibliography is linked to the article
		const linkBibliographyPost = await db
			.selectFrom("bibliography_post")
			.where("post_id", "=", articleId)
			.selectAll()
			.execute();
		expect(linkBibliographyPost.length).toBe(2);
		// Check if the bibliography entry has been created
		const bibliography = await db
			.selectFrom("bibliography")
			.where("name_bibliography", "=", "TestBibliography1")
			.selectAll()
			.execute();
		expect(bibliography.length).toBe(1);
		expect(bibliography[0]?.name_bibliography).toBe(bibliographyName);

		// Check if there the exisiting bib entry has been used and that there is only one entry
		const bibliography2 = await db
			.selectFrom("bibliography")
			.where("name_bibliography", "=", existingBibliography)
			.selectAll()
			.execute();
		expect(bibliography2.length).toBe(1);
		expect(bibliography2[0]?.name_bibliography).toBe(existingBibliography);
	});

	test("Create a new article with one project provided that already exists in the DB, should create new article, link the project to the article and return new article ID and status code 201", async () => {
		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({
				title: "Test Article",
				alias: "test-article",
				abstract: "test-abstract",
				content: "test-content",
				category: "commentary",
				status: "Draft",
				lang: "en",
				projectId: [1],
			}),
			headers: loginHeaders,
		});

		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");

		const articleId = body.articleId.id;

		// Check if the project is linked to the article
		const linkProjectPost = await db
			.selectFrom("project_post")
			.where("post_id", "=", articleId)
			.selectAll()
			.execute();
		expect(linkProjectPost.length).toBe(1);

		const linkedProject = linkProjectPost[0];
		expect(linkedProject?.project_id).toBe(1);
		expect(linkedProject?.post_id).toBe(articleId);
	});

	test("Create a new article with one project that does not exist, should return status code 404", async () => {
		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({
				title: "Test Article",
				alias: "test-article",
				abstract: "test-abstract",
				content: "test-content",
				category: "commentary",
				status: "Draft",
				lang: "en",
				projectId: [999],
			}),
			headers: loginHeaders,
		});
		expect(response.status).toBe(404);
	});

	test("Provide articleid with phenomenon that does not exist in the db, expect error message and status code 500", async () => {
		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({
				title: "Test Article",
				alias: "test-article",
				abstract: "test-abstract",
				content: "test-content",
				category: "commentary",
				status: "Draft",
				lang: "en",
				phenomenonId: 999,
			}),
			headers: loginHeaders,
		});
		expect(response.status).toBe(500);
	});
});

describe("test endpoint GET /cms/articles/all/:project", () => {
	const articleIds: Array<number> = [];
	const categories: Array<string> = ["commentary", "methodology", "project_description"];
	const loginHeaders = structuredClone(apiHeaders);
	beforeAll(async () => {
		const sessionCookie = await loginUserAndReturnCookie("editor@oeaw.ac.at", "editoreditor");
		loginHeaders.Cookie = sessionCookie;
		// Create 30 new articles
		for (let i = 0; i < 30; i++) {
			const response = await app.request("/cms/articles/create", {
				method: "POST",
				body: JSON.stringify({
					title: `Test Article ${String(i)}`,
					alias: `test-article ${String(i)}`,
					abstract: "test-abstract",
					content: "test-content",
					category: categories[i % 3],
					status: "Draft",
					lang: "en",
					projectId: [1],
					authors: [3, 151],
				}),
				headers: loginHeaders,
			});
			expect(response.status).toBe(201);

			const body = await response.json();

			articleIds.push(Number(body.articleId.id));
			const articleResponse = await app.request("/cms/articles/all/1", {
				headers: loginHeaders,
			});
			expect(articleResponse.status).toBe(201);
		}
	});

	afterAll(async () => {
		await db.deleteFrom("post").where("title", "ilike", "Test Article%").execute();
		await logoutUser(loginHeaders);
	});

	test("Provide project id 1 with pagesize of 30 and leave other fields empty, should return all articles on one page with project id 1 and status code 201", async () => {
		const response = await app.request("/cms/articles/all/1?pageSize=30", {
			headers: loginHeaders,
		});

		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(30);
	});

	test("Provide different project id 2, should return empty array and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/2`, { headers: loginHeaders });
		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(0);
	});

	test("Provide project id 1 with pagesize of 10 and page 1, should return 10 articles with names Test article 0 to 9 on one page with project id 1 and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?pageSize=10&page=1`, {
			headers: loginHeaders,
		});
		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(10);

		// Check if contains the first 10 articles
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const articleIdsReceived = body.articles.map((el: { post_id: number }) => el.post_id);
		expect(articleIdsReceived).toEqual(articleIds.slice(0, 10));
	});

	test("Provide project id 1 with pagesize of 10 and page 2, should return 10 articles on one page with project id 1 and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?pageSize=10&page=2`, {
			headers: loginHeaders,
		});
		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(10);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const articleIdsReceived = body.articles.map((el: { post_id: number }) => el.post_id);
		expect(articleIdsReceived).toEqual(articleIds.slice(10, 20));
	});

	test("Provide project id 1 with pagesize of 10 on page 2 with offset of 10, should return 10 articles on one page with project id 1 and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?pageSize=10&offset=10&page=2`, {
			headers: loginHeaders,
		});
		expect(response.status).toBe(201);

		const body = await response.json();

		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(10);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const articleIdsReceived = body.articles.map((el: { post_id: number }) => el.post_id);
		expect(articleIdsReceived).toEqual(articleIds.slice(20, 30));
	});

	test("Provide project id 1 with pagesize of 30 on page 2, should return empty array and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?pageSize=30&page=2`, {
			headers: loginHeaders,
		});
		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(0);
	});

	test("Provide project id 1 with pagesize of 10 and category commentary, should return 10 articles with category commentary on one page with project id 1 and status code 201", async () => {
		const response = await app.request(
			`/cms/articles/all/1?pageSize=10&category=${categories[0] ?? ""}`,
			{ headers: loginHeaders },
		);
		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(10);

		// Should only contain articles with category commentary
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const articleCategories = body.articles.map((el: { post_type: string }) => el.post_type);
		expect(articleCategories).toEqual(Array(10).fill(categories[0]));
	});

	test("Provide project id 1 and category article, should return empty array and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?category=article`, {
			headers: loginHeaders,
		});
		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(0);
	});

	test("Provide project id 1 and searchTerm Test Article 1, should return 11 articles with title containing Test Article 1 and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?searchTerm=Test Article 1`, {
			headers: loginHeaders,
		});
		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(11);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const articleTitles = body.articles.map((el: { title: string }) => el.title);
		expect(articleTitles).toContainEqual("Test Article 1");
	});

	test("Provide project id 1 and searchTerm Test Article 20, should return 1 article with title containing Test Article 20 and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?searchTerm=Test Article 20`, {
			headers: loginHeaders,
		});
		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(1);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const articleTitles = body.articles.map((el: { title: string }) => el.title);
		expect(articleTitles).toContainEqual("Test Article 20");
	});

	test("Provide project id 1 and searchTerm Othertitle, should return empty array and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?searchTerm=Othertitle`, {
			headers: loginHeaders,
		});
		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(0);
	});

	test("Provide no project id, should return status code 400 with error message Provided id is not a number", async () => {
		const response = await app.request(`/cms/articles/all`, { headers: loginHeaders });
		expect(response.status).toBe(400);

		const body = await response.json();
		expect(body).toBe("Provided id is not a number");
	});
});

describe("test endpoint PUT /cms/:id", () => {
	let articleId = 0;
	const loginHeaders = structuredClone(apiHeaders);
	beforeAll(async () => {
		// login as editor
		const responseLogin = await app.request("/auth/login", {
			method: "POST",
			body: JSON.stringify({
				email: "editor@oeaw.ac.at",
				password: "editoreditor",
			}),
			headers: apiHeaders,
		});

		loginHeaders.Cookie = responseLogin.headers.get("Set-Cookie") ?? "";

		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({
				title: "Test Article",
				alias: "test-article",
				abstract: "test-abstract",
				content: "test-content",
				category: "commentary",
				status: "Draft",
				lang: "en",
				phenomenonId: 4,
				projectId: [1],
				authors: [3, 151],
				citation: "test-citation-updated",
				bibliography: ["TestBibliography1"],
				cover: "test-cover",
				cover_alt: "test-cover-alt",
			}),
			headers: loginHeaders,
		});

		expect(response.status).toBe(201);

		const body = await response.json();

		articleId = body.articleId.id;
	});

	afterAll(async () => {
		await db.deleteFrom("user_post").where("user_id", "=", 4).execute();
		await db.deleteFrom("post").where("title", "ilike", "Test Article%").execute();
		await db.deleteFrom("user_account").where("firstname", "=", "Test").execute();
		await db
			.deleteFrom("bibliography")
			.where("name_bibliography", "ilike", "TestBibliography%")
			.execute();
		await logoutUser(loginHeaders);
	});

	test("Provide article id and change all attributes of the article, remove one author, set the status to published, should change the article, set a date for published at and return status code 201", async () => {
		const response = await app.request(`/cms/articles/${String(articleId)}`, {
			method: "PUT",
			body: JSON.stringify({
				title: "Test Article Updated",
				alias: "test-article-updated",
				abstract: "test-abstract-updated",
				content: "test-content-updated",
				category: "methodology",
				status: "Published",
				lang: "de",
				projectId: [2],
				authors: [3],
				phenomenonId: 5,
				citation: "test-citation-updated",
				cover: "test-cover-updated",
				cover_alt: "test-cover-alt-updated",
			}),
			headers: loginHeaders,
		});
		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body).toHaveProperty("updatedRows");
		expect(body.updatedRows).toBe(1);

		// Fetch the article from the endpoint and check
		const articleFetched = await app.request(`/cms/articles/${String(articleId)}`, {
			headers: loginHeaders,
		});
		const articleBody = await articleFetched.json();

		expect(articleBody).toHaveProperty("article");
		expect(articleBody.article.title).toBe("Test Article Updated");
		expect(articleBody.article.alias).toBe("test-article-updated");
		expect(articleBody.article.abstract).toBe("test-abstract-updated");
		expect(articleBody.article.content).toBe("test-content-updated");
		expect(articleBody.article.post_type_name).toBe("methodology");
		expect(articleBody.article.post_status).toBe("Published");
		expect(articleBody.article.lang).toBe("de");
		expect(articleBody.article.authors.length).toBe(1);
		expect(articleBody.article.published_at).not.toBeNull();
		expect(articleBody.article.updated_at).not.toBeNull();
		expect(articleBody.article.citation).toBe("test-citation-updated");
		expect(articleBody.article.cover).toBe("test-cover-updated");
		expect(articleBody.article.cover_alt).toBe("test-cover-alt-updated");

		// Check if the phenomenon is linked to the article
		const linkPhenomenonPost = await db
			.selectFrom("phenomenon_post")
			.where("post_id", "=", articleId)
			.selectAll()
			.execute();
		expect(linkPhenomenonPost.length).toBe(1);
		expect(linkPhenomenonPost[0]?.phenomenon_id).toBe(5);
	});

	test("Provide article id and change the provided bibliography to contain 1 new entries and 1 existing, should change the article, create 2 new entries in the bibliography table and link the new entries to the article, return status code 201", async () => {
		const response = await app.request(`/cms/articles/${String(articleId)}`, {
			method: "PUT",
			body: JSON.stringify({
				title: "Test Article Updated",
				alias: "test-article-updated",
				abstract: "test-abstract-updated",
				content: "test-content-updated",
				category: "methodology",
				status: "Published",
				lang: "de",
				projectId: [2],
				authors: [3],
				bibliography: ["TestBibliography1", "TestBibliography2"],
			}),
			headers: loginHeaders,
		});
		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body).toHaveProperty("updatedRows");
		expect(body.updatedRows).toBe(1);

		// Check if the bibliography is linked to the article
		const linkBibliographyPost = await db
			.selectFrom("bibliography_post")
			.where("post_id", "=", articleId)
			.selectAll()
			.execute();
		expect(linkBibliographyPost.length).toBe(2);
		// Check if the bibliography entry has been created
		const bibliography = await db
			.selectFrom("bibliography")
			.where("name_bibliography", "ilike", "TestBibliography%")
			.selectAll()
			.execute();
		expect(bibliography.length).toBe(2);
	});

	test("Provide article id and delete all linked bibliography entries from the article, should change the article, remove the linked bibliography entries, return status code 201", async () => {
		const response = await app.request(`/cms/articles/${String(articleId)}`, {
			method: "PUT",
			body: JSON.stringify({
				title: "Test Article Updated",
				alias: "test-article-updated",
				abstract: "test-abstract-updated",
				content: "test-content-updated",
				category: "methodology",
				status: "Published",
				lang: "de",
				projectId: [2],
				authors: [3],
			}),
			headers: loginHeaders,
		});
		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body).toHaveProperty("updatedRows");
		expect(body.updatedRows).toBe(1);

		// Check if no bibliography is linked to the article
		const linkBibliographyPost = await db
			.selectFrom("bibliography_post")
			.where("post_id", "=", articleId)
			.selectAll()
			.execute();
		expect(linkBibliographyPost.length).toBe(0);
		// Check if the bibliography entries are still there
		const bibliography = await db
			.selectFrom("bibliography")
			.where("name_bibliography", "ilike", "TestBibliography%")
			.selectAll()
			.execute();
		expect(bibliography.length).toBe(2);
	});

	test("Provide article id and change only author but with an id that does not exist, expect error message and status code 500", async () => {
		const response = await app.request(`/cms/articles/${String(articleId)}`, {
			method: "PUT",
			body: JSON.stringify({
				title: "Test Article Updated",
				alias: "test-article-updated",
				abstract: "test-abstract-updated",
				content: "test-content-updated",
				category: "methodology",
				status: "Published",
				lang: "de",
				projectId: [2],
				authors: [5],
			}),
			headers: loginHeaders,
		});
		expect(response.status).toBe(500);
	});

	test("Provide article id as a string, expect error message and status code 400", async () => {
		const response = await app.request(`/cms/articles/abc`, {
			method: "PUT",
			body: JSON.stringify({
				title: "Test Article Updated",
				alias: "test-article-updated",
				abstract: "test-abstract-updated",
				content: "test-content-updated",
				category: "methodology",
				status: "Published",
				lang: "de",
				projectId: [2],
				authors: [3],
			}),
			headers: loginHeaders,
		});
		expect(response.status).toBe(400);
	});

	test("Provide articleid with phenomenon that does not exist in the db, expect error message and status code 500", async () => {
		const response = await app.request(`/cms/articles/${String(articleId)}`, {
			method: "PUT",
			body: JSON.stringify({
				title: "Test Article Updated",
				alias: "test-article-updated",
				abstract: "test-abstract-updated",
				content: "test-content-updated",
				category: "methodology",
				status: "Published",
				lang: "de",
				projectId: [2],
				authors: [3],
				phenomenonId: 999,
			}),
			headers: loginHeaders,
		});
		expect(response.status).toBe(500);
	});

	test("Create new article with one author, edit the article and add another author, should change the user_post relation to contain the new authors and status code 201", async () => {
		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({
				title: "Test Article",
				alias: "test-article",
				abstract: "test-abstract",
				content: "test-content",
				category: "commentary",
				status: "Draft",
				lang: "en",
				authors: [151],
			}),
			headers: loginHeaders,
		});

		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");

		const articleId = body.articleId.id;

		const responseEdit = await app.request(`/cms/articles/${String(articleId)}`, {
			method: "PUT",
			body: JSON.stringify({
				title: "Test Article Updated",
				alias: "test-article-updated",
				abstract: "test-abstract-updated",
				content: "test-content-updated",
				category: "methodology",
				status: "Published",
				lang: "de",
				projectId: [2],
				authors: [3, 151],
			}),
			headers: loginHeaders,
		});
		expect(responseEdit.status).toBe(201);

		// Check if the author is linked to the article
		const linkAuthorPost = await db
			.selectFrom("user_post")
			.where("post_id", "=", articleId)
			.selectAll()
			.execute();
		expect(linkAuthorPost.length).toBe(2);
	});

	test("Create new article and Change status of article to Published and update the article, should change the article and set the date for published, change afterwards article again leave status the same and published date should not change", async () => {
		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({
				title: "Test Article",
				alias: "test-article",
				abstract: "test-abstract",
				content: "test-content",
				category: "commentary",
				status: "Draft",
				lang: "en",
				authors: [151],
			}),
			headers: loginHeaders,
		});

		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");

		const articleId = body.articleId.id;

		const responseEdit = await app.request(`/cms/articles/${String(articleId)}`, {
			method: "PUT",
			body: JSON.stringify({
				title: "Test Article Updated",
				alias: "test-article-updated",
				abstract: "test-abstract-updated",
				content: "test-content-updated",
				category: "methodology",
				status: "Published",
				lang: "de",
				projectId: [2],
				authors: [3, 151],
			}),
			headers: loginHeaders,
		});
		expect(responseEdit.status).toBe(201);

		const responseEditBody = await responseEdit.json();
		expect(responseEditBody.published_at).not.toBeNull();
		expect(responseEditBody.updated_at).not.toBeNull();

		// Get the article again from the endpoint
		const article = await app.request(`/cms/articles/${String(articleId)}`, {
			headers: loginHeaders,
		});

		const articleBody = await article.json();

		const publishedAt = articleBody.article.published_at;
		const updatedAt = articleBody.article.updated_at;

		// Change the article again, should not change date
		const responseEdit2 = await app.request(`/cms/articles/${String(articleId)}`, {
			method: "PUT",
			body: JSON.stringify({
				title: "Test Article Updated",
				alias: "test-article-updated",
				abstract: "test-abstract-updated",
				content: "test-content-updated",
				category: "methodology",
				status: "Published",
				lang: "de",
				projectId: [2],
				authors: [3, 151],
			}),
			headers: loginHeaders,
		});

		expect(responseEdit2.status).toBe(201);

		// get the article by id and check if the published date is the same and updated date has changed
		const editedArticle = await app.request(`/cms/articles/${String(articleId)}`, {
			headers: loginHeaders,
		});
		const responseEdit2Body = await editedArticle.json();

		expect(responseEdit2Body.article.published_at).not.toBeNull();
		expect(responseEdit2Body.article.updated_at).not.toBeNull();

		expect(responseEdit2Body.article.published_at).toBe(publishedAt);
		expect(responseEdit2Body.article.updated_at).not.toBe(updatedAt);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		expect(new Date(responseEdit2Body.article.updated_at)).above(new Date(updatedAt));
	});
});

describe("test endpoint DELETE /cms/articles/:id", () => {
	let articleId = 0;
	const loginHeaders = structuredClone(apiHeaders);
	beforeAll(async () => {
		// login as editor
		const responseLogin = await app.request("/auth/login", {
			method: "POST",
			body: JSON.stringify({
				email: "editor@oeaw.ac.at",
				password: "editoreditor",
			}),
			headers: apiHeaders,
		});

		loginHeaders.Cookie = responseLogin.headers.get("Set-Cookie") ?? "";

		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({
				title: "Test Article",
				alias: "test-article",
				abstract: "test-abstract",
				content: "test-content",
				category: "commentary",
				status: "Draft",
				lang: "en",
				phenomenonId: 4,
				projectId: [1],
				authors: [3, 151],
				citation: "test-citation-updated",
				bibliography: ["TestBibliography1"],
			}),
			headers: loginHeaders,
		});

		expect(response.status).toBe(201);

		const body = await response.json();

		articleId = body.articleId.id;
	});

	afterAll(async () => {
		await db.deleteFrom("user_post").where("user_id", "=", 4).execute();
		await db.deleteFrom("post").where("title", "ilike", "Test Article%").execute();
		await db
			.deleteFrom("bibliography")
			.where("name_bibliography", "ilike", "TestBibliography%")
			.execute();
		await logoutUser(loginHeaders);
	});

	test("Provide article id and delete the article, should delete the article and return status code 200, fetch article afterwards and check if the returned object is empty", async () => {
		const response = await app.request(`/cms/articles/${String(articleId)}`, {
			method: "DELETE",
			headers: loginHeaders,
		});
		expect(response.status).toBe(200);

		// Check if the article is deleted
		const articleFetched = await app.request(`/cms/articles/${String(articleId)}`, {
			headers: loginHeaders,
		});
		const articleBody = await articleFetched.json();
		expect(articleBody).toStrictEqual({});
	});

	test("Provide article id as a string, expect error message and status code 400", async () => {
		const response = await app.request(`/cms/articles/abc`, {
			method: "DELETE",
			headers: loginHeaders,
		});

		expect(response.status).toBe(400);
	});
});
