import { beforeEach, describe, expect, it, vi } from "vitest";

const repo = vi.hoisted(() => ({
	getPaginatedBibliography: vi.fn(),
	getSingleBibliographyEntry: vi.fn(),
}));
vi.mock("@/db/bibRepository.ts", () => repo);

const { default: bibliography } = await import("@/handler/bibHandler.ts");
const entry = {
	id: 1,
	name_bibliography: "TEST_BIB_1",
	title: "Test book",
	data: { itemType: "book" },
};

describe("Bibliography handler", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		repo.getPaginatedBibliography.mockImplementation(async (page: number, pageSize: number) => ({
			data: [entry],
			totalResults: 3,
			page,
			pageSize,
			totalPages: Math.ceil(3 / pageSize),
		}));
		repo.getSingleBibliographyEntry.mockResolvedValue([entry]);
	});

	it("returns results with default pagination", async () => {
		const response = await bibliography.request("/");
		expect(response.status).toBe(200);
		expect(repo.getPaginatedBibliography).toHaveBeenCalledExactlyOnceWith(1, 50);
		expect(await response.json()).toEqual({
			data: [entry],
			totalResults: 3,
			page: 1,
			pageSize: 50,
			totalPages: 1,
			currentUrl: "http://localhost/?page=1&pageSize=50",
			prevUrl: null,
			nextUrl: null,
		});
	});

	it.each([
		[1, null, "2"],
		[2, "1", "3"],
		[3, "2", null],
	])("calculates pagination links for page %i", async (page, previousPage, nextPage) => {
		const response = await bibliography.request(`/?page=${page}&pageSize=1`);
		const body = await response.json();
		expect(response.status).toBe(200);
		expect(repo.getPaginatedBibliography).toHaveBeenCalledExactlyOnceWith(page, 1);
		expect(body.prevUrl === null ? null : new URL(body.prevUrl).searchParams.get("page")).toBe(
			previousPage,
		);
		expect(body.nextUrl === null ? null : new URL(body.nextUrl).searchParams.get("page")).toBe(
			nextPage,
		);
		expect(new URL(body.currentUrl).searchParams.get("page")).toBe(String(page));
	});

	it("returns no adjacent pages when all entries fit on one page", async () => {
		const response = await bibliography.request("/?page=1&pageSize=300");
		expect(response.status).toBe(200);
		expect(await response.json()).toMatchObject({ pageSize: 300, prevUrl: null, nextUrl: null });
	});

	it("reports a paginated repository failure", async () => {
		repo.getPaginatedBibliography.mockRejectedValueOnce(new Error("Simulated DB failure"));
		const response = await bibliography.request("/");
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: "Failed to fetch bibliography" });
	});

	it("fetches a single bibliography entry by key", async () => {
		const response = await bibliography.request("/single?bib_id=TEST_BIB_1");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([entry]);
		expect(repo.getSingleBibliographyEntry).toHaveBeenCalledExactlyOnceWith("TEST_BIB_1");
	});

	it("rejects a missing bibliography key before querying", async () => {
		expect((await bibliography.request("/single")).status).toBe(400);
		expect(repo.getSingleBibliographyEntry).not.toHaveBeenCalled();
	});

	it("reports a single-entry repository failure", async () => {
		repo.getSingleBibliographyEntry.mockRejectedValueOnce(new Error("Simulated DB failure"));
		const response = await bibliography.request("/single?bib_id=TEST_BIB_1");
		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: "Failed to fetch bibliography" });
	});
});
