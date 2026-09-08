import { describe, expect, it, vi } from "vitest";

const selectFrom = vi.fn(() => {
	throw new Error("Unexpected database query");
});
vi.mock("@/db/connect.ts", () => ({ db: { selectFrom } }));
const { getAllTranscripts } = await import("@/db/corpusRepository.ts");

describe("Corpus repository", () => {
	it("matches nothing for an explicit empty transcript restriction", async () => {
		expect(await getAllTranscripts(2, { transcripts: [] })).toEqual([]);
		expect(selectFrom).not.toHaveBeenCalled();
	});
});
