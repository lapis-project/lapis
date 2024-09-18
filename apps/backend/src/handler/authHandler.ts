import { log } from "@acdh-oeaw/lib";
import { vValidator } from "@hono/valibot-validator";
import { hash, verify } from "@node-rs/argon2";
import { Hono } from "hono";
import { object, string } from "valibot";

import { lucia } from "@/auth/auth";
import { createUser, getUser } from "@/db/authRepository";
import type { Context } from "@/lib/context";

const auth = new Hono<Context>();

const loginSchema = object({
	username: string(),
	password: string(),
});

const getSession = auth.get("/session", (c) => {
	const session = c.get("session");
	if (session) {
		return c.redirect("/");
	}
	return c.json(session, 201);
});

const login = auth.post("/login", vValidator("json", loginSchema), async (c) => {
	const { username, password } = c.req.valid("json");

	const existingUser = await getUser(username);

	if (!existingUser?.password || !existingUser.username) {
		log.info(`Incorrect Username or password`);
		return c.json("Unauthorized", 401);
	}

	// Check if the password is correct and matches the hashed password
	const validPassword = await verify(existingUser.password, password, {
		timeCost: 2,
		memoryCost: 19456,
		outputLen: 32,
		parallelism: 1,
	});

	if (!validPassword) {
		// Very unsecure atm
		// TODO: Prevent brute-force attacks by adding a delay, maybe hash pws for incorrect usernames
		log.info(`Incorrect Username or password`);
		return c.json("Unauthorized", 401);
	}
	const user_id: string = existingUser.id.toString();
	const session = await lucia.createSession(user_id, {});
	const session_id = session.id;
	c.header("Set-Cookie", lucia.createSessionCookie(session_id).serialize(), { append: true });
	c.header("Location", "/", { append: true });
	log.info(`User ${username} logged in`);
	return c.json("OK", 201);
});

const logoutUser = auth.post("/", async (c) => {
	const session = c.get("session");
	if (!session) {
		return c.json("Unauthorized", 401);
	}
	await lucia.invalidateSession(session.id);
	c.header("Set-Cookie", lucia.createSessionCookie("").serialize(), { append: true });
	return c.json("OK", 201);
});

const signupUser = auth.post("/signup", vValidator("json", loginSchema), async (c) => {
	const { username, password } = c.req.valid("json");
	const passwordHash = await hash(password, {
		// recommended minimum parameters
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	});
	const newUser = await createUser(username, passwordHash);

	if (!newUser) {
		log.info(`Error while creating user`);
		return c.json("User already exists", 409);
	}

	log.info(`User ${username} created`);
	return c.json("OK", 201);
});

export type LoginType = typeof login;
export type GetSessionType = typeof getSession;
export type LogoutUserType = typeof logoutUser;
export type SignupUserType = typeof signupUser;

export default auth;
