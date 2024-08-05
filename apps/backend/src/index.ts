import { serve } from "@hono/node-server";
import { Hono } from "hono";

import articles from "./handler/articleHandler";
import cms from "./handler/cmsHandler";
import questions from "./handler/questionHandler";

const app = new Hono();
const healthCheck = new Hono();

const hc = healthCheck.get("/", (c) => {
	return c.json("OK", 201);
});

app.route("/health", healthCheck);
app.route("/articles", articles);
app.route("/questions", questions);
app.route("/cms", cms);

export type HealthType = typeof hc;
const port = Number(process.env.PORT) || 3000;
// eslint-disable-next-line no-console
console.log("Server is running on port: %s", port);

serve({
	fetch: app.fetch,
	port,
});
