import { log } from "@acdh-oeaw/lib";
import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { object, string } from "valibot";

const auth = new Hono();

const loginSchema = object({
	username: string(),
	password: string(),
});

const login = auth.post("/login", vValidator("query", loginSchema), (c) => {
	const { username, password } = c.req.valid("query");
	log.info(`User ${username} logged in`);
	if (username !== "admin" || password !== "admin") {
		return c.json("Unauthorized", 401);
	}
	return c.json("OK", 201);
});

export type LoginType = typeof login;

export default auth;
