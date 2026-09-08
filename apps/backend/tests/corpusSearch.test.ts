import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { searchRequest } from "@/search/index.ts";
import { requestTranscriptMatches } from "@/search/transcriptMatches.ts";

const fetchMock = vi.fn<typeof fetch>();
const item = (id: number, frq = 1) => ({ Word: [{ n: `transcript_${id}` }], frq });
const page = (items = [item(7)], total = 1, lastpage = 1, concsize = total) => ({
	concsize,
	lastpage,
	Blocks: [{ total, Items: items }],
});
const respond = (body: unknown) => new Response(JSON.stringify(body));

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal("fetch", fetchMock);
	vi.stubEnv("NOSKE_INTERNAL_URL", "https://noske.test/bonito/run.cgi/");
	vi.stubEnv("NOSKE_CORPUS_NAME", "configured-corpus");
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
	vi.useRealTimers();
});

describe("Corpus transcript frequency lookup", () => {
	it("collects more than 1000 transcripts and posts identical CQL on every page", async () => {
		fetchMock.mockResolvedValueOnce(
			respond(
				page(
					Array.from({ length: 1000 }, (_, i) => item(i, 2)),
					1001,
					0,
					2016,
				),
			),
		);
		fetchMock.mockResolvedValueOnce(respond(page([item(1000, 16)], 1001, 1, 2016)));
		const cql = '[lc="kirche"] within <doc id="transcript_181"/>';
		const result = await requestTranscriptMatches(cql);
		expect(result.error).toBeNull();
		expect(result.data?.size).toBe(1001);
		expect(result.data?.get(1000)).toBe(16);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		for (const [index, [url, init]] of fetchMock.mock.calls.entries()) {
			expect(url).toBe("https://noske.test/bonito/run.cgi/freqs");
			expect(init?.method).toBe("POST");
			expect(Object.fromEntries(init?.body as URLSearchParams)).toEqual({
				corpname: "configured-corpus",
				q: `q${cql}`,
				format: "json",
				fcrit: "doc.id 0",
				flimit: "1",
				fmaxitems: "1000",
				fpage: String(index + 1),
			});
			expect(init?.signal).toBe(fetchMock.mock.calls[0]?.[1]?.signal);
		}
	});

	it("accepts the verified zero-result response without a frequency block", async () => {
		fetchMock.mockResolvedValue(respond({ concsize: 0 }));
		expect(await requestTranscriptMatches('[lc="missing"]')).toEqual({
			data: new Map(),
			error: null,
		});
	});

	it("accepts non-negative integer frequencies", async () => {
		fetchMock.mockResolvedValue(respond(page([item(7, 0)], 1, 1, 0)));
		expect((await requestTranscriptMatches("query")).data).toEqual(new Map([[7, 0]]));
	});

	it.each([
		null,
		{},
		{ concsize: 1 },
		{ error: "Query failed", concsize: 0 },
		page([{ Word: [{ n: "prefix_transcript_7" }], frq: 1 }]),
		page([{ Word: [{ n: "transcript_7_suffix" }], frq: 1 }]),
		page([{ Word: [{ n: "transcript_9007199254740992" }], frq: 1 }]),
		page([item(7, -1)]),
		page([item(7, 1.5)]),
		page([item(7)], 2, 1),
		page([item(7)], 1, 0),
		page([item(7)], 1, 1, 2),
		page([item(7)], 1, 2),
		page([], 1, 0),
		page([item(7), item(7)], 2),
		{ concsize: 1, lastpage: 1, Blocks: [{ total: "1", Items: [item(7)] }] },
		{ concsize: 1, lastpage: 1, Blocks: [{ total: 1, Items: null }] },
	])("rejects malformed or incomplete frequency responses: %j", async (body) => {
		fetchMock.mockResolvedValue(respond(body));
		const result = await requestTranscriptMatches("query");
		expect(result.data).toBeNull();
		expect(result.error?.status).toBeNull();
		expect(result.error?.message).toBeTruthy();
	});

	it.each([
		page([item(7)], 2, 1), // Repeated page / duplicate ID.
		page([], 2, 0), // No progress.
		page([item(8)], 3, 1), // Changed total.
		page([item(8)], 2, 1, 3), // Changed concordance size.
		{ concsize: 0 }, // Empty response after a partial page.
	])("discards earlier pages when pagination fails: %j", async (secondPage) => {
		fetchMock.mockResolvedValueOnce(respond(page([item(7)], 2, 0)));
		fetchMock.mockResolvedValueOnce(respond(secondPage));
		const result = await requestTranscriptMatches("query");
		expect(result.data).toBeNull();
		expect(result.error).not.toBeNull();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("discards partial totals on HTTP failure", async () => {
		fetchMock.mockResolvedValueOnce(respond(page([item(7)], 2, 0)));
		fetchMock.mockResolvedValueOnce(
			new Response("failed", { status: 503, statusText: "Unavailable" }),
		);
		expect(await requestTranscriptMatches("query")).toEqual({
			data: null,
			error: { status: 503, message: "Unavailable" },
		});
	});

	it("handles network and JSON parsing failures", async () => {
		fetchMock.mockRejectedValueOnce(new Error("Network down"));
		expect((await requestTranscriptMatches("query")).error?.message).toBe("Network down");
		fetchMock.mockResolvedValueOnce(new Response("not JSON"));
		expect((await requestTranscriptMatches("query")).error).not.toBeNull();
	});

	it("bounds the entire lookup to 30 seconds including response body reads", async () => {
		vi.useFakeTimers();
		fetchMock.mockResolvedValueOnce(respond(page([item(7)], 2, 0)));
		const stalledResponse = new Response();
		vi.spyOn(stalledResponse, "json").mockImplementation(() => new Promise(() => {}));
		fetchMock.mockImplementationOnce(async () => {
			await new Promise((resolve) => setTimeout(resolve, 20_000));
			return stalledResponse;
		});
		const lookup = requestTranscriptMatches("query");
		await vi.advanceTimersByTimeAsync(29_999);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
		await vi.advanceTimersByTimeAsync(1);
		expect(await lookup).toEqual({
			data: null,
			error: { status: null, message: expect.stringContaining("timed out") },
		});
		expect(fetchMock.mock.calls[1]?.[1]?.signal?.aborted).toBe(true);
	});
});

describe("Corpus concordance transport", () => {
	it.each(["json", "xml"] as const)(
		"posts %s concordances using configured corpus and pagination",
		async (format) => {
			fetchMock.mockResolvedValue(new Response());
			const cql = '[lc="kirche"] within <doc id="transcript_181"/>';
			await searchRequest(cql, "3", "concordance", "doc.id,u.who", "25", format, "POST");
			const [url, init] = fetchMock.mock.calls[0]!;
			expect(url).toBe("https://noske.test/bonito/run.cgi/concordance");
			expect(init?.method).toBe("POST");
			expect(Object.fromEntries(init?.body as URLSearchParams)).toEqual({
				corpname: "configured-corpus",
				q: `q${cql}`,
				format,
				pagesize: "25",
				viewmode: "kwic",
				fromp: "3",
				refs: "doc.id,u.who",
			});
		},
	);

	it("retains GET transport for legacy callers", async () => {
		fetchMock.mockResolvedValue(new Response());
		await searchRequest('[lc="kirche"]', "1", "concordance", "", "50");
		const [url, init] = fetchMock.mock.calls[0]!;
		expect(init).toBeUndefined();
		expect(new URL(String(url)).searchParams.get("q")).toBe('q[lc="kirche"]');
	});
});
