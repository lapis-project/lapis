import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { verifyRequestOrigin } from "lucia";

import { lucia } from "@/auth/auth";
import auth from "@/handler/authHandler";
import statistics from "@/handler/statHandler";
import audio from "@/handler/streamHandler";
import user from "@/handler/userHandler";
import type { Context } from "@/lib/context";

import { getUserById } from "./db/authRepository";
import articles from "./handler/articleHandler";
import cms from "./handler/cmsHandler";
import media from "./handler/mediaHandler";
import questions from "./handler/questionHandler";
import statistics from "./handler/statHandler";
import user from "./handler/userHandler";
import type { Context } from "./lib/context";

const app: Hono<Context> = new Hono<Context>()

	.use(logger())
	.use(prettyJSON())

	// CORS Setup for the backend
	.use(
		"*",
		cors({
			origin: process.env.ALLOWED_ORIGINS
				? process.env.ALLOWED_ORIGINS.trim()
						.split(",")
						.map((el) => el.trim())
				: "",
			allowMethods: ["GET", "POST", "PUT", "DELETE"],
			allowHeaders: [
				"Content-Type",
				"Authorization",
				"X-Custom-Header",
				"Upgrade-Insecure-Requests",
			],
			exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
			maxAge: 600,
			credentials: true,
		}),
	)
	.use("*", async (c, next) => {
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
	})
	.use("*", async (c, next) => {
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

		if (user) {
			const userObject = await getUserById(Number(user.id));
			c.set("role", userObject.role_name ?? "editor");
		}
		c.set("session", session);
		c.set("user", user);
		return next();
	})
	.get("/", (c) => {
		return c.json("OK", 201);
	})
	.notFound((c) => c.json({ message: "Not Found", ok: false }, 404))
	.route("/articles", articles)
	.route("/questions", questions)
	.route("/cms", cms)
	.route("/auth", auth)
	.route("/user", user)
	.route("/media", media)
	.route("/stat", statistics)
	.route("/audio", audio);

export { app };

export type AppType = typeof app;
