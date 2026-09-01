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

	it("passes repeated location, setting, and project IDs to the repository", async () => {
		const response = await corpus.request(
			"/corpus/2?locations=10&locations=11&settings=20&settings=21&projects=2&projects=3",
		);

		expect(response.status).toBe(200);
		expect(getAllTranscripts).toHaveBeenCalledWith(2, {
			locations: [10, 11],
			settings: [20, 21],
			projects: [2, 3],
		});
	});

	it.each(["locations", "settings", "projects"])(
		"rejects an invalid %s id without querying the repository",
		async (parameter) => {
			const response = await corpus.request(`/corpus/2?${parameter}=1&${parameter}=invalid`);

			expect(response.status).toBe(400);
			expect(getAllTranscripts).not.toHaveBeenCalled();
		},
	);

	it("omits location, setting, and project filters when they are not provided", async () => {
		const response = await corpus.request("/corpus/2");

		expect(response.status).toBe(200);
		expect(getAllTranscripts).toHaveBeenCalledWith(2, {});
	});
});
