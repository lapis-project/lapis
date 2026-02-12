import { Hono } from "hono";

import { restrictedRoute } from "@/lib/authHelper.ts";
import type { AppEnv } from "@/lib/context.ts";

const corpus = new Hono<AppEnv>();

corpus.use("*", restrictedRoute);

corpus.get("/search", (c) => {
	return c.json("OK", 201);
});

export default corpus;

export type CorpusType = typeof corpus;
