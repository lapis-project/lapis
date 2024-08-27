import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import articles from "./handler/articleHandler";
import cms from "./handler/cmsHandler";
import questions from "./handler/questionHandler";

const app = new Hono();

app.use(logger());
app.use(prettyJSON());

// Healthcheck for the k8s server
const healthCheck = new Hono();

const hc = healthCheck.get("/", (c) => {
	return c.json("OK", 201);
});

app.notFound((c) => c.json({ message: "Not Found", ok: false }, 404));

// Including all new routes
app.route("/health", healthCheck);
app.route("/articles", articles);
app.route("/questions", questions);
app.route("/cms", cms);

// Export type for the health check route
export type HealthType = typeof hc;

export { app };
