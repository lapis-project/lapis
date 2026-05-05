/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { assert, describe, expect, it, vi } from "vitest";

import questions from "@/handler/questionHandler.ts";

import * as questionRepo from "../src/db/questionRepository.ts";

describe("Question Handler", () => {
	describe("GET /", () => {
		it("should return all data from all surveys of round 1 without projectId with phenomenon 10 (Knöchel/Enkel)", async () => {
			const data = await questions.request("/?surveyId=1&phenomenonId=10");
			expect(data.status).toBe(200);

			const res = await data.json();
			assert.isArray(res);
			expect(res.length).toBeGreaterThan(0);

			const firstPosition = res[0];
			expect(firstPosition).toHaveProperty("place_name", "Wien");
			expect(firstPosition).toHaveProperty("plz");
			expect(typeof firstPosition.lat).toBe("number");

			assert.isArray(firstPosition.informants);
			const firstInformant = firstPosition.informants[0];
			expect(firstInformant).toHaveProperty("age");

			assert.isArray(firstInformant.answers);
			expect(firstInformant.answers[0]).toHaveProperty("phenomenon");
		});
		it("should return a 400 error when surveyId is not a valid number", async () => {
			const data = await questions.request("/?surveyId=1&phenomenonId=10&projectId=test");
			expect(data.status).toBe(400);
		});
		it("Should return all questions of phenomenonId 10 even if no surveyId is provided", async () => {
			const data = await questions.request("/?phenomenonId=10");
			expect(data.status).toBe(200);

			const res = await data.json();
			assert.isArray(res);
			expect(res.length).toBeGreaterThan(0);
		});
		it("Should return all questions of phenomenonId 10 and project 1 even if no surveyId is provided", async () => {
			const data = await questions.request("/?phenomenonId=10&projectId=1");
			expect(data.status).toBe(200);

			const res = await data.json();
			assert.isArray(res);
			expect(res.length).toBeGreaterThan(0);
		});
		it("should return 500 is the database query fails", async () => {
			vi.spyOn(questionRepo, "getAllPhenomenonById").mockRejectedValueOnce(
				new Error("Simulated DB failure"),
			);

			const data = await questions.request("/?surveyId=1&phenomenonId=10");
			expect(data.status).toBe(500);

			const body = await data.json();
			expect(body.error).toBe("Failed to fetch questions");
		});
	});
});
