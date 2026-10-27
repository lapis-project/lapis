import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp, jsonRequest, testUser } from "./testutils.ts";

const repo = vi.hoisted(() => ({
	createNewPost: vi.fn(),
	deleteArticleById: vi.fn(),
	deleteAuthorsFromArticleByArticleId: vi.fn(),
	deleteBibliographyFromArticleByArticleId: vi.fn(),
	deleteLinkedPhenomenonFromArticleByArticleId: vi.fn(),
	getAllArticlesByProjectId: vi.fn(),
	getAllUserPhenKat: vi.fn(),
	getArticleById: vi.fn(),
	getCoverById: vi.fn(),
	getPostTypeIdsByName: vi.fn(),
	linkArticleToPhenomenon: vi.fn(),
	linkAuthorsToPost: vi.fn(),
	linkProjectToPost: vi.fn(),
	updateArticleById: vi.fn(),
	checkBibliographyExists: vi.fn(),
	insertNewBibliography: vi.fn(),
	insertNewBibliographyPost: vi.fn(),
}));
const userRepo = vi.hoisted(() => ({ getAllUsers: vi.fn(), getAllUserRoles: vi.fn() }));
const generateSignedImageUrl = vi.hoisted(() => vi.fn());
const deleteFromS3 = vi.hoisted(() => vi.fn());

vi.mock("@/db/cmsRepository.ts", () => repo);
vi.mock("@/db/userRepository.ts", () => userRepo);
vi.mock("@/service/imageService.ts", () => ({ generateSignedImageUrl }));
vi.mock("@/service/storageService.ts", () => ({ deleteFromS3 }));

const { default: cms } = await import("@/handler/cmsHandler.ts");
const app = createTestApp().route("/cms", cms);

const article = {
	post_id: 7,
	title: "Test article",
	alias: "test-article",
	cover: "https://example.com/cover.webp",
	post_status: "Draft",
	published_at: null,
};
const articleBody = {
	title: "Updated article",
	alias: "updated-article",
	abstract: "Abstract",
	content: "Content",
	category: "commentary",
	status: "Draft",
	lang: "en",
};

function updateArticle(body: unknown = articleBody, id = "7") {
	return app.request(`/cms/articles/${id}`, jsonRequest("PUT", body));
}

describe("CMS handler", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		repo.createNewPost.mockResolvedValue({ id: 7 });
		repo.getArticleById.mockResolvedValue(article);
		repo.getCoverById.mockResolvedValue({ cover: null });
		repo.getPostTypeIdsByName.mockResolvedValue({ id: 3 });
		repo.getAllArticlesByProjectId.mockResolvedValue([{ total: 25, articles: [article] }]);
		repo.getAllUserPhenKat.mockResolvedValue([]);
		repo.updateArticleById.mockResolvedValue({ numUpdatedRows: 1n });
		repo.checkBibliographyExists.mockResolvedValue([]);
		repo.insertNewBibliography.mockResolvedValue([{ id: 11 }]);
		userRepo.getAllUsers.mockResolvedValue([]);
		userRepo.getAllUserRoles.mockResolvedValue([]);
		generateSignedImageUrl.mockReturnValue("https://images.example.com/signed.webp");
	});

	it.each([
		["/cms/articles/create/info", "GET"],
		["/cms/articles/7", "GET"],
		["/cms/articles/all/1", "GET"],
		["/cms/articles/create", "POST"],
		["/cms/articles/7", "PUT"],
		["/cms/articles/7", "DELETE"],
		["/cms/users/all", "GET"],
	])("requires a session for %s %s", async (path, method) => {
		const unauthenticated = createTestApp(null).route("/cms", cms);
		expect((await unauthenticated.request(path, { method })).status).toBe(403);
		for (const query of Object.values(repo)) expect(query).not.toHaveBeenCalled();
	});

	it("groups article form metadata and maps author names", async () => {
		const category = { id: 3, name: "commentary", category: "category" };
		const phenomenon = { id: 4, name: "Phenomenon", category: "phenomenon" };
		const survey = { id: 5, name: "123", category: "survey" };
		repo.getAllUserPhenKat.mockResolvedValue([
			{ id: 1, name: "Test$Author", category: "user" },
			{ id: 2, name: null, category: "user" },
			category,
			phenomenon,
			survey,
		]);
		const response = await app.request("/cms/articles/create/info");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			authors: [
				{ id: 1, value: 1, firstName: "Test", lastName: "Author" },
				{ id: 2, value: 2, firstName: "", lastName: "" },
			],
			categories: [category],
			phenomenon: [phenomenon],
			survey: [survey],
		});
		expect(repo.getAllUserPhenKat).toHaveBeenCalledExactlyOnceWith("1");
	});

	it("creates a draft for the signed-in user without requiring an article body", async () => {
		const response = await app.request("/cms/articles/create", { method: "POST" });
		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ articleId: { id: 7 } });
		expect(repo.createNewPost).toHaveBeenCalledExactlyOnceWith(testUser.id);
		expect(repo.linkProjectToPost).toHaveBeenCalledExactlyOnceWith(7, [1]);
		expect(repo.updateArticleById).not.toHaveBeenCalled();
	});

	it("fetches article details with the current 200 response status", async () => {
		const response = await app.request("/cms/articles/7");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ article });
		expect(repo.getArticleById).toHaveBeenCalledExactlyOnceWith(7);
		expect(generateSignedImageUrl).not.toHaveBeenCalled();
	});

	it("signs S3 covers in article details", async () => {
		repo.getArticleById.mockResolvedValue({ ...article, cover: "s3://bucket/cover.webp" });
		const response = await app.request("/cms/articles/7");
		expect((await response.json()).article.cover).toBe("https://images.example.com/signed.webp");
		expect(generateSignedImageUrl).toHaveBeenCalledExactlyOnceWith("s3://bucket/cover.webp");
	});

	it("returns an empty article result when no article exists", async () => {
		repo.getArticleById.mockResolvedValue(undefined);
		const response = await app.request("/cms/articles/7");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({});
	});

	it("lists articles with default pagination", async () => {
		const response = await app.request("/cms/articles/all/1");
		expect(response.status).toBe(200);
		expect(repo.getAllArticlesByProjectId).toHaveBeenCalledExactlyOnceWith(1, 20, 0, "", "");
		expect(await response.json()).toEqual({
			articles: [article],
			totalResults: 25,
			currentPage: "http://localhost/cms/articles/all/1",
			prev: null,
			next: "http://localhost/cms/articles/all/1?page=2",
		});
	});

	it("forwards list filters and preserves them in pagination URLs", async () => {
		const response = await app.request(
			"/cms/articles/all/2?page=2&pageSize=5&offset=3&category=commentary&searchTerm=Test",
		);
		const body = await response.json();
		expect(response.status).toBe(200);
		expect(repo.getAllArticlesByProjectId).toHaveBeenCalledExactlyOnceWith(
			2,
			5,
			8,
			"Test",
			"commentary",
		);
		expect(new URL(body.prev).searchParams.get("page")).toBe("1");
		expect(new URL(body.next).searchParams.get("page")).toBe("3");
		expect(new URL(body.next).searchParams.get("searchTerm")).toBe("Test");
	});

	it("returns empty lists and no next page when the repository finds no articles", async () => {
		repo.getAllArticlesByProjectId.mockResolvedValue([{ total: 0, articles: [] }]);
		const response = await app.request("/cms/articles/all/2");
		expect(await response.json()).toMatchObject({
			articles: [],
			totalResults: 0,
			prev: null,
			next: null,
		});
	});

	it.each(["/cms/articles/invalid", "/cms/articles/all/invalid"])(
		"rejects invalid IDs at %s before querying",
		async (path) => {
			expect((await app.request(path)).status).toBe(400);
			expect(repo.getArticleById).not.toHaveBeenCalled();
			expect(repo.getAllArticlesByProjectId).not.toHaveBeenCalled();
		},
	);

	it("updates an article and reports the number of changed rows", async () => {
		const response = await updateArticle({
			...articleBody,
			cover_alt: "Cover",
			citation: "Citation",
		});
		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ updatedRows: 1 });
		expect(repo.updateArticleById).toHaveBeenCalledExactlyOnceWith(7, {
			title: articleBody.title,
			alias: articleBody.alias,
			cover_alt: "Cover",
			creator_id: testUser.id,
			abstract: "Abstract",
			content: "Content",
			post_type_id: 3,
			post_status: "Draft",
			lang: "en",
			publishedAt: null,
			updatedAt: expect.any(Date),
			bibliography: [],
			citation: "Citation",
		});
		expect(repo.deleteBibliographyFromArticleByArticleId).toHaveBeenCalledExactlyOnceWith(7);
	});

	it.each([
		{},
		{ ...articleBody, title: "tiny" },
		{ ...articleBody, alias: "tiny" },
		{ ...articleBody, authors: ["invalid"] },
		{ ...articleBody, bibliography: [1] },
	])("rejects an invalid edit body %# before updating", async (body) => {
		expect((await updateArticle(body)).status).toBe(400);
		expect(repo.updateArticleById).not.toHaveBeenCalled();
	});

	it.each([
		[{ ...articleBody, status: "invalid" }, "Invalid status provided"],
		[{ ...articleBody, lang: "invalid" }, "Invalid language provided"],
	])("rejects invalid edit enums %#", async (body, message) => {
		const response = await updateArticle(body);
		expect(response.status).toBe(400);
		expect(await response.json()).toBe(message);
		expect(repo.updateArticleById).not.toHaveBeenCalled();
	});

	it("rejects an unknown category before updating", async () => {
		repo.getPostTypeIdsByName.mockResolvedValue(undefined);
		const response = await updateArticle();
		expect(response.status).toBe(400);
		expect(await response.json()).toBe("No post type found");
		expect(repo.updateArticleById).not.toHaveBeenCalled();
	});

	it("rejects an invalid article ID before updating", async () => {
		expect((await updateArticle(articleBody, "invalid")).status).toBe(400);
		expect(repo.getArticleById).not.toHaveBeenCalled();
		expect(repo.updateArticleById).not.toHaveBeenCalled();
	});

	it("returns 404 when editing a missing article", async () => {
		repo.getArticleById.mockResolvedValue(undefined);
		const response = await updateArticle();
		expect(response.status).toBe(404);
		expect(await response.json()).toBe("Article not found");
		expect(repo.updateArticleById).not.toHaveBeenCalled();
	});

	it.each([1, 2])("replaces linked authors with %i supplied author(s)", async (count) => {
		const authors = [10, 11].slice(0, count);
		expect((await updateArticle({ ...articleBody, authors })).status).toBe(201);
		expect(repo.deleteAuthorsFromArticleByArticleId).toHaveBeenCalledExactlyOnceWith(7);
		expect(repo.linkAuthorsToPost).toHaveBeenCalledExactlyOnceWith(7, authors);
	});

	it("reports author linking failures", async () => {
		repo.linkAuthorsToPost.mockRejectedValue(new Error("Missing author"));
		const response = await updateArticle({ ...articleBody, authors: [10] });
		expect(response.status).toBe(500);
		expect(await response.json()).toContain("Error while updating author");
	});

	it("creates missing bibliography entries and links both new and existing entries", async () => {
		repo.checkBibliographyExists.mockResolvedValue([{ id: 10, name_bibliography: "EXISTING" }]);
		const response = await updateArticle({ ...articleBody, bibliography: ["EXISTING", "NEW"] });
		expect(response.status).toBe(201);
		expect(repo.checkBibliographyExists).toHaveBeenCalledExactlyOnceWith(["EXISTING", "NEW"]);
		expect(repo.insertNewBibliography).toHaveBeenCalledExactlyOnceWith(["NEW"]);
		expect(repo.insertNewBibliographyPost).toHaveBeenCalledExactlyOnceWith([10, 11], 7);
	});

	it("reuses existing bibliography entries without creating duplicates", async () => {
		repo.checkBibliographyExists.mockResolvedValue([{ id: 10, name_bibliography: "EXISTING" }]);
		expect((await updateArticle({ ...articleBody, bibliography: ["EXISTING"] })).status).toBe(201);
		expect(repo.insertNewBibliography).not.toHaveBeenCalled();
		expect(repo.insertNewBibliographyPost).toHaveBeenCalledExactlyOnceWith([10], 7);
	});

	it("removes bibliography links when the edited list is empty", async () => {
		expect((await updateArticle({ ...articleBody, bibliography: [] })).status).toBe(201);
		expect(repo.deleteBibliographyFromArticleByArticleId).toHaveBeenCalledExactlyOnceWith(7);
		expect(repo.insertNewBibliographyPost).not.toHaveBeenCalled();
	});

	it("replaces the linked phenomenon", async () => {
		expect((await updateArticle({ ...articleBody, phenomenonId: 4 })).status).toBe(201);
		expect(repo.deleteLinkedPhenomenonFromArticleByArticleId).toHaveBeenCalledExactlyOnceWith(7);
		expect(repo.linkArticleToPhenomenon).toHaveBeenCalledExactlyOnceWith(7, [4]);
	});

	it("reports phenomenon linking failures", async () => {
		repo.linkArticleToPhenomenon.mockRejectedValue(new Error("Missing phenomenon"));
		const response = await updateArticle({ ...articleBody, phenomenonId: 4 });
		expect(response.status).toBe(500);
		expect(await response.json()).toContain("Error while linking phenomenon");
	});

	it("sets the publication date when a draft is published", async () => {
		const before = Date.now();
		expect((await updateArticle({ ...articleBody, status: "Published" })).status).toBe(201);
		const date = repo.updateArticleById.mock.calls[0]?.[1].publishedAt;
		expect(date).toBeInstanceOf(Date);
		expect(date.getTime()).toBeGreaterThanOrEqual(before);
		expect(date.getTime()).toBeLessThanOrEqual(Date.now());
	});

	it("preserves the publication date when an already published article is edited", async () => {
		const publishedAt = new Date("2025-01-01");
		repo.getArticleById.mockResolvedValue({
			...article,
			post_status: "Published",
			published_at: publishedAt,
		});
		expect((await updateArticle({ ...articleBody, status: "Published" })).status).toBe(201);
		expect(repo.updateArticleById.mock.calls[0]?.[1].publishedAt).toEqual(publishedAt);
	});

	it("deletes an article and its cover", async () => {
		repo.getCoverById.mockResolvedValue({ cover: "s3://bucket/cover.webp" });
		const response = await app.request("/cms/articles/7", { method: "DELETE" });
		expect(response.status).toBe(200);
		expect(await response.json()).toBe("Article with the ID 7 has been deleted");
		expect(deleteFromS3).toHaveBeenCalledExactlyOnceWith("s3://bucket/cover.webp");
		expect(repo.deleteArticleById).toHaveBeenCalledExactlyOnceWith(7);
	});

	it("deletes an article without a cover without calling storage", async () => {
		expect((await app.request("/cms/articles/7", { method: "DELETE" })).status).toBe(200);
		expect(deleteFromS3).not.toHaveBeenCalled();
		expect(repo.deleteArticleById).toHaveBeenCalledExactlyOnceWith(7);
	});

	it("rejects an invalid deletion ID without calling the repository or storage", async () => {
		expect((await app.request("/cms/articles/invalid", { method: "DELETE" })).status).toBe(400);
		expect(repo.deleteArticleById).not.toHaveBeenCalled();
		expect(deleteFromS3).not.toHaveBeenCalled();
	});

	it("returns users and their available roles", async () => {
		userRepo.getAllUsers.mockResolvedValue([testUser]);
		userRepo.getAllUserRoles.mockResolvedValue([{ id: 1, role_name: "editor" }]);
		const response = await app.request("/cms/users/all");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			users: [testUser],
			userRoles: [{ id: 1, role_name: "editor" }],
		});
	});
});
