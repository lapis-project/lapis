import { afterEach } from "node:test";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { app } from "@/app";
import { db } from "@/db/connect";

const apiHeaders = {
	"Content-Type": "application/json",
	Origin: "http://localhost:3000",
	Host: "localhost:3000",
};

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
	beforeAll(() => {
		// const honoClient = hc<GetAuthorInformationType>("");
	});
	test("Should return status code 200", async () => {
		const response = await app.request("/cms/articles/create/info");
		expect(response.status).toBe(200);
	});
	test("Should return object containing authors, categories and phenomenon", async () => {
		const response = await app.request("/cms/articles/create/info");

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(body).toHaveProperty("authors");
		expect(body).toHaveProperty("categories");
		expect(body).toHaveProperty("phenomenon");
	});
});

describe("test endpoint POST /cms/articles/create", () => {
	const existingBibliography = "TestBibliography2";
	afterEach(async () => {
		await db.deleteFrom("user_post").where("user_id", "=", 4).execute();
		await db.deleteFrom("post").where("title", "=", "Test Article").execute();
	});
	afterAll(async () => {
		await db.deleteFrom("user_post").where("user_id", "=", 4).execute();
		await db.deleteFrom("post").where("title", "=", "Test Article").execute();
		await db.deleteFrom("user_account").where("firstname", "=", "Test").execute();
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
					password: "testpassword",
					firstname: "Test",
					lastname: "User1",
				},
				{
					email: "testuser2@oeaw.ac.at",
					password: "testpassword",
					firstname: "Test",
					lastname: "User2",
				},
			])
			.returning(["id"])
			.execute();
		expect(newUserIds.length).toBe(2);
		const editorRoleId = await db
			.selectFrom("user_roles")
			.where("role_name", "=", "editor")
			.select(["id"])
			.executeTakeFirst();
		expect(editorRoleId).not.toBeNull();
		expect(editorRoleId).toHaveProperty("id");
		if (!editorRoleId) return;
		newUserIds.forEach(async (el) => {
			await db
				.insertInto("user_has_role")
				.columns(["user_id", "role_id"])
				.values({ user_id: el.id, role_id: editorRoleId.id })
				.execute();
		});

		// Create a new bibliography
		await db
			.insertInto("bibliography")
			.columns(["name_bibliography"])
			.values({ name_bibliography: existingBibliography })
			.execute();
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
			}),
			headers: apiHeaders,
		});
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");
	});
	test("Try to create new article with no fields provided, should return status code 400", async () => {
		const response = await app.request("/cms/articles/create", {
			method: "POST",
			body: JSON.stringify({}),
			headers: apiHeaders,
		});
		expect(response.status).toBe(400);
	});
	test("Create new article with one author provided (id: 4), should create a new article and link the author to the article, returns new article ID and status code 201", async () => {
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
				authors: [4],
			}),
			headers: apiHeaders,
		});
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		const articleId = body.articleId.id;

		// Check if the author is linked to the article
		const linkAuthorPost = await db
			.selectFrom("user_post")
			.where("post_id", "=", articleId)
			.selectAll()
			.execute();
		expect(linkAuthorPost.length).toBe(1);
		if (linkAuthorPost.length === 0) return;
		expect(linkAuthorPost[0]?.user_id).toBe(4);
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
			headers: apiHeaders,
		});
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
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
			headers: apiHeaders,
		});
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
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
			headers: apiHeaders,
		});
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
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
});
