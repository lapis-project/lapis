import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { verifyRequestOrigin } from "lucia";

import { lucia } from "@/auth/auth.ts";
import { getUserById } from "@/db/authRepository.ts";
import articles from "@/handler/articleHandler.ts";
import audio from "@/handler/audioHandler.ts";
import auth from "@/handler/authHandler.ts";
import cms from "@/handler/cmsHandler.ts";
import media from "@/handler/mediaHandler.ts";
import questions from "@/handler/questionHandler.ts";
import statistics from "@/handler/statHandler.ts";
import user from "@/handler/userHandler.ts";
import type { AppContext, AppEnv } from "@/lib/context.ts";

const app = new Hono<AppEnv>()

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
				"Range", // TODO: refactor to use this in audiohandler ohly
				"X-Custom-Header",
				"Upgrade-Insecure-Requests",
			],
			exposeHeaders: [
				"Accept-Ranges", // TODO: refactor to use this in audiohandler ohly
				"Content-Range", // TODO: refactor to use this in audiohandler ohly
				"Content-Length", // TODO: refactor to use this in audiohandler ohly
				"Content-Type", // TODO: refactor to use this in audiohandler ohly
				"X-Kuma-Revision", // TODO: refactor to use this in audiohandler ohly
			],
			maxAge: 600,
			credentials: true,
		}),
	)
	.use("*", async (c: AppContext, next) => {
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
	.use("*", async (c: AppContext, next) => {
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
	.get("/", (c: AppContext) => {
		return c.json("OK", 201);
	})
	.notFound((c: AppContext) => c.json({ message: "Not Found", ok: false }, 404))
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
