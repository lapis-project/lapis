import { join } from "node:path";

import { vValidator } from "@hono/valibot-validator";
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
	getFilterInformation,
	transcriptDetailView,
} from "@/db/corpusRepository.ts";
import { restrictedRoute } from "@/lib/authHelper.ts";
import type { AppEnv } from "@/lib/context.ts";
import { buildCql } from "@/lib/cqlHelper.ts";
import { streamFile, validateTranscriptId } from "@/lib/fileStreamHelper.ts";
import { searchRequest } from "@/search/index.ts";
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
			locations?: string;
			dialect_competence?: number;
			standard_competence?: number;
			gender?: string;
			comment_search?: string;
			comment_search_mode?: "simple" | "regex";
			transcript_name?: string;
			instance_id?: number;
			settings?: Array<string>;
			projects?: Array<string>;
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

		if (rawQuery.locations) {
			filters.locations = rawQuery.locations;
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

		const settings = c.req.queries("settings");
		if (settings?.length) {
			filters.settings = settings;
		}

		const projects = c.req.queries("projects");
		if (projects?.length) {
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
			const fs = await import("node:fs/promises");
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

			// 5. Return transformed response
			return c.json(
				{
					metadata: transcriptData,
					unique_informant_ids,
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
