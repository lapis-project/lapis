/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import bibliography from "@/handler/bibHandler.ts";

import * as bibRepo from "../src/db/bibRepository.ts";
import { db } from "../src/db/connect.ts";

const MOCK_KEYS = ["TEST_BIB_1", "TEST_BIB_2", "TEST_BIB_3"];

const mockEntries = [
	{
		name_bibliography: MOCK_KEYS[0],
		title: "Test Book 1",
		data: JSON.stringify({ itemType: "book" }),
	},
	{
		name_bibliography: MOCK_KEYS[1],
		title: "Test Article 2",
		data: JSON.stringify({ itemType: "journalArticle" }),
	},
	{
		name_bibliography: MOCK_KEYS[2],
		title: "Test Thesis 3",
		data: JSON.stringify({ itemType: "thesis" }),
	},
];

describe("Bibliography Handler", () => {
	// Setup: Insert mock data before running any tests in this block
	beforeAll(async () => {
		await db
			.insertInto("bibliography")
			.values(mockEntries)
			.onConflict((oc) => oc.column("name_bibliography").doNothing())
			.execute();
	});

	// Teardown: Remove mock data after all tests have completed
	afterAll(async () => {
		await db.deleteFrom("bibliography").where("name_bibliography", "in", MOCK_KEYS).execute();
	});

	describe("GET /", () => {
		it("should return paginated results with default parameters", async () => {
			const res = await bibliography.request("/");
			expect(res.status).toBe(200);

			const body = await res.json();
			expect(body).toHaveProperty("data");
			expect(body.page).toBe(1);
			expect(body.pageSize).toBe(50);
			expect(body.currentUrl).toContain("page=1");
			expect(body.prevUrl).toBeNull();
		});

		it("should respect custom page and pageSize parameters", async () => {
			const res = await bibliography.request("/?page=2&pageSize=1");
			expect(res.status).toBe(200);

			const body = await res.json();
			expect(body.page).toBe(2);
			expect(body.pageSize).toBe(1);
			expect(body.prevUrl).toContain("page=1");
			expect(body.currentUrl).toContain("page=2");
		});

		it("should return page with empty prev and next parameters with page 1 and pageSize 300", async () => {
			const res = await bibliography.request("/?page=1&pageSize=300");
			expect(res.status).toBe(200);

			const body = await res.json();
			expect(body.page).toBe(1);
			expect(body.pageSize).toBe(300);
			expect(body.currentUrl).toContain("page=1");
			expect(body.prevUrl).toBeNull();
			expect(body.nextUrl).toBeNull();
		});

		it("should return 500 if the database query fails", async () => {
			// Mock the repository to simulate a database failure for exactly one call
			vi.spyOn(bibRepo, "getPaginatedBibliography").mockRejectedValueOnce(
				new Error("Simulated DB failure"),
			);

			const res = await bibliography.request("/");
			expect(res.status).toBe(500);

			const body = await res.json();
			expect(body.error).toBe("Failed to fetch bibliography");
		});
	});

	describe("GET /single", () => {
		it("should fetch a single entry by valid bib_id", async () => {
			const res = await bibliography.request(`/single?bib_id=${String(MOCK_KEYS[0])}`);
			expect(res.status).toBe(200);

			const body = await res.json();
			expect(body).toBeDefined();
		});

		it("should fail validation and return 400 if bib_id is omitted", async () => {
			const res = await bibliography.request("/single");
			expect(res.status).toBe(400);
		});

		it("should return 500 if fetching a single entry fails", async () => {
			vi.spyOn(bibRepo, "getSingleBibliographyEntry").mockRejectedValueOnce(
				new Error("Simulated DB failure"),
			);

			const res = await bibliography.request(`/single?bib_id=${String(MOCK_KEYS[0])}`);
			expect(res.status).toBe(500);

			const body = await res.json();
			expect(body.error).toBe("Failed to fetch bibliography");
		});
	});
});
