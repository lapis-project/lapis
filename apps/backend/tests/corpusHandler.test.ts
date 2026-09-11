import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TranscriptMatchesResult } from "@/search/transcriptMatches.ts";

interface SearchMetadata {
	projects: Array<{ id: number; project_name: string | null; main_project_id: number | null }>;
	settings: Array<{ id: number; survey_type_name: string | null }>;
	locations: Array<{ id: number; place_name: string | null }>;
}

const getAllTranscripts = vi.fn<
	(
		_projectId: number,
		_filters?: Record<string, unknown>,
	) => Promise<Array<{ instance_id: number }>>
>(() => Promise.resolve([]));
const getCorpusSearchMetadata = vi.fn<
	(
		_projectIds: Array<number>,
		_settingIds: Array<number>,
		_locationIds: Array<number>,
	) => Promise<SearchMetadata>
>(() =>
	Promise.resolve<SearchMetadata>({
		projects: [{ id: 2, project_name: "DiÖ", main_project_id: null }],
		settings: [],
		locations: [],
	}),
);
const requestTranscriptMatches = vi.fn<(_cql: string) => Promise<TranscriptMatchesResult>>();

const searchRequest = vi.fn<
	(
		_cql: string,
		_fromp: string,
		_path: string,
		_refs: string,
		_pagesize: string,
		_format?: "json" | "xml",
		_method?: "GET" | "POST",
	) => Promise<Response>
>(() => Promise.resolve(new Response(JSON.stringify({ Lines: [] }))));

vi.mock("@/db/corpusRepository.ts", () => ({
	getAllLocationsByProject: vi.fn(() => Promise.resolve([])),
	getAllTranscripts,
	getCorpusSearchMetadata,
	getFilterInformation: vi.fn(() => Promise.resolve([])),
	transcriptDetailView: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/search/index.ts", () => ({ searchRequest }));
vi.mock("@/search/transcriptMatches.ts", () => ({ requestTranscriptMatches }));

const { default: corpus } = await import("@/handler/corpusHandler.ts");

describe("Corpus Handler", () => {
	beforeEach(() => {
		getAllTranscripts.mockReset();
		getAllTranscripts.mockResolvedValue([]);
		getCorpusSearchMetadata.mockReset();
		getCorpusSearchMetadata.mockResolvedValue({
			projects: [{ id: 2, project_name: "DiÖ", main_project_id: null }],
			settings: [],
			locations: [],
		});
		requestTranscriptMatches.mockReset();
		requestTranscriptMatches.mockResolvedValue({ data: new Map([[7, 5]]), error: null });
		searchRequest.mockReset();
		searchRequest.mockResolvedValue(new Response(JSON.stringify({ Lines: [] })));
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

	it("returns transcripts only without contacting NoSketch Engine", async () => {
		getAllTranscripts.mockResolvedValue([{ instance_id: 42 }]);

		const response = await corpus.request("/search/2?transcript_name=test");

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			transcripts: [{ instance_id: 42 }],
			kwic: null,
			matchesByTranscript: {},
			xml: null,
			transcriptMatchesComplete: true,
			errors: { kwic: null, xml: null, transcriptMatches: null },
		});
		expect(searchRequest).not.toHaveBeenCalled();
		expect(getAllTranscripts).toHaveBeenCalledWith(
			2,
			expect.objectContaining({ transcript_name: "test" }),
		);
	});

	it("keeps database-only filters out of CQL", async () => {
		getAllTranscripts.mockResolvedValue([{ instance_id: 17 }]);
		const response = await corpus.request(
			"/search/2?word=Haus&transcript_name=private-name&comment_search=private-comment" +
				"&comment_search_mode=regex&instance_id=17",
		);
		const cql = searchRequest.mock.calls[0]?.[0];

		expect(response.status).toBe(200);
		expect(cql).not.toContain("private-name");
		expect(cql).not.toContain("private-comment");
		expect(getAllTranscripts).toHaveBeenCalledWith(2, {
			transcript_name: "private-name",
			comment_search: "private-comment",
			comment_search_mode: "regex",
			instance_id: 17,
		});
	});

	it("returns transcripts, KWIC, and XML with identical NoSketch pagination", async () => {
		getAllTranscripts.mockResolvedValue([{ instance_id: 7 }]);
		searchRequest.mockImplementation((_cql, _fromp, _path, _refs, _pagesize, format) =>
			Promise.resolve(
				format === "xml"
					? new Response("<concordance />", {
							headers: { "content-disposition": 'attachment; filename="hits.xml"' },
						})
					: new Response(
							JSON.stringify({
								Lines: [
									{
										Refs: ["transcript_7"],
										Left: [],
										Kwic: [],
										Right: [],
									},
								],
							}),
						),
			),
		);

		const response = await corpus.request(
			"/search/2?word=Haus&fromp=3&pagesize=25&refs=doc.id%2Cu.who",
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual({
			transcripts: [{ instance_id: 7 }],
			kwic: {
				Lines: [{ Refs: ["transcript_7"], Left: [], Kwic: [], Right: [] }],
			},
			matchesByTranscript: {
				"7": {
					transcript: { instance_id: 7 },
					hitCount: 5,
					lines: [{ Refs: ["transcript_7"], Left: [], Kwic: [], Right: [] }],
					xmlHits: [],
				},
			},
			xml: {
				content: "<concordance />",
				contentType: "application/xml",
				filename: "hits.xml",
			},
			transcriptMatchesComplete: true,
			errors: { kwic: null, xml: null, transcriptMatches: null },
		});
		expect(searchRequest).toHaveBeenCalledTimes(2);
		const [jsonCall, xmlCall] = searchRequest.mock.calls;
		expect(jsonCall?.slice(0, 5)).toEqual(xmlCall?.slice(0, 5));
		expect(jsonCall?.slice(1)).toEqual(["3", "concordance", "doc.id,u.who", "25", "json", "POST"]);
		expect(xmlCall?.[5]).toBe("xml");
	});

	it("groups current-page KWIC and XML hits and retains missing database metadata", async () => {
		requestTranscriptMatches.mockResolvedValue({
			data: new Map([
				[7, 5],
				[8, 2],
			]),
			error: null,
		});
		getAllTranscripts.mockResolvedValue([{ instance_id: 7 }]);
		const firstXmlHit =
			'<line refs="doc.id=transcript_7,u.who=spk_1" num="0"><kwic>Haus</kwic></line>';
		const secondXmlHit =
			'<line refs="doc.id=transcript_8,u.who=spk_2" num="1"><kwic>gehen</kwic></line>';
		const xml = `<export><concordance>${firstXmlHit}${secondXmlHit}</concordance></export>`;
		searchRequest.mockImplementation((_cql, _fromp, _path, _refs, _pagesize, format) =>
			Promise.resolve(
				format === "xml"
					? new Response(xml)
					: new Response(
							JSON.stringify({
								Lines: [
									{ toknum: 1, Refs: ["transcript_7"] },
									{ toknum: 2, Tbl_refs: ['<a href="#transcript_7">hit</a>'] },
									{ toknum: 3, Refs: ["transcript_8"] },
									{ toknum: 4, Refs: ["no transcript reference"] },
								],
							}),
						),
			),
		);

		const response = await corpus.request("/search/2?word=Haus&refs=u.who");
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.matchesByTranscript).toEqual({
			"7": {
				transcript: { instance_id: 7 },
				hitCount: 5,
				lines: [
					{ toknum: 1, Refs: ["transcript_7"] },
					{ toknum: 2, Tbl_refs: ['<a href="#transcript_7">hit</a>'] },
				],
				xmlHits: [
					{
						refs: "doc.id=transcript_7,u.who=spk_1",
						content: firstXmlHit,
					},
				],
			},
			"8": {
				transcript: null,
				hitCount: 2,
				lines: [{ toknum: 3, Refs: ["transcript_8"] }],
				xmlHits: [
					{
						refs: "doc.id=transcript_8,u.who=spk_2",
						content: secondXmlHit,
					},
				],
			},
		});
		expect(searchRequest).toHaveBeenNthCalledWith(
			1,
			expect.any(String),
			"1",
			"concordance",
			"doc.id,u.who",
			"50",
			"json",
			"POST",
		);
		expect(searchRequest).toHaveBeenNthCalledWith(
			2,
			expect.any(String),
			"1",
			"concordance",
			"doc.id,u.who",
			"50",
			"xml",
			"POST",
		);
	});

	it("maps numeric metadata and demographic filters into CQL", async () => {
		getAllTranscripts.mockResolvedValue([{ instance_id: 7 }]);
		getCorpusSearchMetadata.mockResolvedValue({
			projects: [
				{ id: 2, project_name: "DiÖ", main_project_id: null },
				{ id: 3, project_name: "PP01", main_project_id: 2 },
			],
			settings: [{ id: 7, survey_type_name: "Interview" }],
			locations: [{ id: 9, place_name: "Wien" }],
		});

		const response = await corpus.request(
			"/search/2?lemma=gehen&projects=3&settings=7&locations=9&gender=m%C3%A4nnlich" +
				"&age_lower=18&age_upper=35&dialect_competence=-1&standard_competence=0",
		);
		const cql = searchRequest.mock.calls[0]?.[0] as string;

		expect(response.status).toBe(200);
		expect(cql).toContain('subproject="PP01"');
		expect(cql).toContain('erhebungsart="Interview"');
		expect(cql).toContain('location=".*Wien.*"');
		expect(cql).toContain('sex="male"');
		expect(cql).toContain('age_lower >= "18"');
		expect(cql).toContain('age_upper <= "35"');
		expect(cql).toContain('dialect_competence="UNK"');
		expect(cql).toContain('standard_competence="0"');
	});

	it("scopes a child route to its PP project while root project 2 stays unscoped", async () => {
		getAllTranscripts.mockResolvedValue([{ instance_id: 7 }]);
		getCorpusSearchMetadata.mockResolvedValueOnce({
			projects: [{ id: 3, project_name: "PP01", main_project_id: 2 }],
			settings: [],
			locations: [],
		});

		const childResponse = await corpus.request("/search/3?word=Haus");
		expect(childResponse.status).toBe(200);
		expect(searchRequest.mock.calls[0]?.[0]).toContain('subproject="PP01"');

		searchRequest.mockClear();
		getAllTranscripts.mockClear();
		const rootResponse = await corpus.request("/search/2?word=Haus&projects=2");
		expect(rootResponse.status).toBe(200);
		expect(searchRequest.mock.calls[0]?.[0]).not.toContain("subproject");
		expect(getAllTranscripts).toHaveBeenCalledWith(2, {});
	});

	it.each([
		{
			name: "unknown route",
			url: "/search/99?word=Haus",
			metadata: { projects: [], settings: [], locations: [] },
		},
		{
			name: "project outside DiÖ",
			url: "/search/8?word=Haus",
			metadata: {
				projects: [{ id: 8, project_name: "Other", main_project_id: null }],
				settings: [],
				locations: [],
			},
		},
		{
			name: "selection outside child scope",
			url: "/search/3?word=Haus&projects=4",
			metadata: {
				projects: [
					{ id: 3, project_name: "PP01", main_project_id: 2 },
					{ id: 4, project_name: "PP02", main_project_id: 2 },
				],
				settings: [],
				locations: [],
			},
		},
		{
			name: "unknown selected project",
			url: "/search/2?word=Haus&projects=99",
			metadata: {
				projects: [{ id: 2, project_name: "DiÖ", main_project_id: null }],
				settings: [],
				locations: [],
			},
		},
	])("rejects $name", async ({ url, metadata }) => {
		getCorpusSearchMetadata.mockResolvedValue(metadata);
		const response = await corpus.request(url);

		expect(response.status).toBe(400);
		expect(searchRequest).not.toHaveBeenCalled();
		expect(getAllTranscripts).not.toHaveBeenCalled();
	});

	it.each([{ parameter: "settings" }, { parameter: "locations" }])(
		"rejects an unknown $parameter id",
		async ({ parameter }) => {
			const response = await corpus.request(`/search/2?word=Haus&${parameter}=99`);

			expect(response.status).toBe(400);
			expect(searchRequest).not.toHaveBeenCalled();
			expect(getAllTranscripts).not.toHaveBeenCalled();
		},
	);

	it("keeps XML when the JSON upstream fails", async () => {
		searchRequest.mockImplementation((_cql, _fromp, _path, _refs, _pagesize, format) =>
			Promise.resolve(
				format === "json"
					? new Response("failure", { status: 503, statusText: "Unavailable" })
					: new Response("<ok />"),
			),
		);

		const response = await corpus.request("/search/2?word=Haus");
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.kwic).toBeNull();
		expect(body.xml.content).toBe("<ok />");
		expect(body.errors.kwic).toEqual({ status: 503, message: "Unavailable" });
		expect(body.errors.xml).toBeNull();
	});

	it("keeps JSON when XML has a network failure", async () => {
		searchRequest.mockImplementation((_cql, _fromp, _path, _refs, _pagesize, format) =>
			format === "xml"
				? Promise.reject(new Error("network down"))
				: Promise.resolve(new Response(JSON.stringify({ Lines: [] }))),
		);

		const response = await corpus.request("/search/2?word=Haus");
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.kwic).toEqual({ Lines: [] });
		expect(body.xml).toBeNull();
		expect(body.errors.xml).toEqual({ status: null, message: "network down" });
	});

	it("keeps JSON when the XML upstream returns an HTTP error", async () => {
		searchRequest.mockImplementation((_cql, _fromp, _path, _refs, _pagesize, format) =>
			Promise.resolve(
				format === "xml"
					? new Response("failure", { status: 502, statusText: "Bad Gateway" })
					: new Response(JSON.stringify({ Lines: [] })),
			),
		);

		const response = await corpus.request("/search/2?word=Haus");
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.kwic).toEqual({ Lines: [] });
		expect(body.xml).toBeNull();
		expect(body.errors.xml).toEqual({ status: 502, message: "Bad Gateway" });
	});

	it("keeps XML when JSON has a network failure", async () => {
		searchRequest.mockImplementation((_cql, _fromp, _path, _refs, _pagesize, format) =>
			format === "json"
				? Promise.reject(new Error("JSON network down"))
				: Promise.resolve(new Response("<ok />")),
		);

		const response = await corpus.request("/search/2?word=Haus");
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.kwic).toBeNull();
		expect(body.xml.content).toBe("<ok />");
		expect(body.errors.kwic).toEqual({ status: null, message: "JSON network down" });
	});

	it("reports malformed JSON independently", async () => {
		searchRequest.mockImplementation((_cql, _fromp, _path, _refs, _pagesize, format) =>
			Promise.resolve(format === "json" ? new Response("not-json") : new Response("<ok />")),
		);

		const response = await corpus.request("/search/2?word=Haus");
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.kwic).toBeNull();
		expect(body.xml.content).toBe("<ok />");
		expect(body.errors.kwic.status).toBeNull();
	});

	it("reports malformed XML independently and keeps KWIC", async () => {
		searchRequest.mockImplementation((_cql, _fromp, _path, _refs, _pagesize, format) =>
			Promise.resolve(
				format === "xml"
					? new Response("<export><concordance>")
					: new Response(JSON.stringify({ Lines: [] })),
			),
		);

		const response = await corpus.request("/search/2?word=Haus");
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.kwic).toEqual({ Lines: [] });
		expect(body.xml).toBeNull();
		expect(body.matchesByTranscript["7"].hitCount).toBe(5);
		expect(body.errors.xml.status).toBeNull();
		expect(body.errors.xml.message).toContain("Invalid NoSketch XML");
	});

	it("starts all NoSketch requests before fetching lexical-only transcripts", async () => {
		let resolveMatches!: (value: TranscriptMatchesResult) => void;
		requestTranscriptMatches.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveMatches = resolve;
				}),
		);
		const responsePromise = corpus.request("/search/2?word=Haus");
		await vi.waitFor(() => expect(searchRequest).toHaveBeenCalledTimes(2));
		expect(requestTranscriptMatches).toHaveBeenCalledTimes(1);
		expect(getAllTranscripts).not.toHaveBeenCalled();
		resolveMatches({
			data: new Map([
				[7, 5],
				[8, 2],
			]),
			error: null,
		});
		expect((await responsePromise).status).toBe(200);
		expect(getAllTranscripts).toHaveBeenCalledWith(2, { transcripts: [7, 8] });
	});

	it("waits for database candidates and intersects their IDs with the transcript selection", async () => {
		let resolveTranscripts!: (value: Array<{ instance_id: number }>) => void;
		getAllTranscripts.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveTranscripts = resolve;
				}),
		);
		const responsePromise = corpus.request(
			"/search/2?word=Haus&transcript_name=test&transcript_ids=7&transcript_ids=9",
		);
		await vi.waitFor(() => expect(getAllTranscripts).toHaveBeenCalledTimes(1));
		expect(searchRequest).not.toHaveBeenCalled();
		expect(requestTranscriptMatches).not.toHaveBeenCalled();
		resolveTranscripts([{ instance_id: 7 }, { instance_id: 8 }, { instance_id: 9 }]);
		const response = await responsePromise;
		expect(response.status).toBe(200);
		expect((await response.json()).transcripts).toEqual([{ instance_id: 7 }]);
		const cql = requestTranscriptMatches.mock.calls[0]?.[0];
		expect(cql).toContain('id="transcript_7|transcript_9"');
		for (const call of searchRequest.mock.calls) expect(call[0]).toBe(cql);
		expect(getAllTranscripts).toHaveBeenCalledTimes(1);
	});

	it.each(["1", "2", "999"])(
		"returns the full transcript set on concordance page %s",
		async (page) => {
			getAllTranscripts.mockResolvedValue([{ instance_id: 7 }, { instance_id: 8 }]);
			requestTranscriptMatches.mockResolvedValue({
				data: new Map([
					[7, 16],
					[8, 3],
					[9, 1],
				]),
				error: null,
			});
			searchRequest.mockImplementation((_cql, _fromp, _path, _refs, _pagesize, format) =>
				Promise.resolve(
					new Response(
						format === "xml" ? "<export><concordance /></export>" : JSON.stringify({ Lines: [] }),
					),
				),
			);
			const response = await corpus.request(`/search/2?word=Haus&fromp=${page}&pagesize=1`);
			const body = await response.json();
			expect(body.transcripts).toEqual([{ instance_id: 7 }, { instance_id: 8 }]);
			expect(body.matchesByTranscript).toEqual({
				"7": { transcript: { instance_id: 7 }, hitCount: 16, lines: [], xmlHits: [] },
				"8": { transcript: { instance_id: 8 }, hitCount: 3, lines: [], xmlHits: [] },
				"9": { transcript: null, hitCount: 1, lines: [], xmlHits: [] },
			});
			expect(body.transcriptMatchesComplete).toBe(true);
			expect(getAllTranscripts).toHaveBeenCalledWith(2, { transcripts: [7, 8, 9] });
		},
	);

	it("skips every NoSketch request when the database has no candidates", async () => {
		const response = await corpus.request("/search/2?word=Haus&instance_id=17");
		expect(await response.json()).toEqual({
			transcripts: [],
			kwic: null,
			xml: null,
			matchesByTranscript: {},
			transcriptMatchesComplete: true,
			errors: { kwic: null, xml: null, transcriptMatches: null },
		});
		expect(searchRequest).not.toHaveBeenCalled();
		expect(requestTranscriptMatches).not.toHaveBeenCalled();
	});

	it("uses an empty database restriction for zero lexical matches", async () => {
		requestTranscriptMatches.mockResolvedValue({ data: new Map(), error: null });
		const response = await corpus.request("/search/2?word=missing");
		const body = await response.json();
		expect(body.transcripts).toEqual([]);
		expect(body.matchesByTranscript).toEqual({});
		expect(body.transcriptMatchesComplete).toBe(true);
		expect(getAllTranscripts).toHaveBeenCalledWith(2, { transcripts: [] });
	});

	it.each(["", "&transcript_name=test"])(
		"falls back to both page sources on frequency failure (%s)",
		async (filters) => {
			const error = { status: 503, message: "Frequency unavailable" };
			requestTranscriptMatches.mockResolvedValue({ data: null, error });
			getAllTranscripts.mockResolvedValue([{ instance_id: 7 }, { instance_id: 8 }]);
			searchRequest.mockImplementation((_cql, _fromp, _path, _refs, _pagesize, format) =>
				Promise.resolve(
					new Response(
						format === "xml"
							? '<export><concordance><line refs="transcript_8"><kwic>Haus</kwic></line></concordance></export>'
							: JSON.stringify({ Lines: [{ Refs: ["transcript_7"] }] }),
					),
				),
			);
			const response = await corpus.request(`/search/2?word=Haus${filters}`);
			const body = await response.json();
			expect(response.status).toBe(200);
			expect(body.transcriptMatchesComplete).toBe(false);
			expect(body.errors).toEqual({ kwic: null, xml: null, transcriptMatches: error });
			expect(body.transcripts).toEqual([{ instance_id: 7 }, { instance_id: 8 }]);
			expect(body.matchesByTranscript["7"].hitCount).toBeNull();
			expect(body.matchesByTranscript["8"].hitCount).toBeNull();
			if (!filters) expect(getAllTranscripts).toHaveBeenCalledWith(2, { transcripts: [7, 8] });
		},
	);

	it.each(["projects", "settings", "locations", "transcript_ids"])(
		"rejects invalid numeric %s filters before metadata lookup",
		async (parameter) => {
			for (const value of ["invalid", "-1", "1.5", "9007199254740992"]) {
				const response = await corpus.request(`/search/2?word=Haus&${parameter}=${value}`);
				expect(response.status).toBe(400);
			}
			expect(getCorpusSearchMetadata).not.toHaveBeenCalled();
			expect(getAllTranscripts).not.toHaveBeenCalled();
			expect(requestTranscriptMatches).not.toHaveBeenCalled();
			expect(searchRequest).not.toHaveBeenCalled();
		},
	);

	it("treats null numeric filters as unset", async () => {
		const response = await corpus.request(
			"/search/2?projects=null&settings=null&locations=null&transcript_ids=null",
		);

		expect(response.status).toBe(200);
		expect(getCorpusSearchMetadata).toHaveBeenCalledWith([2], [], []);
		expect(getAllTranscripts).toHaveBeenCalledWith(2, {});
	});

	it("keeps database failures as whole-request failures", async () => {
		getAllTranscripts.mockRejectedValueOnce(new Error("database down"));

		const response = await corpus.request("/search/2?word=Haus");

		expect(response.status).toBe(500);
	});

	it("keeps the legacy KWIC response contract unchanged", async () => {
		searchRequest.mockResolvedValueOnce(new Response(JSON.stringify({ Lines: [{ Kwic: [] }] })));

		const response = await corpus.request("/search/kwic?word=Haus");

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ Lines: [{ Kwic: [] }] });
		expect(searchRequest).toHaveBeenCalledWith(expect.any(String), "1", "concordance", "", "50");
	});
});
