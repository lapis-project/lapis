import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTestApp, jsonRequest } from "./testutils.ts";

const repo = vi.hoisted(() => ({
	getAllImpulseImagesForPhen: vi.fn(),
	getAllPhenomenon: vi.fn(),
	getAllPhenomenonById: vi.fn(),
	getAllRegister: vi.fn(),
	getAllSurveys: vi.fn(),
	getAnnotationsByPhaenAndProjectId: vi.fn(),
	getImpulsImageForPhen: vi.fn(),
	getResultsByPhaen: vi.fn(),
}));
const generateSignedImageUrl = vi.hoisted(() => vi.fn());
vi.mock("@/db/questionRepository.ts", () => repo);
vi.mock("@/service/imageService.ts", () => ({ generateSignedImageUrl }));

const { default: questions } = await import("@/handler/questionHandler.ts");
const results = [
	{
		place_name: "Vienna",
		plz: 1010,
		lat: 48.2,
		lon: 16.37,
		informants: [
			{
				age: "18-35",
				gender: "female",
				informant_id: 7,
				answers: [
					{
						phenomenon: "Knöchel",
						annotation: "annotation",
						response: "Enkel",
						variety: "dialect",
					},
				],
			},
		],
	},
];

describe("Question handler", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		repo.getAllPhenomenonById.mockResolvedValue(results);
		repo.getResultsByPhaen.mockResolvedValue([]);
		generateSignedImageUrl.mockReturnValue("https://images.example.com/signed.webp");
	});
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	describe("GET /survey/:project", () => {
		it.each([
			[undefined, "http://localhost:3000"],
			["https://lexat.example.com", "https://lexat.example.com"],
		])("builds article links using frontend URL %s", async (frontendUrl, expectedUrl) => {
			vi.stubEnv("FRONTEND_URL_LEXAT", frontendUrl);
			repo.getAllPhenomenon.mockResolvedValue([
				{ id: 10, post_alias: "test-article" },
				{ id: 11, post_alias: null },
				{ id: 12, post_alias: "" },
			]);
			const response = await questions.request("/survey/2?survey=3");
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual([
				{ id: 10, post_alias: `${expectedUrl}/de/articles/test-article` },
				{ id: 11, post_alias: null },
				{ id: 12, post_alias: "" },
			]);
			expect(repo.getAllPhenomenon).toHaveBeenCalledExactlyOnceWith("2", "3");
		});

		it("allows an omitted survey filter and returns an empty list", async () => {
			repo.getAllPhenomenon.mockResolvedValue([]);
			const response = await questions.request("/survey/2");
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual([]);
			expect(repo.getAllPhenomenon).toHaveBeenCalledExactlyOnceWith("2", undefined);
		});
	});

	describe("map routes", () => {
		const map = {
			project: "1",
			version: "1",
			question: "10",
			registerCategory: "dialect",
			registerDescription: "Dialect responses",
			variants: ["Enkel"],
			colors: ["#123456"],
		};

		it("accepts a valid map", async () => {
			const response = await questions.request("/map", jsonRequest("POST", map));
			expect(response.status).toBe(201);
			expect(await response.json()).toBe("OK");
		});

		it.each([{}, { ...map, project: 1 }, { ...map, variants: [1] }, { ...map, colors: "red" }])(
			"rejects an invalid map %j",
			async (body) => {
				const response = await questions.request("/map", jsonRequest("POST", body));
				expect(response.status).toBe(400);
				expect(await response.json()).toMatchObject({ success: false });
			},
		);

		it("returns the map endpoint acknowledgement", async () => {
			const response = await questions.request("/map/1");
			expect(response.status).toBe(201);
			expect(await response.json()).toBe("OK");
		});
	});

	describe("GET /responses", () => {
		const search = {
			searchTerm: "Enkel",
			project: "1",
			sortBy: { field: "response", order: "asc" },
			page: 1,
			offset: 0,
			pageSize: 10,
		};

		it.each([
			[search, 201],
			[{}, 400],
			[{ ...search, page: "1" }, 400],
			[{ ...search, sortBy: { field: "response" } }, 400],
		])("validates the search body %j", async (body, status) => {
			// The route expects a GET body, which the Fetch Request constructor rejects.
			const request = new Request("http://localhost/responses", jsonRequest("POST", body));
			vi.spyOn(request, "method", "get").mockReturnValue("GET");
			const response = await questions.request(request);
			expect(response.status).toBe(status);
			expect(await response.json()).toEqual(
				status === 201 ? "OK" : expect.objectContaining({ success: false }),
			);
		});
	});

	describe("GET /surveys", () => {
		it.each([{ surveys: [] }, { surveys: [{ id: 1, survey_name: "Survey 1", conducted_num: 2 }] }])(
			"returns the available surveys $surveys",
			async ({ surveys }) => {
				repo.getAllSurveys.mockResolvedValue(surveys);
				const response = await questions.request("/surveys");
				expect(response.status).toBe(201);
				expect(await response.json()).toEqual(surveys);
				expect(repo.getAllSurveys).toHaveBeenCalledExactlyOnceWith();
			},
		);
	});

	describe("table survey filtering", () => {
		it.each(["1", "1&surveyIds=2"])(
			"passes survey IDs to the table query: %s",
			async (surveyIds) => {
				const response = await questions.request(
					`/table/11?surveyIds=${surveyIds}&lowerAge=0&upperAge=100`,
				);
				expect(response.status).toBe(200);
				expect(repo.getResultsByPhaen.mock.calls[0]?.[9]).toEqual(surveyIds === "1" ? [1] : [1, 2]);
			},
		);

		it.each(["nope", "0", "-1", "1.5"])(
			"rejects invalid survey ID %s before querying",
			async (id) => {
				expect((await questions.request(`/table/11?surveyIds=${id}`)).status).toBe(400);
				expect(repo.getResultsByPhaen).not.toHaveBeenCalled();
			},
		);
	});

	describe("GET /", () => {
		it.each(["0", "invalid"])("rejects phenomenon ID %s before querying", async (id) => {
			const response = await questions.request(`/?phenomenonId=${id}`);
			expect(response.status).toBe(400);
			expect(await response.json()).toBe("Phenomenon Id is required");
			expect(repo.getAllPhenomenonById).not.toHaveBeenCalled();
		});

		it("requires a phenomenon query parameter", async () => {
			const response = await questions.request("/");
			expect(response.status).toBe(400);
			expect(await response.json()).toMatchObject({ success: false });
			expect(repo.getAllPhenomenonById).not.toHaveBeenCalled();
		});

		it("ignores a survey filter containing an empty value", async () => {
			const response = await questions.request("/?phenomenonId=10&surveyIds=1&surveyIds=");
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual(results);
			expect(repo.getAllPhenomenonById).toHaveBeenCalledExactlyOnceWith(-1, 10, []);
		});

		it("returns nested place, informant and answer data for a survey", async () => {
			const response = await questions.request("/?surveyIds=1&phenomenonId=10");
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual(results);
			expect(repo.getAllPhenomenonById).toHaveBeenCalledExactlyOnceWith(-1, 10, [1]);
		});

		it("forwards repeated survey IDs and a project ID", async () => {
			const response = await questions.request(
				"/?surveyIds=1&surveyIds=2&phenomenonId=10&projectId=1",
			);
			expect(response.status).toBe(200);
			expect(repo.getAllPhenomenonById).toHaveBeenCalledExactlyOnceWith(1, 10, [1, 2]);
		});

		it.each([
			["", -1],
			["&projectId=1", 1],
		])("allows an omitted survey filter %s", async (query, project) => {
			const response = await questions.request(`/?phenomenonId=10${query}`);
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual(results);
			expect(repo.getAllPhenomenonById).toHaveBeenCalledExactlyOnceWith(project, 10, []);
		});

		it("rejects an invalid project ID before querying", async () => {
			expect((await questions.request("/?phenomenonId=10&projectId=invalid")).status).toBe(400);
			expect(repo.getAllPhenomenonById).not.toHaveBeenCalled();
		});

		it("reports a repository failure", async () => {
			repo.getAllPhenomenonById.mockRejectedValueOnce(new Error("Simulated DB failure"));
			const response = await questions.request("/?surveyIds=1&phenomenonId=10");
			expect(response.status).toBe(500);
			expect(await response.json()).toEqual({ error: "Failed to fetch questions" });
		});
	});

	describe("GET /table/:id", () => {
		const tableResponses = [
			{ informant: "7", response: "Enkel", annotation: "annotation", place: "Vienna" },
		];

		it.each([
			["/table/invalid", "Phenomenon id is required"],
			["/table/11?page=invalid", "Provided page number is not a number"],
			["/table/11?offset=invalid", "Provided offset number is not a number"],
			["/table/11?pageSize=invalid", "Provided pagesize number is not a number"],
		])("rejects invalid input at %s before querying", async (path, message) => {
			const response = await questions.request(path);
			expect(response.status).toBe(400);
			expect(await response.json()).toBe(message);
			expect(repo.getResultsByPhaen).not.toHaveBeenCalled();
		});

		it("uses default pagination and returns table responses and the next page", async () => {
			repo.getResultsByPhaen.mockResolvedValue([{ total: "101", post_query: tableResponses }]);
			const response = await questions.request("/table/11?lowerAge=0&upperAge=100");
			expect(response.status).toBe(200);
			expect(repo.getResultsByPhaen).toHaveBeenCalledExactlyOnceWith(
				11,
				100,
				0,
				[],
				[],
				0,
				100,
				"",
				"desc",
				[],
			);
			expect(await response.json()).toEqual({
				prev: null,
				next: "http://localhost/table/11?lowerAge=0&upperAge=100&page=2&pageSize=100",
				responses: tableResponses,
				currentPage: "http://localhost/table/11?lowerAge=0&upperAge=100&page=1&pageSize=100",
				totalResults: 101,
			});
		});

		it("forwards filters and calculates pagination with an additional offset", async () => {
			repo.getResultsByPhaen.mockResolvedValue([{ total: 30, post_query: tableResponses }]);
			const query = new URLSearchParams({
				page: "2",
				pageSize: "5",
				offset: "3",
				lowerAge: "18",
				upperAge: "65",
				orderBy: "anno",
				dir: "asc",
			});
			for (const [key, values] of Object.entries({
				varIds: ["1", "2"],
				annotations: ["dialect", "standard"],
				surveyIds: ["3", "4"],
			})) {
				for (const value of values) query.append(key, value);
			}
			const response = await questions.request(`/table/11?${query}`);
			expect(response.status).toBe(200);
			expect(repo.getResultsByPhaen).toHaveBeenCalledExactlyOnceWith(
				11,
				5,
				8,
				[1, 2],
				["dialect", "standard"],
				18,
				65,
				"annotation_name",
				"asc",
				[3, 4],
			);
			const body = await response.json();
			expect(body.responses).toEqual(tableResponses);
			expect(body.totalResults).toBe(30);
			expect(body.currentPage).toBe(`http://localhost/table/11?${query}`);
			for (const [link, page] of [
				[body.prev, "1"],
				[body.next, "3"],
			]) {
				const expected = new URLSearchParams(query);
				expected.set("page", page);
				expect(new URL(link).searchParams.toString()).toBe(expected.toString());
			}
		});

		it.each([
			["res", "response_text"],
			["anno", "annotation_name"],
			["phen", "phenomenon_name"],
			["var", "variety_name"],
			["place", "place_name"],
			["age", "age_group_name"],
			["infid", "informant.comment"],
			["unknown", ""],
		])("maps sort key %s to %s and defaults to descending", async (key, field) => {
			const response = await questions.request(`/table/11?orderBy=${key}&lowerAge=0&upperAge=100`);
			expect(response.status).toBe(200);
			expect(repo.getResultsByPhaen).toHaveBeenCalledExactlyOnceWith(
				11,
				100,
				0,
				[],
				[],
				0,
				100,
				field,
				"desc",
				[],
			);
		});

		it("ignores variety and annotation filters containing empty values", async () => {
			const response = await questions.request(
				"/table/11?varIds=1&varIds=&annotations=dialect&annotations=&lowerAge=0&upperAge=100",
			);
			expect(response.status).toBe(200);
			expect(repo.getResultsByPhaen).toHaveBeenCalledExactlyOnceWith(
				11,
				100,
				0,
				[],
				[],
				0,
				100,
				"",
				"desc",
				[],
			);
		});

		it.each([
			["?page=1&pageSize=10", 10, null, null],
			["?page=3&pageSize=10", 25, "2", null],
			["?page=10&pageSize=10", 25, null, null],
			["?page=2&pageSize=10", 0, null, null],
			["?page=1", 101, null, "2"],
		])("calculates pagination for %s with %s results", async (query, total, prev, next) => {
			repo.getResultsByPhaen.mockResolvedValue([{ total, post_query: null }]);
			const response = await questions.request(`/table/11${query}`);
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.responses).toEqual([]);
			expect(body.totalResults).toBe(total);
			expect(body.prev === null ? null : new URL(body.prev).searchParams.get("page")).toBe(prev);
			expect(body.next === null ? null : new URL(body.next).searchParams.get("page")).toBe(next);
			expect(new URL(body.currentPage).searchParams.get("pageSize")).toBe(
				new URLSearchParams(query).get("pageSize") ?? "100",
			);
		});

		it("returns an empty response when the repository returns no rows", async () => {
			const response = await questions.request("/table/11");
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({
				prev: null,
				next: null,
				responses: [],
				totalResults: null,
				currentPage: "http://localhost/table/11?page=1&pageSize=100",
			});
		});
	});

	describe("GET /annotation/:project", () => {
		it.each([
			["/annotation/1", "Phenomenon is required"],
			["/annotation/invalid?phenomenon=10", "Project Id is not a number or is negative"],
			["/annotation/-1?phenomenon=10", "Project Id is not a number or is negative"],
			["/annotation/1?phenomenon=invalid", "Phenomenon Id is not a number or is negative"],
			["/annotation/1?phenomenon=-1", "Phenomenon Id is not a number or is negative"],
		])("rejects invalid input at %s before querying", async (path, message) => {
			const response = await questions.request(path);
			expect(response.status).toBe(400);
			expect(await response.json()).toBe(message);
			expect(repo.getAnnotationsByPhaenAndProjectId).not.toHaveBeenCalled();
		});

		it.each([
			{ annotations: [] },
			{ annotations: [{ id: 7, annotation_name: "dialect", description: "Dialect response" }] },
		])("returns annotations $annotations for a project and phenomenon", async ({ annotations }) => {
			repo.getAnnotationsByPhaenAndProjectId.mockResolvedValue(annotations);
			const response = await questions.request("/annotation/2?phenomenon=10");
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual(annotations);
			expect(repo.getAnnotationsByPhaenAndProjectId).toHaveBeenCalledExactlyOnceWith(2, 10);
		});
	});

	describe("GET /variety", () => {
		it("returns hierarchical varieties", async () => {
			const varieties = [
				{
					variety_entry: {
						id: 1,
						variety_name: "dialect",
						children: [{ id: 2, variety_name: "local", children: [] }],
					},
				},
			];
			repo.getAllRegister.mockResolvedValue(varieties);
			const response = await questions.request("/variety");
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual(varieties);
			expect(repo.getAllRegister).toHaveBeenCalledExactlyOnceWith();
		});

		it("reports when no varieties exist", async () => {
			repo.getAllRegister.mockResolvedValue([]);
			const response = await questions.request("/variety");
			expect(response.status).toBe(404);
			expect(await response.json()).toBe("No varieties found");
		});
	});

	describe("GET /phen/all", () => {
		it.each([null, "editor"] as const)("denies access for role %s", async (role) => {
			const app = createTestApp(role).route("/", questions);
			const response = await app.request("/phen/all");
			expect(response.status).toBe(403);
			expect(await response.json()).toBe(role === null ? "Forbidden" : "Forbidden action");
			expect(repo.getAllImpulseImagesForPhen).not.toHaveBeenCalled();
			expect(generateSignedImageUrl).not.toHaveBeenCalled();
		});

		it.each(["admin", "superadmin"] as const)("signs stimulus images for %s", async (role) => {
			repo.getAllImpulseImagesForPhen.mockResolvedValue([
				{ id: 10, phenomenon_name: "Knöchel", stimulus_media: "s3://bucket/image.webp" },
				{ id: 11, phenomenon_name: "Fuß", stimulus_media: null },
			]);
			const app = createTestApp(role).route("/", questions);
			const response = await app.request("/phen/all");
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual([
				{
					id: 10,
					phenomenon_name: "Knöchel",
					stimulus_media: "https://images.example.com/signed.webp",
				},
				{ id: 11, phenomenon_name: "Fuß", stimulus_media: null },
			]);
			expect(repo.getAllImpulseImagesForPhen).toHaveBeenCalledExactlyOnceWith();
			expect(generateSignedImageUrl).toHaveBeenCalledExactlyOnceWith("s3://bucket/image.webp");
		});

		it("returns an empty list when no phenomena have images", async () => {
			repo.getAllImpulseImagesForPhen.mockResolvedValue([]);
			const response = await createTestApp("admin").route("/", questions).request("/phen/all");
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual([]);
			expect(generateSignedImageUrl).not.toHaveBeenCalled();
		});
	});

	describe("GET /phen/:id", () => {
		it("signs a phenomenon stimulus image", async () => {
			repo.getImpulsImageForPhen.mockResolvedValue({
				id: 10,
				phenomenon_name: "Knöchel",
				stimulus_media: "s3://bucket/image.webp",
			});
			const response = await questions.request("/phen/10");
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({
				id: 10,
				phenomenon_name: "Knöchel",
				stimulus_media: "https://images.example.com/signed.webp",
			});
			expect(repo.getImpulsImageForPhen).toHaveBeenCalledExactlyOnceWith(10);
			expect(generateSignedImageUrl).toHaveBeenCalledExactlyOnceWith("s3://bucket/image.webp");
		});

		it("returns a phenomenon without an image without calling the signer", async () => {
			const phenomenon = { id: 10, phenomenon_name: "Knöchel", stimulus_media: null };
			repo.getImpulsImageForPhen.mockResolvedValue(phenomenon);
			const response = await questions.request("/phen/10");
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual(phenomenon);
			expect(repo.getImpulsImageForPhen).toHaveBeenCalledExactlyOnceWith(10);
			expect(generateSignedImageUrl).not.toHaveBeenCalled();
		});

		it("returns an empty body when the phenomenon is not found", async () => {
			repo.getImpulsImageForPhen.mockResolvedValue(undefined);
			const response = await questions.request("/phen/10");
			expect(response.status).toBe(200);
			expect(await response.text()).toBe("");
			expect(repo.getImpulsImageForPhen).toHaveBeenCalledExactlyOnceWith(10);
			expect(generateSignedImageUrl).not.toHaveBeenCalled();
		});
	});
});
