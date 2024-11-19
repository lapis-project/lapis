/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { app } from "@/app";
import { db } from "@/db/connect";

import { apiHeaders, loginUserAndReturnCookie, logoutUser } from "./testutils";

describe("test endpoint GET /articles/articles/:project", () => {
	const loginHeaders = structuredClone(apiHeaders);
	const categories: Array<string> = ["commentary", "methodology", "project_description"];
	const articleIds: Array<number> = [];

	beforeAll(async () => {
		// Login as editor
		const sessionCookie = await loginUserAndReturnCookie("editor@oeaw.ac.at", "editoreditor");
		loginHeaders.Cookie = sessionCookie;

		// Create dummy articles that will be removed when the test is finished
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
					status: i < 10 ? "Draft" : "Published",
					lang: "en",
					projectId: [1],
					authors: [3, 4],
				}),
				headers: loginHeaders,
			});
			expect(response.status).toBe(201);

			const body = await response.json();

			articleIds.push(Number(body.articleId.id));
		}
	});

	afterAll(async () => {
		await db.deleteFrom("post").where("title", "ilike", "Test Article%").execute();
		await logoutUser(loginHeaders);
	});

	test("Provide project id 1 with pagesize of 30 and leave other fields empty, should return 20 articles on one page with status published, expect fields prev and next to be null", async () => {
		const response = await app.request("/articles/articles/1?pageSize=30", {
			headers: loginHeaders,
		});

		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(20);

		for (const article of body.articles) {
			expect(article.status).toBe("Published");
		}
	});

	test("Provide project id 2 without any other options, should return empty articles array with prev and next null", async () => {
		const response = await app.request("/articles/articles/2", {
			headers: loginHeaders,
		});

		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(0);
	});

	test("Provide project id 1 with pagesize of 10 on page 1, should return 10 articles with status published, prev should be null, next should not be null", async () => {
		const response = await app.request("/articles/articles/1?pageSize=10&page=1", {
			headers: loginHeaders,
		});

		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(10);

		for (const article of body.articles) {
			expect(article.status).toBe("Published");
		}

		expect(body.prev).toBeNull();
		expect(body.next).not.toBeNull();
	});

	test("Provide project id 1 with pagesize of 10 on page 10, should return 0 articles with status published, prev should be null, next should be null", async () => {
		const response = await app.request("/articles/articles/1?pageSize=10&page=10", {
			headers: loginHeaders,
		});

		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(0);

		for (const article of body.articles) {
			expect(article.status).toBe("Published");
		}

		expect(body.prev).toBeNull();
		expect(body.next).toBeNull();
	});

	test("Provide project id 1 with pagesize of 5 on page 2, should return 5 articles with status published, prev should not be null, next should not be null", async () => {
		const response = await app.request("/articles/articles/1?pageSize=5&page=2", {
			headers: loginHeaders,
		});

		expect(response.status).toBe(201);

		const body = await response.json();
		expect(body).toHaveProperty("articles");

		expect(body.articles.length).toBe(5);

		for (const article of body.articles) {
			expect(article.status).toBe("Published");
		}

		expect(body.prev).not.toBeNull();
		expect(body.next).not.toBeNull();
	});

	test("Provide no project id, should return status code 400 with error message Provided id is not a number", async () => {
		const response = await app.request(`/articles/articles/all`, { headers: loginHeaders });
		expect(response.status).toBe(400);

		const body = await response.json();
		expect(body).toBe("Provided projectId is not a number");
	});
});

describe("test endpoint GET /articles/detail/:alias", () => {
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
				authors: [4],
				bibliography: ["TestBibliography1"],
				phenomenonId: 2,
				citation: "test-citation",
			}),
			headers: loginHeaders,
		});

		expect(response.status).toBe(201);

		const body = await response.json();

		articleId = body.articleId.id;
	});

	afterAll(async () => {
		await db.deleteFrom("post").where("title", "=", "Test Article").execute();
		await logoutUser(loginHeaders);
	});

	test("fetch article with alias, should return 201 and article with all parameters which were provided by the post request without emails usernames and userids", async () => {
		const response = await app.request("/articles/detail/test-article", { headers: loginHeaders });
		expect(response.status).toBe(201);
		const body = await response.json();
		expect(body).toHaveProperty("article");

		expect(body.article.title).toBe("Test Article");
		expect(body.article.alias).toBe("test-article");
		expect(body.article.post_id).toBe(articleId);
		expect(body.article.phenomenon[0].phenomenon_id).toBe(2);
		expect(body.article.phenomenon[0].name).not.toBeNull();

		expect(body.article.bibliography[0].name).toBe("TestBibliography1");

		expect(body.article.authors[0].firstname).not.toBeNull();
		expect(body.article.authors[0].lastname).not.toBeNull();
	});

	test("provide no alias, should return status code 400 with error message provided alias is not a string", async () => {
		const response = await app.request("/articles/detail/{}", { headers: loginHeaders });
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body).toBe("Provided alias is not a string");
	});
});
