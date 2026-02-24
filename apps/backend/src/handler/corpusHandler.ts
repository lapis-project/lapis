import { createReadStream, existsSync } from "node:fs";
import { join } from "node:path";

import { Hono, type TypedResponse } from "hono";
import { stream } from "hono/streaming";
import { literal, object, optional, safeParse, string, union } from "valibot";

import { DATA_DIR } from "@/config/config.ts";
import { getAllTranscripts } from "@/db/corpusRepository.ts";
import { restrictedRoute } from "@/lib/authHelper.ts";
import type { AppEnv } from "@/lib/context.ts";
import { buildCql } from "@/lib/cqlHelper.ts";
import { searchRequest } from "@/search/index.ts";
import type { paths } from "@/types/noske.d.ts";

const SearchQuerySchema = object({
	// Allow 'word' OR 'query' for text input
	word: optional(string()),
	query: optional(string()),

	lemma: optional(string()),
	pos: optional(string()),
	feats: optional(string()),

	mode: optional(union([literal("simple"), literal("regex")]), "simple"),

	from: optional(string(), "0"),
});

export interface TranscriptJsonFormat {
	token_id: number;
	transcript_id_id: number;
	ID_Inf_id: number;
	start_time: string;
	end_time: string;
	token_reihung: number;
	ortho: string;
	phon: string;
	text_in_ortho: string;
	sppos: string;
	sptag: string;
	splemma: string;
	spdep: string;
	spenttype: string;
	tags: Array<{
		tag_reihung: Array<number>;
		tag_name: string;
		tag_id: Array<number>;
		tag: Array<string>;
		tag_gene: Array<number>;
	}>;
	tokenset_ids: Array<number>;
}

type RunCgiResponse =
	paths["/search/concordance"]["get"]["responses"]["200"]["content"]["application/json"];

const corpus = new Hono<AppEnv>()
	.get("/search/kwic", async (c) => {
		const rawQuery = c.req.query();

		const result = safeParse(SearchQuerySchema, {
			...rawQuery,
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

		const { word, query, lemma, pos, feats, mode, from } = result.output;

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
			},
			mode,
		);

		try {
			const response = await searchRequest(cql, from, "concordance");

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
	.get("/transcript/:id/:format", (c) => {
		const id = c.req.param("id"); // Pass the id of the transcript as the param
		const format = c.req.param("format"); // 'xml' or 'json'

		// 1. Sanitize Path (Security Critical)
		// Prevent directory traversal (e.g. "../../../etc/passwd")
		const safeId = id.replace(/[^\w-]/g, "");
		const extension = format === "json" ? "json" : "xml";
		const filename = `${safeId}.${extension}`;
		const filePath = join(DATA_DIR, extension, filename);

		// 2. Check Existence
		if (!existsSync(filePath)) {
			return c.json({ error: "Transcript not found" }, 404);
		}

		// 3. Stream File
		c.header("Content-Type", format === "json" ? "application/json" : "application/xml");

		return stream(c, async (stream) => {
			try {
				const fileStream = createReadStream(filePath);

				for await (const chunk of fileStream) {
					// Cast the chunk as Uint8Array since TS infers it as Buffer => but inherits from Uint8Array
					await stream.write(chunk as Uint8Array);
				}
			} catch (err) {
				console.error("Streaming error:", err);
			}
		}) as unknown as TypedResponse<TranscriptJsonFormat | string>;
	})
	.get("/corpus/:id", async (c) => {
		const id = c.req.param("id");
		if (!id) {
			return c.json("Project Id is required", 400);
		}

		const parsedId = Number(id);
		if (Number.isNaN(parsedId)) {
			return c.json("Invalid project id", 400);
		}
		const response = await getAllTranscripts(parsedId);

		return c.json(response, 200);
	});

corpus.use("*", restrictedRoute);

export default corpus;

export type CorpusType = typeof corpus;
