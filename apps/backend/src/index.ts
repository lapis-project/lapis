import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
const healthCheck = new Hono();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

healthCheck.get("/", (c) => {
	return c.json("OK", 201);
});

app.route("health", healthCheck);

const port = 3000;
// eslint-disable-next-line no-console
console.log("Server is running on port: %s", port);

serve({
	fetch: app.fetch,
	port,
});
