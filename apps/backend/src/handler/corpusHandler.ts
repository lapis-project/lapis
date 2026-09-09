import { promises as fs } from "node:fs";
import { join } from "node:path";

import { vValidator } from "@hono/valibot-validator";
import { XMLParser } from "fast-xml-parser";
import { SyntaxValidator } from "fast-xml-validator";
import { Hono } from "hono";
import {
	array,
	literal,
	object,
	optional,
	pipe,
	regex,
	safeParse,
	string,
	transform,
	union,
} from "valibot";

import { DATA_DIR } from "@/config/config.ts";
import {
	getAllLocationsByProject,
	getAllTranscripts,
	getCorpusSearchMetadata,
	getFilterInformation,
	transcriptDetailView,
} from "@/db/corpusRepository.ts";
import { restrictedRoute } from "@/lib/authHelper.ts";
import type { AppEnv } from "@/lib/context.ts";
import { buildCql } from "@/lib/cqlHelper.ts";
import { streamFile, validateTranscriptId } from "@/lib/fileStreamHelper.ts";
import { searchRequest } from "@/search/index.ts";
import { type NoSketchError, requestTranscriptMatches } from "@/search/transcriptMatches.ts";
import { resolveAudioFileForInstanceId } from "@/service/audioService.ts";
import type { TranscriptToken } from "@/types/apiTypes.ts";
import type { paths } from "@/types/noske.d.ts";

const SearchQuerySchema = object({
	// Allow 'word' OR 'query' for text input
	word: optional(string()),
	query: optional(string()),

	lemma: optional(string()),
	pos: optional(string()),
	feats: optional(string()),

	mode: optional(union([literal("simple"), literal("regex")]), "simple"),

	fromp: optional(string(), "1"),

	pagesize: optional(string(), "50"),

	refs: optional(string(), ""),

	transcripts: optional(
		pipe(
			array(pipe(string(), regex(/^\d+$/))),
			transform((arr) => arr.map(Number)),
		),
	),

	projects: optional(pipe(array(pipe(string(), regex(/^PP\d{2}$/))))),

	settings: optional(array(string())),

	age_lower: optional(
		pipe(
			string(),
			regex(/^\d+$/),
			transform((num) => Number(num)),
		),
	),

	age_upper: optional(
		pipe(
			string(),
			regex(/^\d+$/),
			transform((num) => Number(num)),
		),
	),

	locations: optional(array(string())),

	first_languages: optional(array(string())),

	dialect_competence: optional(
		pipe(
			string(),
			// Allow optional standard hyphen (-), math minus (\u2212), or en-dash (\u2013) followed by digits
			regex(/^[-\u2212\u2013]?\d+$/),
			transform((num) => {
				const normalizedNum = num.replace(/[\u2212\u2013]/, "-");
				return Number(normalizedNum);
			}),
		),
	),

	standard_competence: optional(
		pipe(
			string(),
			// Allow optional standard hyphen (-), math minus (\u2212), or en-dash (\u2013) followed by digits
			regex(/^[-\u2212\u2013]?\d+$/),
			transform((num) => {
				const normalizedNum = num.replace(/[\u2212\u2013]/, "-");
				return Number(normalizedNum);
			}),
		),
	),

	gender: optional(string()),
});

type RunCgiResponse =
	paths["/search/concordance"]["get"]["responses"]["200"]["content"]["application/json"];
type KwicLine = NonNullable<RunCgiResponse["Lines"]>[number];
type Transcript = Awaited<ReturnType<typeof getAllTranscripts>>[number];
type XmlHit = { refs: string; content: string };

const DIOE_PROJECT_ID = 2;

function parseIdArray(values: Array<string> | undefined): Array<number> | null {
	if (!values?.length) {
		return [];
	}

	const ids: Array<number> = [];
	for (const value of values) {
		if (!/^\d+$/.test(value)) {
			return null;
		}

		const id = Number(value);
		if (!Number.isSafeInteger(id)) {
			return null;
		}
		ids.push(id);
	}

	return ids;
}

function parseDownloadFilename(contentDisposition: string | null): string {
	if (!contentDisposition) {
		return "concordance.xml";
	}

	const encodedMatch = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
	const filenameMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
	let filename = encodedMatch?.[1] ?? filenameMatch?.[1];

	if (!filename) {
		return "concordance.xml";
	}

	try {
		filename = decodeURIComponent(filename);
	} catch {
		// Keep the upstream filename when it is not valid percent-encoded text.
	}

	return filename.split(/[\\/]/).pop() || "concordance.xml";
}

function ensureTranscriptReference(refs: string): string {
	if (!refs) {
		return refs;
	}

	const references = refs
		.split(",")
		.map((reference) => reference.trim())
		.filter(Boolean);
	if (references.some((reference) => reference.replace(/^=/, "") === "doc.id")) {
		return refs;
	}

	return ["doc.id", ...references].join(",");
}

function getTranscriptIdFromReferences(references: Array<string>): number | null {
	for (const reference of references) {
		const match = /(?:^|\W)transcript_(\d+)(?:\W|$)/i.exec(reference);
		if (!match?.[1]) {
			continue;
		}

		const transcriptId = Number(match[1]);
		if (Number.isSafeInteger(transcriptId)) {
			return transcriptId;
		}
	}

	return null;
}

function getTranscriptId(line: KwicLine): number | null {
	return getTranscriptIdFromReferences([...(line.Refs ?? []), ...(line.Tbl_refs ?? [])]);
}

function parseXmlHits(content: string): Array<XmlHit> {
	try {
		if (SyntaxValidator.validate(content) !== true) {
			throw new Error("Invalid NoSketch XML");
		}
	} catch {
		throw new Error("Invalid NoSketch XML");
	}

	const parser = new XMLParser({
		captureMetaData: true,
		ignoreAttributes: false,
		maxNestedTags: 100,
		parseAttributeValue: false,
		parseTagValue: false,
		processEntities: false,
		trimValues: false,
	});
	const parsed = parser.parse(content) as {
		export?: { concordance?: { line?: unknown | Array<unknown> } };
	};
	const lines = parsed.export?.concordance?.line;
	if (lines === undefined) {
		return [];
	}

	const metadataKey = XMLParser.getMetaDataSymbol() as symbol;
	const hits: Array<XmlHit> = [];
	for (const value of Array.isArray(lines) ? lines : [lines]) {
		if (typeof value !== "object" || value === null) {
			continue;
		}

		const line = value as Record<PropertyKey, unknown>;
		const refs = line["@_refs"];
		const metadata = Reflect.get(line, metadataKey);
		if (
			typeof refs !== "string" ||
			typeof metadata !== "object" ||
			metadata === null ||
			!("startIndex" in metadata) ||
			!("endIndex" in metadata) ||
			typeof metadata.startIndex !== "number" ||
			typeof metadata.endIndex !== "number"
		) {
			continue;
		}

		hits.push({
			refs,
			content: content.slice(metadata.startIndex, metadata.endIndex),
		});
	}

	return hits;
}

function groupMatchesByTranscript(
	transcripts: Array<Transcript>,
	kwic: RunCgiResponse | null,
	xmlHits: Array<XmlHit>,
	frequencies: Map<number, number> | null,
): Record<
	string,
	{
		transcript: Transcript | null;
		hitCount: number | null;
		lines: Array<KwicLine>;
		xmlHits: Array<XmlHit>;
	}
> {
	const transcriptById = new Map(
		transcripts.map((transcript) => [transcript.instance_id, transcript]),
	);
	const matches: Record<
		string,
		{
			transcript: Transcript | null;
			hitCount: number | null;
			lines: Array<KwicLine>;
			xmlHits: Array<XmlHit>;
		}
	> = {};
	const getOrCreateMatch = (transcriptId: number) => {
		const key = String(transcriptId);
		const match = matches[key] ?? {
			transcript: transcriptById.get(transcriptId) ?? null,
			hitCount: frequencies?.get(transcriptId) ?? null,
			lines: [],
			xmlHits: [],
		};
		matches[key] = match;
		return match;
	};

	for (const id of frequencies?.keys() ?? []) {
		getOrCreateMatch(id);
	}

	for (const line of kwic?.Lines ?? []) {
		const transcriptId = getTranscriptId(line);
		if (transcriptId === null) {
			continue;
		}

		getOrCreateMatch(transcriptId).lines.push(line);
	}

	for (const hit of xmlHits) {
		const transcriptId = getTranscriptIdFromReferences([hit.refs]);
		if (transcriptId === null) {
			continue;
		}

		getOrCreateMatch(transcriptId).xmlHits.push(hit);
	}

	return matches;
}

async function requestKwic(
	cql: string,
	fromp: string,
	refs: string,
	pagesize: string,
): Promise<{ data: RunCgiResponse | null; error: NoSketchError | null }> {
	try {
		const response = await searchRequest(cql, fromp, "concordance", refs, pagesize, "json", "POST");
		if (!response.ok) {
			return {
				data: null,
				error: {
					status: response.status,
					message: response.statusText || "NoSketch Engine request failed",
				},
			};
		}

		try {
			const data = (await response.json()) as RunCgiResponse & { error?: string };
			if (
				!data ||
				typeof data !== "object" ||
				Array.isArray(data) ||
				data.error ||
				(data.Lines !== undefined &&
					(!Array.isArray(data.Lines) ||
						data.Lines.some(
							(line) =>
								!line ||
								typeof line !== "object" ||
								[line.Refs, line.Tbl_refs].some(
									(refs) =>
										refs !== undefined &&
										(!Array.isArray(refs) || refs.some((ref) => typeof ref !== "string")),
								),
						)))
			) {
				throw new Error(data?.error || "Invalid NoSketch JSON response");
			}
			return { data, error: null };
		} catch (error) {
			return {
				data: null,
				error: {
					status: null,
					message: error instanceof Error ? error.message : "Invalid JSON response",
				},
			};
		}
	} catch (error) {
		return {
			data: null,
			error: {
				status: null,
				message: error instanceof Error ? error.message : "NoSketch Engine request failed",
			},
		};
	}
}

async function requestXml(
	cql: string,
	fromp: string,
	refs: string,
	pagesize: string,
): Promise<{
	data: { content: string; contentType: "application/xml"; filename: string } | null;
	error: NoSketchError | null;
	hits: Array<XmlHit>;
}> {
	try {
		const response = await searchRequest(cql, fromp, "concordance", refs, pagesize, "xml", "POST");
		if (!response.ok) {
			return {
				data: null,
				error: {
					status: response.status,
					message: response.statusText || "NoSketch Engine request failed",
				},
				hits: [],
			};
		}

		try {
			const content = await response.text();
			const hits = parseXmlHits(content);
			return {
				data: {
					content,
					contentType: "application/xml",
					filename: parseDownloadFilename(response.headers.get("content-disposition")),
				},
				error: null,
				hits,
			};
		} catch (error) {
			return {
				data: null,
				error: {
					status: null,
					message: error instanceof Error ? error.message : "Invalid XML response",
				},
				hits: [],
			};
		}
	} catch (error) {
		return {
			data: null,
			error: {
				status: null,
				message: error instanceof Error ? error.message : "NoSketch Engine request failed",
			},
			hits: [],
		};
	}
}

const corpus = new Hono<AppEnv>()
	.get("/search/kwic", async (c) => {
		const rawQuery = c.req.query();
		const result = safeParse(SearchQuerySchema, {
			...rawQuery,
			transcripts: c.req.queries("transcripts"),
			projects: c.req.queries("projects"),
			locations: c.req.queries("locations"),
			first_languages: c.req.queries("first_languages"),
			// Default mode to simple if missing
			mode: rawQuery.mode ?? "simple",
		});

		if (!result.success) {
			return c.json(
				{
					error: "Validation failed",
					details: result.issues.map((i) => i.message),
				},
				400,
			);
		}

		const {
			word,
			query,
			lemma,
			pos,
			feats,
			mode,
			fromp,
			refs,
			pagesize,
			transcripts,
			projects,
			settings,
			age_lower,
			age_upper,
			locations,
			first_languages,
			dialect_competence,
			standard_competence,
			gender,
		} = result.output;

		// consolidate 'word' and 'query' (backward compatibility)
		const wordInput = word ?? query;

		// Ensure at least one search criteria is present
		if (!wordInput && !lemma && !pos && !feats) {
			return c.json(
				{ error: "At least one search parameter (word, lemma, pos, feats) is required" },
				400,
			);
		}

		const cql = buildCql(
			{
				word: wordInput,
				lemma,
				pos,
				feats,
				transcripts,
				projects,
				settings,
				age_lower,
				age_upper,
				locations,
				first_languages,
				dialect_competence,
				standard_competence,
				gender,
			},
			mode,
		);
		try {
			const response = await searchRequest(cql, fromp, "concordance", refs, pagesize);

			if (!response.ok) {
				console.error(`NoSke Error: ${response.statusText}`);
				return c.json({ error: "Upstream service error" }, 502);
			}
			const data = (await response.json()) as RunCgiResponse;

			return c.json(data, 200);
		} catch (error) {
			console.error(error);
			return c.json({ error: "Internal Server Error" }, 500);
		}
	})
	.get("/search/:id", async (c) => {
		const id = c.req.param("id");
		if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) {
			return c.json({ error: "Invalid project id" }, 400);
		}
		const projectId = Number(id);
		const rawQuery = c.req.query();
		const result = safeParse(SearchQuerySchema, {
			...rawQuery,
			transcripts: c.req.queries("transcript_ids"),
			projects: undefined,
			settings: undefined,
			locations: undefined,
			first_languages: c.req.queries("first_languages"),
			mode: rawQuery.mode ?? "simple",
		});

		if (!result.success) {
			return c.json(
				{
					error: "Validation failed",
					details: result.issues.map((issue) => issue.message),
				},
				400,
			);
		}

		const projects = parseIdArray(c.req.queries("projects")) ?? [];
		const settings = parseIdArray(c.req.queries("settings")) ?? [];
		const locations = parseIdArray(c.req.queries("locations")) ?? [];
		const transcriptIds = parseIdArray(c.req.queries("transcript_ids")) ?? [];
		if (projects === null || settings === null || locations === null || transcriptIds === null) {
			return c.json({ error: "Invalid numeric filter id" }, 400);
		}

		if (rawQuery.gender && rawQuery.gender !== "männlich" && rawQuery.gender !== "weiblich") {
			return c.json({ error: "Invalid gender parameter" }, 400);
		}

		let instanceId: number | undefined;
		if (rawQuery.instance_id !== undefined) {
			if (!/^\d+$/.test(rawQuery.instance_id)) {
				return c.json({ error: "Invalid instance_id parameter" }, 400);
			}
			instanceId = Number(rawQuery.instance_id);
			if (!Number.isSafeInteger(instanceId)) {
				return c.json({ error: "Invalid instance_id parameter" }, 400);
			}
		}

		const projectIds = [...new Set([projectId, ...projects])];
		let metadata: Awaited<ReturnType<typeof getCorpusSearchMetadata>>;
		try {
			metadata = await getCorpusSearchMetadata(projectIds, settings, locations);
		} catch (error) {
			console.error(error);
			return c.json({ error: "Internal Server Error" }, 500);
		}

		const projectById = new Map(metadata.projects.map((project) => [project.id, project]));
		const routeProject = projectById.get(projectId);
		if (
			!routeProject ||
			(projectId !== DIOE_PROJECT_ID && routeProject.main_project_id !== DIOE_PROJECT_ID)
		) {
			return c.json({ error: "Project is not part of the DiÖ hierarchy" }, 400);
		}

		for (const selectedId of projects) {
			const selectedProject = projectById.get(selectedId);
			if (
				!selectedProject ||
				(selectedId !== DIOE_PROJECT_ID && selectedProject.main_project_id !== DIOE_PROJECT_ID)
			) {
				return c.json({ error: `Unknown or invalid project id: ${String(selectedId)}` }, 400);
			}
			if (projectId !== DIOE_PROJECT_ID && selectedId !== projectId) {
				return c.json({ error: "Selected project is outside the route project scope" }, 400);
			}
		}

		const settingById = new Map(metadata.settings.map((setting) => [setting.id, setting]));
		const locationById = new Map(metadata.locations.map((location) => [location.id, location]));
		for (const settingId of settings) {
			if (!settingById.get(settingId)?.survey_type_name) {
				return c.json({ error: `Unknown setting id: ${String(settingId)}` }, 400);
			}
		}
		for (const locationId of locations) {
			if (!locationById.get(locationId)?.place_name) {
				return c.json({ error: `Unknown location id: ${String(locationId)}` }, 400);
			}
		}

		const databaseFilters: NonNullable<Parameters<typeof getAllTranscripts>[1]> = {};
		if (result.output.age_lower !== undefined) {
			databaseFilters.age_lower = result.output.age_lower;
		}
		if (result.output.age_upper !== undefined) {
			databaseFilters.age_upper = result.output.age_upper;
		}
		if (locations.length) {
			databaseFilters.locations = locations;
		}
		if (result.output.dialect_competence !== undefined) {
			databaseFilters.dialect_competence = result.output.dialect_competence;
		}
		if (result.output.standard_competence !== undefined) {
			databaseFilters.standard_competence = result.output.standard_competence;
		}
		if (rawQuery.gender) {
			databaseFilters.gender = rawQuery.gender;
		}
		if (rawQuery.comment_search) {
			databaseFilters.comment_search = rawQuery.comment_search;
			databaseFilters.comment_search_mode =
				rawQuery.comment_search_mode === "regex" ? "regex" : "simple";
		}
		if (rawQuery.transcript_name) {
			databaseFilters.transcript_name = rawQuery.transcript_name;
		}
		if (instanceId !== undefined) {
			databaseFilters.instance_id = instanceId;
		}
		if (settings.length) {
			databaseFilters.settings = settings;
		}
		if (projects.length && !projects.includes(DIOE_PROJECT_ID)) {
			databaseFilters.projects = projects;
		}
		if (result.output.transcripts?.length) {
			databaseFilters.transcripts = result.output.transcripts;
		}

		const wordInput = result.output.word ?? result.output.query;
		const hasLexicalCriterion = Boolean(
			wordInput || result.output.lemma || result.output.pos || result.output.feats,
		);

		if (!hasLexicalCriterion) {
			try {
				const transcripts = await getAllTranscripts(projectId, databaseFilters);
				return c.json(
					{
						transcripts,
						kwic: null,
						matchesByTranscript: {},
						xml: null,
						transcriptMatchesComplete: true,
						errors: { kwic: null, xml: null, transcriptMatches: null },
					},
					200,
				);
			} catch (error) {
				console.error(error);
				return c.json({ error: "Internal Server Error" }, 500);
			}
		}

		let projectNames: Array<string> = [];
		if (projectId !== DIOE_PROJECT_ID) {
			if (!routeProject.project_name || !/^PP\d{2}$/.test(routeProject.project_name)) {
				return c.json({ error: "Child project has no valid project name" }, 400);
			}
			projectNames = [routeProject.project_name];
		} else if (projects.length && !projects.includes(DIOE_PROJECT_ID)) {
			projectNames = projects.map((selectedId) => projectById.get(selectedId)!.project_name!);
			if (projectNames.some((name) => !/^PP\d{2}$/.test(name))) {
				return c.json({ error: "Selected project has no valid project name" }, 400);
			}
		}
		try {
			const databaseFirst = Object.keys(databaseFilters).length > 0 || projects.length > 0;
			const candidates = databaseFirst ? await getAllTranscripts(projectId, databaseFilters) : null;
			const candidateIds = candidates
				?.map((transcript) => transcript.instance_id)
				.filter(
					(id): id is number =>
						id !== null && (!transcriptIds.length || transcriptIds.includes(id)),
				);
			if (candidateIds?.length === 0) {
				return c.json({
					transcripts: [],
					kwic: null,
					xml: null,
					matchesByTranscript: {},
					transcriptMatchesComplete: true,
					errors: { kwic: null, xml: null, transcriptMatches: null },
				});
			}
			const cql = buildCql(
				{
					word: wordInput,
					lemma: result.output.lemma,
					pos: result.output.pos,
					feats: result.output.feats,
					transcripts: candidateIds,
					projects: projectNames,
					settings: settings.map((settingId) => settingById.get(settingId)!.survey_type_name!),
					age_lower: result.output.age_lower,
					age_upper: result.output.age_upper,
					locations: locations.map((locationId) => locationById.get(locationId)!.place_name!),
					first_languages: result.output.first_languages,
					dialect_competence: result.output.dialect_competence,
					standard_competence: result.output.standard_competence,
					gender:
						rawQuery.gender === "männlich"
							? "male"
							: rawQuery.gender === "weiblich"
								? "female"
								: undefined,
				},
				result.output.mode,
			);
			const refs = ensureTranscriptReference(result.output.refs);
			const [frequencyResult, kwicResult, xmlResult] = await Promise.all([
				requestTranscriptMatches(cql),
				requestKwic(cql, result.output.fromp, refs, result.output.pagesize),
				requestXml(cql, result.output.fromp, refs, result.output.pagesize),
			]);
			// Failed frequency lookups resolve only IDs from the successful current-page sources.
			const matchedIds = frequencyResult.data
				? [...frequencyResult.data.keys()]
				: Object.keys(groupMatchesByTranscript([], kwicResult.data, xmlResult.hits, null)).map(
						Number,
					);
			const matchingIds = new Set(matchedIds);
			const transcripts = candidates
				? candidates.filter(
						(transcript) =>
							transcript.instance_id !== null &&
							matchingIds.has(transcript.instance_id) &&
							candidateIds!.includes(transcript.instance_id),
					)
				: await getAllTranscripts(projectId, { ...databaseFilters, transcripts: matchedIds });

			return c.json(
				{
					transcripts,
					kwic: kwicResult.data,
					matchesByTranscript: groupMatchesByTranscript(
						transcripts,
						kwicResult.data,
						xmlResult.hits,
						frequencyResult.data,
					),
					xml: xmlResult.data,
					transcriptMatchesComplete: frequencyResult.error === null,
					errors: {
						kwic: kwicResult.error,
						xml: xmlResult.error,
						transcriptMatches: frequencyResult.error,
					},
				},
				200,
			);
		} catch (error) {
			console.error(error);
			return c.json({ error: "Internal Server Error" }, 500);
		}
	})
	.get("/transcript/:transcript_id/:format", (c) => {
		const id = c.req.param("transcript_id");
		const format = c.req.param("format"); // 'xml' or 'json'

		// 1. Validate transcript ID (Security Critical)
		const safeId = validateTranscriptId(id);
		if (!safeId) {
			return c.json({ error: "Invalid transcript ID" }, 400);
		}

		// 2. Validate format
		const extension = format === "json" ? "json" : "xml";
		const filename = `${safeId}.${extension}`;
		const filePath = join(DATA_DIR, extension, filename);

		// 3. Stream file with optimizations (compression, caching, etc.)
		return streamFile(c, {
			filePath,
			contentType: format === "json" ? "application/json" : "application/xml",
			enableCompression: true,
			enableCaching: true,
		});
	})
	.get("/corpus/:id?", async (c) => {
		const id = c.req.param("id");

		// Default to project ID 2 if no ID is provided
		const parsedId = id ? Number(id) : 2;

		if (Number.isNaN(parsedId)) {
			return c.json("Invalid project id", 400);
		}

		// Parse optional filter query parameters
		const rawQuery = c.req.query();
		const filters: {
			age_lower?: number;
			age_upper?: number;
			locations?: Array<number>;
			dialect_competence?: number;
			standard_competence?: number;
			gender?: string;
			comment_search?: string;
			comment_search_mode?: "simple" | "regex";
			transcript_name?: string;
			instance_id?: number;
			settings?: Array<number>;
			projects?: Array<number>;
		} = {};

		if (rawQuery.age_lower) {
			const ageLower = Number(rawQuery.age_lower);
			if (Number.isNaN(ageLower)) {
				return c.json("Invalid age_lower parameter", 400);
			}
			filters.age_lower = ageLower;
		}

		if (rawQuery.age_upper) {
			const ageUpper = Number(rawQuery.age_upper);
			if (Number.isNaN(ageUpper)) {
				return c.json("Invalid age_upper parameter", 400);
			}
			filters.age_upper = ageUpper;
		}

		const locations = parseIdArray(c.req.queries("locations"));
		if (locations === null) {
			return c.json("Invalid locations parameter", 400);
		}
		if (locations.length) {
			filters.locations = locations;
		}

		if (rawQuery.dialect_competence) {
			const dialectComp = Number(rawQuery.dialect_competence);
			if (Number.isNaN(dialectComp)) {
				return c.json("Invalid dialect_competence parameter", 400);
			}
			filters.dialect_competence = dialectComp;
		}

		if (rawQuery.standard_competence) {
			const standardComp = Number(rawQuery.standard_competence);
			if (Number.isNaN(standardComp)) {
				return c.json("Invalid standard_competence parameter", 400);
			}
			filters.standard_competence = standardComp;
		}

		if (rawQuery.gender) {
			if (rawQuery.gender !== "männlich" && rawQuery.gender !== "weiblich") {
				return c.json("Invalid gender parameter. Must be 'männlich' or 'weiblich'", 400);
			}
			filters.gender = rawQuery.gender;
		}

		if (rawQuery.comment_search) {
			filters.comment_search = rawQuery.comment_search;
			filters.comment_search_mode = rawQuery.comment_search_mode === "regex" ? "regex" : "simple";
		}

		if (rawQuery.instance_id) {
			const instance_id = Number(rawQuery.instance_id);
			if (Number.isNaN(instance_id)) {
				return c.json("Invalid instance_id parameter", 400);
			}
			filters.instance_id = instance_id;
		}

		if (rawQuery.transcript_name) {
			filters.transcript_name = rawQuery.transcript_name;
		}

		const settings = parseIdArray(c.req.queries("settings"));
		if (settings === null) {
			return c.json("Invalid settings parameter", 400);
		}
		if (settings.length) {
			filters.settings = settings;
		}

		const projects = parseIdArray(c.req.queries("projects"));
		if (projects === null) {
			return c.json("Invalid projects parameter", 400);
		}
		if (projects.length) {
			filters.projects = projects;
		}

		const response = await getAllTranscripts(parsedId, filters);

		return c.json(response, 200);
	})
	.get(
		"/preview/:transcript_id",
		vValidator(
			"param",
			object({
				transcript_id: string(),
			}),
		),
		async (c) => {
			const id = c.req.param("transcript_id");

			// 1. Validate transcript ID
			const safeId = validateTranscriptId(id);
			if (!safeId) {
				return c.json({ error: "Invalid transcript ID" }, 400);
			}

			const parsedId = Number(safeId);

			// 2. Fetch metadata from database
			const transcriptData = await transcriptDetailView(parsedId);

			// 3. Read and process transcript file
			const filePath = join(DATA_DIR, "json", `${String(parsedId)}.json`);

			// Read file to transform the data structure
			const fileContent = await fs.readFile(filePath, "utf-8");
			const transcriptJson = JSON.parse(fileContent);

			// 4. Group tokens by ID_Inf_id into events
			const tokensByInformant = new Map<number, Array<TranscriptToken>>();

			for (const token of transcriptJson.transcript_data) {
				const infId = token.ID_Inf_id;
				if (!tokensByInformant.has(infId)) {
					tokensByInformant.set(infId, []);
				}
				tokensByInformant.get(infId)!.push(token);
			}

			// Convert Map to events object
			const events: Record<string, Array<TranscriptToken>> = {};
			const unique_informant_ids: Array<number> = [];
			for (const [infId, tokens] of tokensByInformant.entries()) {
				events[String(infId)] = tokens;
				unique_informant_ids.push(infId);
			}

			// 5. Check if audio file exists and build audio URL
			let audio_url: string | null = null;
			let waveform_url: string | null = null;
			let has_audio = false;

			if (await resolveAudioFileForInstanceId(parsedId)) {
				audio_url = `/audio/stream/${String(parsedId)}`;
				waveform_url = `/audio/waveform/${String(parsedId)}`;
				has_audio = true;
			}

			// 6. Return transformed response
			return c.json(
				{
					metadata: transcriptData,
					unique_informant_ids,
					audio_url,
					waveform_url,
					has_audio,
					transcript_data: {
						events,
						tokenset_definitions: transcriptJson.tokenset_definitions as Record<
							string,
							Array<string>
						>,
					},
				},
				200,
			);
		},
	)
	.get("/place/:id", async (c) => {
		const id = c.req.param("id");

		// Default to project ID 2 if no ID is provided
		const parsedId = id ? Number(id) : 2;

		const fetchedLocations = await getAllLocationsByProject(parsedId);

		return c.json(fetchedLocations, 200);
	})
	.get("/filters", async (c) => {
		const information = await getFilterInformation();
		const settings = information.filter((el) => el.category === "setting");
		const projects = information.filter((el) => el.category === "project");
		const informationList = {
			settings: settings,
			projects: projects,
		};
		return c.json(informationList, 200);
	});

corpus.use("*", restrictedRoute);

export default corpus;

export type CorpusType = typeof corpus;
