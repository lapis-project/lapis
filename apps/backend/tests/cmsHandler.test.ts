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

describe.skip("test endpoint /cms/articles/create/info", () => {
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

describe.skip("test endpoint GET /cms/articles/:id", () => {
	let articleId = 0;
	beforeAll(async () => {
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
				authors: [4],
			}),
			headers: apiHeaders,
		});
		expect(response.status).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		articleId = body.articleId.id;
	});

	afterAll(async () => {
		await db.deleteFrom("post").where("title", "=", "Test Article").execute();
	});

	test("Should return status code 200", async () => {
		const response = await app.request("/cms/articles/1");
		expect(response.status).toBe(201);
	});

	test("Provide correct article id, should return the article with the provided id and status code 201", async () => {
		const response = await app.request(`/cms/articles/${String(articleId)}`);
		expect(response.status).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(body).toHaveProperty("article");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(body.article.post_id).toBe(articleId);
	});
});

describe.skip("test endpoint POST /cms/articles/create", () => {
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
			headers: apiHeaders,
		});

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(response.status).toBe(201);
		expect(body).toHaveProperty("articleId");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
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
			headers: apiHeaders,
		});
		expect(response.status).toBe(404);
	});
});

describe("test endpoint GET /cms/articles/all/:project", () => {
	const articleIds: Array<number> = [];
	const categories: Array<string> = ["commentary", "methodology", "project_description"];
	beforeAll(async () => {
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
					authors: [3, 4],
				}),
				headers: apiHeaders,
			});
			expect(response.status).toBe(201);
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const body = await response.json();
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			articleIds.push(Number(body.articleId.id));
		}
	});

	afterAll(async () => {
		await db.deleteFrom("post").where("title", "ilike", "Test Article%").execute();
	});

	test("Provide project id 1 with pagesize of 30 and leave other fields empty, should return all articles on one page with project id 1 and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?pageSize=30`);
		expect(response.status).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(body).toHaveProperty("articles");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(body.articles.length).toBe(30);
	});

	test("Provide different project id 2, should return empty array and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/2`);
		expect(response.status).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(body).toHaveProperty("articles");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(body.articles.length).toBe(0);
	});

	test("Provide project id 1 with pagesize of 10 and page 1, should return 10 articles with names Test article 0 to 9 on one page with project id 1 and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?pageSize=10&page=1`);
		expect(response.status).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(body).toHaveProperty("articles");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(body.articles.length).toBe(10);

		// Check if contains the first 10 articles
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const articleIdsReceived = body.articles.map((el: { post_id: number }) => el.post_id);
		expect(articleIdsReceived).toEqual(articleIds.slice(0, 10));
	});

	test("Provide project id 1 with pagesize of 10 and page 2, should return 10 articles on one page with project id 1 and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?pageSize=10&page=2`);
		expect(response.status).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(body).toHaveProperty("articles");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(body.articles.length).toBe(10);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const articleIdsReceived = body.articles.map((el: { post_id: number }) => el.post_id);
		expect(articleIdsReceived).toEqual(articleIds.slice(10, 20));
	});

	test("Provide project id 1 with pagesize of 10 on page 2 with offset of 10, should return 10 articles on one page with project id 1 and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?pageSize=10&offset=10&page=2`);
		expect(response.status).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();

		expect(body).toHaveProperty("articles");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(body.articles.length).toBe(10);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const articleIdsReceived = body.articles.map((el: { post_id: number }) => el.post_id);
		expect(articleIdsReceived).toEqual(articleIds.slice(20, 30));
	});

	test("Provide project id 1 with pagesize of 30 on page 2, should return empty array and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?pageSize=30&page=2`);
		expect(response.status).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(body).toHaveProperty("articles");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(body.articles.length).toBe(0);
	});

	test("Provide project id 1 with pagesize of 10 and category commentary, should return 10 articles with category commentary on one page with project id 1 and status code 201", async () => {
		const response = await app.request(
			`/cms/articles/all/1?pageSize=10&category=${categories[0] ?? ""}`,
		);
		expect(response.status).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(body).toHaveProperty("articles");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(body.articles.length).toBe(10);

		// Should only contain articles with category commentary
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const articleCategories = body.articles.map((el: { post_type: string }) => el.post_type);
		expect(articleCategories).toEqual(Array(10).fill(categories[0]));
	});

	test("Provide project id 1 and category article, should return empty array and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?category=article`);
		expect(response.status).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(body).toHaveProperty("articles");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(body.articles.length).toBe(0);
	});

	test("Provide project id 1 and searchTerm Test Article 1, should return 11 articles with title containing Test Article 1 and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?searchTerm=Test Article 1`);
		expect(response.status).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(body).toHaveProperty("articles");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(body.articles.length).toBe(11);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const articleTitles = body.articles.map((el: { title: string }) => el.title);
		expect(articleTitles).toContainEqual("Test Article 1");
	});

	test("Provide project id 1 and searchTerm Test Article 20, should return 1 article with title containing Test Article 20 and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?searchTerm=Test Article 20`);
		expect(response.status).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(body).toHaveProperty("articles");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(body.articles.length).toBe(1);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
		const articleTitles = body.articles.map((el: { title: string }) => el.title);
		expect(articleTitles).toContainEqual("Test Article 20");
	});

	test("Provide project id 1 and searchTerm Othertitle, should return empty array and status code 201", async () => {
		const response = await app.request(`/cms/articles/all/1?searchTerm=Othertitle`);
		expect(response.status).toBe(201);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(body).toHaveProperty("articles");
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		expect(body.articles.length).toBe(0);
	});

	test("Provide no project id, should return status code 400 with error message Provided id is not a number", async () => {
		const response = await app.request(`/cms/articles/all`);
		expect(response.status).toBe(400);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const body = await response.json();
		expect(body).toBe("Provided id is not a number");
	});
});
