import { beforeEach, describe, expect, it, vi } from "vitest";

const getAllTranscripts = vi.fn(() => Promise.resolve([]));

vi.mock("@/db/corpusRepository.ts", () => ({
	getAllLocationsByProject: vi.fn(() => Promise.resolve([])),
	getAllTranscripts,
	getFilterInformation: vi.fn(() => Promise.resolve([])),
	transcriptDetailView: vi.fn(() => Promise.resolve([])),
}));

const { default: corpus } = await import("@/handler/corpusHandler.ts");

describe("Corpus Handler", () => {
	beforeEach(() => {
		getAllTranscripts.mockClear();
	});

	it("passes repeated settings and projects query parameters to the repository", async () => {
		const response = await corpus.request(
			"/corpus/2?settings=Interview&settings=Questionnaire&projects=Project%20A&projects=Project%20B",
		);

		expect(response.status).toBe(200);
		expect(getAllTranscripts).toHaveBeenCalledWith(2, {
			settings: ["Interview", "Questionnaire"],
			projects: ["Project A", "Project B"],
		});
	});

	it("omits settings and projects filters when they are not provided", async () => {
		const response = await corpus.request("/corpus/2");

		expect(response.status).toBe(200);
		expect(getAllTranscripts).toHaveBeenCalledWith(2, {});
	});
});
