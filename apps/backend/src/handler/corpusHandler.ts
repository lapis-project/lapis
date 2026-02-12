import { Hono } from "hono";

import { restrictedRoute } from "@/lib/authHelper.ts";
import type { AppEnv } from "@/lib/context.ts";
import { searchRequest } from "@/search/index.ts";
import type { paths } from "@/types/noske.d.ts";

const corpus = new Hono<AppEnv>();

corpus.use("*", restrictedRoute);

type RunCgiResponse =
	paths["/search/concordance"]["get"]["responses"]["200"]["content"]["application/json"];

corpus.get("/search", async (c) => {
	const response = await searchRequest("test123");

	if (!response.ok) {
		console.error(`NoSke Error: ${response.statusText}`);
		return c.json({ error: "Upstream service error" }, 502);
	}
	const data = (await response.json()) as RunCgiResponse;
	return c.json(data, 201);
});

export default corpus;

export type CorpusType = typeof corpus;
