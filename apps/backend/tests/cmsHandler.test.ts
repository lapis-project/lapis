import { beforeAll, describe, expect, test } from "vitest";

import { app } from "@/app";

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
			headers: {
				"Content-Type": "application/json",
				Origin: "http://localhost:3000",
				Host: "localhost:3000",
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");
	});
});
