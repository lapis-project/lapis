import { promises as fs } from "node:fs";
import { join } from "node:path";

import { vValidator } from "@hono/valibot-validator";
import { XMLParser } from "fast-xml-parser";
import { SyntaxValidator } from "fast-xml-validator";
import { type Context, Hono } from "hono";
import {
	array,
	type InferOutput,
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
import {
	type AustrianStateId,
	austrianStatePostalCodeRanges,
	austrianStates,
} from "@/lib/austrianPostalCodes.ts";
import { restrictedRoute } from "@/lib/authHelper.ts";
import type { AppEnv } from "@/lib/context.ts";
import { buildCql } from "@/lib/cqlHelper.ts";
import { streamFile, validateFile, validateTranscriptId } from "@/lib/fileStreamHelper.ts";
import { searchRequest } from "@/search/index.ts";
import { type NoSketchError, requestTranscriptMatches } from "@/search/transcriptMatches.ts";
import { resolveAudioFileForInstanceId } from "@/service/audioService.ts";
import type { TranscriptToken } from "@/types/apiTypes.ts";
import type { paths } from "@/types/noske.d.ts";

const transcriptSortFields = [
	"token_id",
	"transcript_id_id",
	"ID_Inf_id",
	"start_time",
	"end_time",
	"token_reihung",
	"ortho",
	"phon",
	"text_in_ortho",
	"sppos",
	"sptag",
	"splemma",
	"spdep",
	"spenttype",
] as const satisfies ReadonlyArray<keyof TranscriptToken>;

type TranscriptSortField = (typeof transcriptSortFields)[number];

const transcriptSortFieldSet = new Set<string>(transcriptSortFields);
const previewTranscriptSortFields: Array<TranscriptSortField> = [
	"start_time",
	"ID_Inf_id",
	"token_reihung",
];

export function parseTranscriptSortFields(
	values: Array<string>,
): Array<TranscriptSortField> | null {
	const fields = values.flatMap((value) => value.split(",")).map((value) => value.trim());

	if (
		fields.length === 0 ||
		fields.some((field) => field.length === 0 || !transcriptSortFieldSet.has(field))
	) {
		return null;
	}

	return fields as Array<TranscriptSortField>;
}

function transcriptTimeToSeconds(value: string): number {
	const parts = value.split(":").map(Number);
	if (parts.length !== 3 || parts.some(Number.isNaN)) {
		return Number.NaN;
	}

	return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
}

function compareTranscriptValues(
	left: TranscriptToken[TranscriptSortField],
	right: TranscriptToken[TranscriptSortField],
	field: TranscriptSortField,
): number {
	if (left === right) return 0;
	if (left === null) return 1;
	if (right === null) return -1;

	if (field === "start_time" || field === "end_time") {
		const timeDifference =
			transcriptTimeToSeconds(String(left)) - transcriptTimeToSeconds(String(right));
		if (!Number.isNaN(timeDifference) && timeDifference !== 0) return timeDifference;
	}

	if (typeof left === "number" && typeof right === "number") return left - right;
	return String(left).localeCompare(String(right));
}

export function sortTranscriptData(
	transcriptData: Array<TranscriptToken>,
	fields: Array<TranscriptSortField>,
): Array<TranscriptToken> {
	return transcriptData.toSorted((left, right) => {
		for (const field of fields) {
			const difference = compareTranscriptValues(left[field], right[field], field);
			if (difference !== 0) return difference;
		}

		return 0;
	});
}

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
	state: optional(
		pipe(
			string(),
			regex(/^[1-9]$/),
			transform((value) => Number(value) as AustrianStateId),
		),
	),

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

	has_bkms: optional(
		pipe(
			union([literal("true"), literal("false")]),
			transform((val) => val === "true"),
		),
	),
});

type RunCgiResponse =
	paths["/search/concordance"]["get"]["responses"]["200"]["content"]["application/json"];
type KwicLine = NonNullable<RunCgiResponse["Lines"]>[number];
type KwicContextItem = { str?: string; strc?: string };
type Transcript = Awaited<ReturnType<typeof getAllTranscripts>>[number];
type XmlHit = { refs: string; content: string };

const DIOE_PROJECT_ID = 2;
const OPENING_TAG_REGEX = /<doc(?=[\s>]|$)/;
const CLOSING_TAG_REGEX = /<\/doc\s*>/;

function hasOpeningTag(context: Array<KwicContextItem> | undefined): boolean {
	return (
		context?.some(
			(item) =>
				(typeof item.strc === "string" && OPENING_TAG_REGEX.test(item.strc)) ||
				(typeof item.str === "string" && OPENING_TAG_REGEX.test(item.str)),
		) ?? false
	);
}

function hasClosingTag(context: Array<KwicContextItem> | undefined): boolean {
	return (
		context?.some(
			(item) =>
				(typeof item.strc === "string" && CLOSING_TAG_REGEX.test(item.strc)) ||
				(typeof item.str === "string" && CLOSING_TAG_REGEX.test(item.str)),
		) ?? false
	);
}

function clearBoundaryContext(kwic: RunCgiResponse | null): RunCgiResponse | null {
	if (!kwic?.Lines) {
		return kwic;
	}

	return {
		...kwic,
		Lines: kwic.Lines.map((line) => ({
			...line,
			...(line.Left !== undefined && hasOpeningTag(line.Left) ? { Left: [] } : {}),
			...(line.Right !== undefined && hasClosingTag(line.Right) ? { Right: [] } : {}),
		})),
	};
}

function omitNullQueryValues(values: Array<string> | undefined): Array<string> | undefined {
	return values?.filter((value) => value !== "null");
}

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

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const REF_ATTRIBUTE_NAME_PATTERN = /^[A-Za-z_][\w.-]*$/;

function parseRefAttributes(refs: string): Array<{ name: string; value: string }> {
	const parsedAttributes: Array<{ name: string; value: string }> = [];
	for (const part of refs.split(",")) {
		const separatorIndex = part.indexOf("=");
		const candidateName = separatorIndex === -1 ? "" : part.slice(0, separatorIndex);
		if (separatorIndex !== -1 && REF_ATTRIBUTE_NAME_PATTERN.test(candidateName)) {
			parsedAttributes.push({
				name: candidateName,
				value: part.slice(separatorIndex + 1),
			});
		} else {
			const previousAttribute = parsedAttributes[parsedAttributes.length - 1];
			if (previousAttribute !== undefined) {
				previousAttribute.value += `,${part}`;
			}
		}
	}
	return parsedAttributes;
}

function formatLineDivAsTeiXml(refs: string, line: Record<PropertyKey, unknown>): string {
	const attributes = [
		'xmlns:lapis="lapis-online.at"',
		'type="resultLine"',
		...parseRefAttributes(refs).map(({ name, value }) => `lapis:${name}="${value}"`),
	];

	const divOpen = `<div ${attributes.join("\n     ")}>`;
	const segments: Array<string> = [];

	for (const segmentType of ["left", "kwic", "right"] as const) {
		const rawSegment = line[segmentType];
		if (typeof rawSegment !== "string") {
			continue;
		}
		const tokens = rawSegment.trim().split(/\s+/).filter(Boolean);
		if (tokens.length === 0) {
			segments.push(`      <seg type="${segmentType}"/>`);
		} else {
			const words = tokens.map((token) => `         <w>${token}</w>`).join("\n");
			segments.push(`      <seg type="${segmentType}">\n${words}\n      </seg>`);
		}
	}

	const uBody = segments.length > 0 ? `\n${segments.join("\n")}\n   ` : "";
	return `${divOpen}\n   <u>${uBody}</u>\n</div>`;
}

function parseXmlConcordance(content: string): { content: string; hits: Array<XmlHit> } {
	try {
		if (SyntaxValidator.validate(content) !== true) {
			throw new Error("Invalid NoSketch XML");
		}
	} catch {
		throw new Error("Invalid NoSketch XML");
	}

	const parser = new XMLParser({
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
		return {
			content: `${XML_DECLARATION}\n<concordance/>`,
			hits: [],
		};
	}

	const divBlocks: Array<string> = [];
	const hits: Array<XmlHit> = [];
	for (const value of Array.isArray(lines) ? lines : [lines]) {
		if (typeof value !== "object" || value === null) {
			continue;
		}

		const line = value as Record<PropertyKey, unknown>;
		const refs = line["@_refs"];
		if (typeof refs !== "string") {
			continue;
		}

		const divXml = formatLineDivAsTeiXml(refs, line);
		divBlocks.push(divXml);
		hits.push({
			refs,
			content: `${XML_DECLARATION}\n${divXml}`,
		});
	}

	return {
		content:
			divBlocks.length === 0
				? `${XML_DECLARATION}\n<concordance/>`
				: `${XML_DECLARATION}\n<concordance>\n${divBlocks.join("\n")}\n</concordance>`,
		hits,
	};
}

function groupTranscriptHitCounts(
	transcripts: Array<Transcript>,
	frequencies: Map<number, number> | null,
): Record<
	string,
	{
		transcript: Transcript | null;
		hitCount: number | null;
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
		}
	> = {};

	for (const [id, hitCount] of frequencies?.entries() ?? []) {
		matches[String(id)] = {
			transcript: transcriptById.get(id) ?? null,
			hitCount,
		};
	}

	return matches;
}

function groupConcordanceHitsByTranscript(
	kwic: RunCgiResponse | null,
	xmlHits: Array<XmlHit>,
): Record<
	string,
	{
		lines: Array<KwicLine>;
		xmlHits: Array<XmlHit>;
	}
> {
	const matches: Record<
		string,
		{
			lines: Array<KwicLine>;
			xmlHits: Array<XmlHit>;
		}
	> = {};
	const getOrCreateMatch = (transcriptId: number) => {
		const key = String(transcriptId);
		const match = matches[key] ?? {
			lines: [],
			xmlHits: [],
		};
		matches[key] = match;
		return match;
	};

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
			const rawContent = await response.text();
			const { content, hits } = parseXmlConcordance(rawContent);
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

type SearchErrorResponse = {
	body: { error: string; details?: Array<string> };
	status: 400 | 500;
};

type SearchContext = {
	projectId: number;
	rawQuery: Record<string, string>;
	output: InferOutput<typeof SearchQuerySchema>;
	projects: Array<number>;
	settings: Array<number>;
	locations: Array<number>;
	transcriptIds: Array<number>;
	routeProject: Awaited<ReturnType<typeof getCorpusSearchMetadata>>["projects"][number];
	projectById: Map<number, Awaited<ReturnType<typeof getCorpusSearchMetadata>>["projects"][number]>;
	settingById: Map<number, Awaited<ReturnType<typeof getCorpusSearchMetadata>>["settings"][number]>;
	locationById: Map<
		number,
		Awaited<ReturnType<typeof getCorpusSearchMetadata>>["locations"][number]
	>;
	databaseFilters: NonNullable<Parameters<typeof getAllTranscripts>[1]>;
	wordInput: string | undefined;
	hasLexicalCriterion: boolean;
};

async function resolveSearchContext(
	c: Context<AppEnv>,
	options?: { requireLexicalCriterion?: boolean },
): Promise<
	| { errorResponse: SearchErrorResponse; context: null }
	| { errorResponse: null; context: SearchContext }
> {
	const id = c.req.param("id");
	if (!id || !/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) {
		return {
			errorResponse: { body: { error: "Invalid project id" }, status: 400 },
			context: null,
		};
	}
	const projectId = Number(id);
	const rawQuery = c.req.query();
	const projectValues = omitNullQueryValues(c.req.queries("projects"));
	const settingValues = omitNullQueryValues(c.req.queries("settings"));
	const locationValues = omitNullQueryValues(c.req.queries("locations"));
	const transcriptIdValues = omitNullQueryValues(c.req.queries("transcript_ids"));
	const result = safeParse(SearchQuerySchema, {
		...rawQuery,
		transcripts: transcriptIdValues,
		projects: undefined,
		settings: undefined,
		locations: undefined,
		first_languages: c.req.queries("first_languages"),
		mode: rawQuery.mode ?? "simple",
	});

	if (!result.success) {
		return {
			errorResponse: {
				body: {
					error: "Validation failed",
					details: result.issues.map((issue) => issue.message),
				},
				status: 400,
			},
			context: null,
		};
	}

	const projects = parseIdArray(projectValues);
	const settings = parseIdArray(settingValues);
	const locations = parseIdArray(locationValues);
	const transcriptIds = parseIdArray(transcriptIdValues);
	if (projects === null || settings === null || locations === null || transcriptIds === null) {
		return {
			errorResponse: { body: { error: "Invalid numeric filter id" }, status: 400 },
			context: null,
		};
	}

	if (rawQuery.gender && rawQuery.gender !== "männlich" && rawQuery.gender !== "weiblich") {
		return {
			errorResponse: { body: { error: "Invalid gender parameter" }, status: 400 },
			context: null,
		};
	}

	let instanceId: number | undefined;
	if (rawQuery.instance_id !== undefined) {
		if (!/^\d+$/.test(rawQuery.instance_id)) {
			return {
				errorResponse: { body: { error: "Invalid instance_id parameter" }, status: 400 },
				context: null,
			};
		}
		instanceId = Number(rawQuery.instance_id);
		if (!Number.isSafeInteger(instanceId)) {
			return {
				errorResponse: { body: { error: "Invalid instance_id parameter" }, status: 400 },
				context: null,
			};
		}
	}

	const wordInput = result.output.word ?? result.output.query;
	const hasLexicalCriterion = Boolean(
		wordInput || result.output.lemma || result.output.pos || result.output.feats,
	);
	if (options?.requireLexicalCriterion && !hasLexicalCriterion) {
		return {
			errorResponse: {
				body: {
					error: "At least one search parameter (word, lemma, pos, feats) is required",
				},
				status: 400,
			},
			context: null,
		};
	}

	const projectIds = [...new Set([projectId, ...projects])];
	let metadata: Awaited<ReturnType<typeof getCorpusSearchMetadata>>;
	try {
		metadata = await getCorpusSearchMetadata(projectIds, settings, locations);
	} catch (error) {
		console.error(error);
		return {
			errorResponse: { body: { error: "Internal Server Error" }, status: 500 },
			context: null,
		};
	}

	const projectById = new Map(metadata.projects.map((project) => [project.id, project]));
	const routeProject = projectById.get(projectId);
	if (
		!routeProject ||
		(projectId !== DIOE_PROJECT_ID && routeProject.main_project_id !== DIOE_PROJECT_ID)
	) {
		return {
			errorResponse: {
				body: { error: "Project is not part of the DiÖ hierarchy" },
				status: 400,
			},
			context: null,
		};
	}

	for (const selectedId of projects) {
		const selectedProject = projectById.get(selectedId);
		if (
			!selectedProject ||
			(selectedId !== DIOE_PROJECT_ID && selectedProject.main_project_id !== DIOE_PROJECT_ID)
		) {
			return {
				errorResponse: {
					body: { error: `Unknown or invalid project id: ${String(selectedId)}` },
					status: 400,
				},
				context: null,
			};
		}
		if (projectId !== DIOE_PROJECT_ID && selectedId !== projectId) {
			return {
				errorResponse: {
					body: { error: "Selected project is outside the route project scope" },
					status: 400,
				},
				context: null,
			};
		}
	}

	const settingById = new Map(metadata.settings.map((setting) => [setting.id, setting]));
	const locationById = new Map(metadata.locations.map((location) => [location.id, location]));
	for (const settingId of settings) {
		if (!settingById.get(settingId)?.survey_type_name) {
			return {
				errorResponse: {
					body: { error: `Unknown setting id: ${String(settingId)}` },
					status: 400,
				},
				context: null,
			};
		}
	}
	for (const locationId of locations) {
		if (!locationById.get(locationId)?.place_name) {
			return {
				errorResponse: {
					body: { error: `Unknown location id: ${String(locationId)}` },
					status: 400,
				},
				context: null,
			};
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
	if (result.output.state !== undefined) {
		databaseFilters.postal_code_ranges = austrianStatePostalCodeRanges[result.output.state];
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

	if (result.output.has_bkms !== undefined) {
		databaseFilters.has_bkms = result.output.has_bkms;
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

	return {
		errorResponse: null,
		context: {
			projectId,
			rawQuery,
			output: result.output,
			projects,
			settings,
			locations,
			transcriptIds,
			routeProject,
			projectById,
			settingById,
			locationById,
			databaseFilters,
			wordInput,
			hasLexicalCriterion,
		},
	};
}

async function resolveLexicalSearchCql(ctx: SearchContext): Promise<
	| { errorResponse: SearchErrorResponse; empty: false }
	| { errorResponse: null; empty: true }
	| {
			errorResponse: null;
			empty: false;
			cql: string;
			refs: string;
			candidates: Array<Transcript> | null;
			candidateIds: Array<number> | undefined;
	  }
> {
	let projectNames: Array<string> = [];
	if (ctx.projectId !== DIOE_PROJECT_ID) {
		if (!ctx.routeProject.project_name || !/^PP\d{2}$/.test(ctx.routeProject.project_name)) {
			return {
				errorResponse: {
					body: { error: "Child project has no valid project name" },
					status: 400,
				},
				empty: false,
			};
		}
		projectNames = [ctx.routeProject.project_name];
	} else if (ctx.projects.length && !ctx.projects.includes(DIOE_PROJECT_ID)) {
		projectNames = ctx.projects.map((selectedId) => ctx.projectById.get(selectedId)!.project_name!);
		if (projectNames.some((name) => !/^PP\d{2}$/.test(name))) {
			return {
				errorResponse: {
					body: { error: "Selected project has no valid project name" },
					status: 400,
				},
				empty: false,
			};
		}
	}

	try {
		const databaseFirst = Object.keys(ctx.databaseFilters).length > 0 || ctx.projects.length > 0;
		const candidates = databaseFirst
			? await getAllTranscripts(ctx.projectId, ctx.databaseFilters)
			: null;
		const candidateIds = candidates
			?.map((transcript) => transcript.instance_id)
			.filter(
				(id): id is number =>
					id !== null && (!ctx.transcriptIds.length || ctx.transcriptIds.includes(id)),
			);
		if (candidateIds?.length === 0) {
			return { errorResponse: null, empty: true };
		}

		const cql = buildCql(
			{
				word: ctx.wordInput,
				lemma: ctx.output.lemma,
				pos: ctx.output.pos,
				feats: ctx.output.feats,
				transcripts: candidateIds,
				projects: projectNames,
				settings: ctx.settings.map(
					(settingId) => ctx.settingById.get(settingId)!.survey_type_name!,
				),
				age_lower: ctx.output.age_lower,
				age_upper: ctx.output.age_upper,
				locations: ctx.locations.map((locationId) => ctx.locationById.get(locationId)!.place_name!),
				first_languages: ctx.output.first_languages,
				dialect_competence: ctx.output.dialect_competence,
				standard_competence: ctx.output.standard_competence,
				gender:
					ctx.rawQuery.gender === "männlich"
						? "male"
						: ctx.rawQuery.gender === "weiblich"
							? "female"
							: undefined,
			},
			ctx.output.mode,
		);
		const refs = ensureTranscriptReference(ctx.output.refs);

		return {
			errorResponse: null,
			empty: false,
			cql,
			refs,
			candidates,
			candidateIds,
		};
	} catch (error) {
		console.error(error);
		return {
			errorResponse: { body: { error: "Internal Server Error" }, status: 500 },
			empty: false,
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
		const searchContextResult = await resolveSearchContext(c);
		if (searchContextResult.errorResponse) {
			return c.json(
				searchContextResult.errorResponse.body,
				searchContextResult.errorResponse.status,
			);
		}
		const ctx = searchContextResult.context;

		if (!ctx.hasLexicalCriterion) {
			try {
				const transcripts = await getAllTranscripts(ctx.projectId, ctx.databaseFilters);
				return c.json(
					{
						transcripts,
						matchesByTranscript: {},
						totalHits: 0,
						transcriptMatchesComplete: true,
						errors: { transcriptMatches: null },
					},
					200,
				);
			} catch (error) {
				console.error(error);
				return c.json({ error: "Internal Server Error" }, 500);
			}
		}

		const lexicalResult = await resolveLexicalSearchCql(ctx);
		if (lexicalResult.errorResponse) {
			return c.json(lexicalResult.errorResponse.body, lexicalResult.errorResponse.status);
		}
		if (lexicalResult.empty) {
			return c.json(
				{
					transcripts: [],
					matchesByTranscript: {},
					totalHits: 0,
					transcriptMatchesComplete: true,
					errors: { transcriptMatches: null },
				},
				200,
			);
		}

		try {
			const frequencyResult = await requestTranscriptMatches(lexicalResult.cql);
			if (!frequencyResult.data) {
				return c.json(
					{
						transcripts: [],
						matchesByTranscript: {},
						totalHits: null,
						transcriptMatchesComplete: false,
						errors: {
							transcriptMatches: frequencyResult.error,
						},
					},
					200,
				);
			}

			const matchedIds = [...frequencyResult.data.keys()];
			const matchingIds = new Set(matchedIds);
			const transcripts = lexicalResult.candidates
				? lexicalResult.candidates.filter(
						(transcript) =>
							transcript.instance_id !== null &&
							matchingIds.has(transcript.instance_id) &&
							lexicalResult.candidateIds!.includes(transcript.instance_id),
					)
				: await getAllTranscripts(ctx.projectId, {
						...ctx.databaseFilters,
						transcripts: matchedIds,
					});

			let totalHits = 0;
			for (const count of frequencyResult.data.values()) {
				totalHits += count;
			}

			return c.json(
				{
					transcripts,
					matchesByTranscript: groupTranscriptHitCounts(transcripts, frequencyResult.data),
					totalHits,
					transcriptMatchesComplete: frequencyResult.error === null,
					errors: {
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
	.get("/search/:id/hits", async (c) => {
		const searchContextResult = await resolveSearchContext(c, { requireLexicalCriterion: true });
		if (searchContextResult.errorResponse) {
			return c.json(
				searchContextResult.errorResponse.body,
				searchContextResult.errorResponse.status,
			);
		}
		const ctx = searchContextResult.context;

		const lexicalResult = await resolveLexicalSearchCql(ctx);
		if (lexicalResult.errorResponse) {
			return c.json(lexicalResult.errorResponse.body, lexicalResult.errorResponse.status);
		}
		if (lexicalResult.empty) {
			return c.json(
				{
					kwic: null,
					xml: null,
					matchesByTranscript: {},
					errors: { kwic: null, xml: null },
				},
				200,
			);
		}

		try {
			const [kwicResult, xmlResult] = await Promise.all([
				requestKwic(lexicalResult.cql, ctx.output.fromp, lexicalResult.refs, ctx.output.pagesize),
				requestXml(lexicalResult.cql, ctx.output.fromp, lexicalResult.refs, ctx.output.pagesize),
			]);
			const isBoundaryMarkerSearch =
				ctx.wordInput?.trim().toUpperCase() === "XXX" ||
				ctx.output.lemma?.trim().toUpperCase() === "XXX";
			const kwicData = isBoundaryMarkerSearch
				? clearBoundaryContext(kwicResult.data)
				: kwicResult.data;

			return c.json(
				{
					kwic: kwicData,
					xml: xmlResult.data,
					matchesByTranscript: groupConcordanceHitsByTranscript(kwicData, xmlResult.hits),
					errors: {
						kwic: kwicResult.error,
						xml: xmlResult.error,
					},
				},
				200,
			);
		} catch (error) {
			console.error(error);
			return c.json({ error: "Internal Server Error" }, 500);
		}
	})
	.get("/transcript/:transcript_id/:format", async (c) => {
		const id = c.req.param("transcript_id");
		const format = c.req.param("format"); // 'xml' or 'json'
		let sortByQuery = c.req.queries("sort_by");

		// 1. Validate transcript ID (Security Critical)
		const safeId = validateTranscriptId(id);
		if (!safeId) {
			return c.json({ error: "Invalid transcript ID" }, 400);
		}

		// 2. Validate format
		const extension = format === "json" ? "json" : "xml";
		const filename = `${safeId}.${extension}`;
		const filePath = join(DATA_DIR, extension, filename);

		// Set default value for sortByQuery if field is left empty or NULL
		if (!sortByQuery) {
			sortByQuery = ["start_time", "ID_Inf_id", "token_reihung"];
		}
		if (sortByQuery.length > 0) {
			if (format !== "json") {
				return c.json({ error: "sort_by is only supported for JSON transcripts" }, 400);
			}

			const sortFields = parseTranscriptSortFields(sortByQuery);
			if (!sortFields) {
				return c.json(
					{
						error: "Invalid sort_by parameter",
						allowed_fields: transcriptSortFields,
					},
					400,
				);
			}

			const validation = validateFile(filePath);
			if (!validation.valid) {
				return c.json({ error: validation.error }, 404);
			}

			const transcript = JSON.parse(await fs.readFile(filePath, "utf-8")) as {
				transcript_data?: Array<TranscriptToken>;
				[key: string]: unknown;
			};
			if (!Array.isArray(transcript.transcript_data)) {
				return c.json({ error: "Invalid transcript data" }, 500);
			}

			return c.json({
				...transcript,
				transcript_data: sortTranscriptData(transcript.transcript_data, sortFields),
			});
		}

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

			const projectIds = parseIdArray(c.req.queries("project_id"));
			if (projectIds === null || projectIds.length > 1 || projectIds[0] === 0) {
				return c.json({ error: "Invalid project_id parameter" }, 400);
			}

			const parsedId = Number(safeId);
			const parsedProjectId = projectIds[0] ?? DIOE_PROJECT_ID;

			// 2. Fetch metadata from database
			const transcriptData = await transcriptDetailView(parsedId, parsedProjectId);

			// 3. Read and process transcript file
			const filePath = join(DATA_DIR, "json", `${String(parsedId)}.json`);

			// Read file to transform the data structure
			const fileContent = await fs.readFile(filePath, "utf-8");
			const transcriptJson = JSON.parse(fileContent);

			// 4. Group tokens by ID_Inf_id into events
			const tokensByInformant = new Map<number, Array<TranscriptToken>>();

			const sortedTokens = sortTranscriptData(
				transcriptJson.transcript_data as Array<TranscriptToken>,
				previewTranscriptSortFields,
			);
			for (const token of sortedTokens) {
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
			states: austrianStates,
		};
		return c.json(informationList, 200);
	});

corpus.use("*", restrictedRoute);

export default corpus;

export type CorpusType = typeof corpus;
