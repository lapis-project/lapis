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
	afterEach(async () => {
		await db.deleteFrom("user_post").where("user_id", "=", 4).execute();
		await db.deleteFrom("post").where("title", "=", "Test Article").execute();
	});
	afterAll(async () => {
		await db.deleteFrom("user_post").where("user_id", "=", 4).execute();
		await db.deleteFrom("post").where("title", "=", "Test Article").execute();
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
});
