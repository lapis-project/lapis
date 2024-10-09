import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { verifyRequestOrigin } from "lucia";

import { lucia } from "@/auth/auth";
import auth from "@/handler/authHandler";
import type { Context } from "@/lib/context";

import articles from "./handler/articleHandler";
import cms from "./handler/cmsHandler";
import questions from "./handler/questionHandler";

const app = new Hono<Context>();

app.use(logger());
app.use(prettyJSON());

// CORS Setup for the backend
app.use(
	"*",
	cors({
		origin: process.env.ALLOWED_ORIGINS
			? process.env.ALLOWED_ORIGINS.trim()
					.split(",")
					.map((el) => el.trim())
			: "",
		allowMethods: ["GET", "POST", "PUT", "DELETE"],
		allowHeaders: ["Content-Type", "Authorization", "X-Custom-Header", "Upgrade-Insecure-Requests"],
		exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
		maxAge: 600,
		credentials: true,
	}),
);

app.use("*", async (c, next) => {
	if (c.req.method === "GET") {
		return next();
	}
	const originHeader = c.req.header("Origin") ?? null;
	const hostHeader = c.req.header("Host") ?? null;

	if (
		!originHeader ||
		!hostHeader ||
		!verifyRequestOrigin(
			originHeader,
			process.env.ALLOWED_ORIGINS
				? process.env.ALLOWED_ORIGINS.trim()
						.split(",")
						.map((el) => el.trim())
				: [],
		)
	) {
		return c.body(null, 403);
	}
	return next();
});

app.use("*", async (c, next) => {
	const cookie = getCookie(c, "Set-Cookie");
	const sessionId = lucia.readSessionCookie(cookie ?? "");
	if (!sessionId) {
		c.set("user", null);
		c.set("session", null);
		return next();
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session?.fresh) {
		setCookie(c, "Set-Cookie", lucia.createSessionCookie(session.id).serialize());
	}
	if (!session) {
		setCookie(c, "Set-Cookie", lucia.createBlankSessionCookie().serialize());
	}
	c.set("session", session);
	c.set("user", user);
	return next();
});

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
app.route("/auth", auth);

// Export type for the health check route
export type HealthType = typeof hc;

export { app };
