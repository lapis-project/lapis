import { beforeEach, describe, expect, it, vi } from "vitest";

const repo = vi.hoisted(() => ({
	getAllArticlesByProject: vi.fn(),
	getArticleByAlias: vi.fn(),
	getSitemapArticlesByProject: vi.fn(),
}));
const generateSignedImageUrl = vi.hoisted(() => vi.fn());

vi.mock("@/db/articleRepository.ts", () => repo);
vi.mock("@/service/imageService.ts", () => ({ generateSignedImageUrl }));

const { default: articles } = await import("@/handler/articleHandler.ts");

const article = {
	post_id: 7,
	title: "Test article",
	alias: "test-article",
	cover: "https://example.com/cover.webp",
	authors: [{ firstname: "Test", lastname: "Author" }],
};

describe("Article handler", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		repo.getAllArticlesByProject.mockResolvedValue([{ total: 25, articles: [article] }]);
		repo.getArticleByAlias.mockResolvedValue(article);
		repo.getSitemapArticlesByProject.mockResolvedValue([{ alias: article.alias }]);
		generateSignedImageUrl.mockReturnValue("https://images.example.com/signed.webp");
	});

	it("returns published articles with default pagination and authors", async () => {
		const response = await articles.request("/articles/1");
		expect(response.status).toBe(200);
		expect(repo.getAllArticlesByProject).toHaveBeenCalledExactlyOnceWith(
			1,
			20,
			0,
			"",
			"",
			"Published",
			"",
			undefined,
		);
		expect(await response.json()).toEqual({
			articles: [article],
			totalResults: 25,
			currentPage: "http://localhost/articles/1?page=1&pageSize=20",
			prev: null,
			next: "http://localhost/articles/1?page=2&pageSize=20",
		});
	});

	it("forwards filters and calculates the page offset", async () => {
		const response = await articles.request(
			"/articles/2?page=2&pageSize=5&offset=3&searchTerm=Test&category=commentary&lang=de&sort=variable",
		);
		const body = await response.json();
		expect(response.status).toBe(200);
		expect(repo.getAllArticlesByProject).toHaveBeenCalledExactlyOnceWith(
			2,
			5,
			8,
			"Test",
			"commentary",
			"Published",
			"variable",
			"de",
		);
		expect(new URL(body.prev).searchParams.get("page")).toBe("1");
		expect(new URL(body.next).searchParams.get("page")).toBe("3");
		expect(new URL(body.next).searchParams.get("searchTerm")).toBe("Test");
	});

	it.each([
		["?pageSize=30", 25, null, null],
		["?page=3&pageSize=10", 25, "2", null],
		["?page=10&pageSize=10", 25, null, null],
		["?page=1&pageSize=10", 0, null, null],
	])("calculates pagination for %s", async (query, total, previousPage, nextPage) => {
		repo.getAllArticlesByProject.mockResolvedValue([{ total, articles: [] }]);
		const response = await articles.request(`/articles/1${query}`);
		const body = await response.json();
		expect(response.status).toBe(200);
		expect(body.articles).toEqual([]);
		expect(body.prev === null ? null : new URL(body.prev).searchParams.get("page")).toBe(
			previousPage,
		);
		expect(body.next === null ? null : new URL(body.next).searchParams.get("page")).toBe(nextPage);
	});

	it.each([
		"/articles/invalid",
		"/articles/1?page=invalid",
		"/articles/1?pageSize=invalid",
		"/articles/1?offset=invalid",
		"/articles/1?sort=invalid",
	])("rejects invalid input at %s before querying", async (path) => {
		expect((await articles.request(path)).status).toBe(400);
		expect(repo.getAllArticlesByProject).not.toHaveBeenCalled();
	});

	it.each(["type", "published_date", "variable"])("accepts sorting by %s", async (sort) => {
		expect((await articles.request(`/articles/1?sort=${sort}`)).status).toBe(200);
		expect(repo.getAllArticlesByProject.mock.calls[0]?.[6]).toBe(sort);
	});

	it("signs S3 article covers at teaser width", async () => {
		repo.getAllArticlesByProject.mockResolvedValue([
			{ total: 1, articles: [{ ...article, cover: "s3://bucket/cover.webp" }] },
		]);
		const response = await articles.request("/articles/1");
		expect((await response.json()).articles[0].cover).toBe(
			"https://images.example.com/signed.webp",
		);
		expect(generateSignedImageUrl).toHaveBeenCalledExactlyOnceWith("s3://bucket/cover.webp", 640);
	});

	it("fetches article details by alias without signing an ordinary URL", async () => {
		const response = await articles.request("/detail/test-article");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ article });
		expect(repo.getArticleByAlias).toHaveBeenCalledExactlyOnceWith("test-article");
		expect(generateSignedImageUrl).not.toHaveBeenCalled();
	});

	it("signs S3 covers in article details", async () => {
		repo.getArticleByAlias.mockResolvedValue({ ...article, cover: "s3://bucket/cover.webp" });
		const response = await articles.request("/detail/test-article");
		expect((await response.json()).article.cover).toBe("https://images.example.com/signed.webp");
		expect(generateSignedImageUrl).toHaveBeenCalledExactlyOnceWith("s3://bucket/cover.webp");
	});

	it("rejects a short alias before querying", async () => {
		expect((await articles.request("/detail/abcd")).status).toBe(400);
		expect(repo.getArticleByAlias).not.toHaveBeenCalled();
	});

	it("returns an empty result when an alias does not exist", async () => {
		repo.getArticleByAlias.mockResolvedValue(undefined);
		const response = await articles.request("/detail/missing-article");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({});
	});

	it("returns the project's sitemap entries", async () => {
		const response = await articles.request("/sitemap/2");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([{ alias: article.alias }]);
		expect(repo.getSitemapArticlesByProject).toHaveBeenCalledExactlyOnceWith(2);
	});

	it.each(["0", "-1", "1.5", "invalid", "9007199254740992"])(
		"rejects invalid sitemap project %s",
		async (id) => {
			expect((await articles.request(`/sitemap/${id}`)).status).toBe(400);
			expect(repo.getSitemapArticlesByProject).not.toHaveBeenCalled();
		},
	);
});
