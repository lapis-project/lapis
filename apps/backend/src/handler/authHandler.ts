import { log } from "@acdh-oeaw/lib";
import { vValidator } from "@hono/valibot-validator";
import { hash, verify } from "@node-rs/argon2";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { check, email, endsWith, minLength, object, optional, pipe, string, trim } from "valibot";

import { lucia } from "@/auth/auth";
import { argon2Config } from "@/config/config";
import { createUser, getUser, getUserById } from "@/db/authRepository";
import type { Context } from "@/lib/context";
import type { Userroles } from "@/types/db";

const auth = new Hono<Context>();

const loginSchema = object({
	email: string(),
	password: string(),
});

const signupSchema = object({
	username: pipe(string(), trim(), minLength(3)),
	password: pipe(string(), trim(), minLength(8)),
	email: pipe(string(), trim(), email(), endsWith("@oeaw.ac.at")),
	user_role: pipe(
		string(),
		trim(),
		check((val) => ["admin", "editor"].includes(val), "User role must be specified"),
	),
	firstname: pipe(string(), trim(), minLength(1)),
	lastname: optional(pipe(string(), trim(), minLength(1))),
});

const getSession = auth.get("/session", async (c) => {
	const session = c.get("session");
	if (session?.userId) {
		const user = await getUserById(Number(session.userId));
		return c.json(user, 200);
	}
	return c.json(null, 401);
});

const login = auth.post("/login", vValidator("json", loginSchema), async (c) => {
	const { email, password } = c.req.valid("json");

	const existingUser = await getUser(email);

	if (!existingUser?.password || !existingUser.email) {
		log.info(`Incorrect Username or password`);
		return c.json("Unauthorized", 401);
	}

	// Check if the password is correct and matches the hashed password
	const isValidPassword = await verify(existingUser.password, password, argon2Config);

	if (!isValidPassword) {
		// Very unsecure atm
		// TODO: Prevent brute-force attacks by adding a delay, maybe hash pws for incorrect usernames
		log.info(`Incorrect Username or password`);
		return c.json("Unauthorized", 401);
	}
	const user_id: string = existingUser.id.toString();
	const session = await lucia.createSession(user_id, {});
	const session_id = session.id;
	setCookie(c, "Set-Cookie", lucia.createSessionCookie(session_id).serialize());
	c.header("Location", "/", { append: true });
	log.info(`User ${existingUser.email} with username ${existingUser.username ?? ""} logged in`);
	const { password: _, ...userObject } = existingUser;
	return c.json(userObject, 200);
});

const logoutUser = auth.post("/logout", async (c) => {
	const session = c.get("session");
	if (!session) {
		return c.json("Unauthorized", 401);
	}
	await lucia.invalidateSession(session.id);
	c.header("Set-Cookie", lucia.createSessionCookie("").serialize(), { append: true });
	return c.json("OK", 201);
});

const signupUser = auth.post("/signup", vValidator("json", signupSchema), async (c) => {
	const { username, password, email, user_role, firstname, lastname } = c.req.valid("json");
	const passwordHash = await hash(password, argon2Config);
	const newUser = await createUser(
		username,
		passwordHash,
		email,
		user_role as Userroles,
		firstname,
		lastname,
	);

	if (!newUser) {
		log.info(`Error while creating user`);
		return c.json("User already exists", 409);
	}
	log.info(`User ${username} created`);

	const session = await lucia.createSession(newUser.id.toString(), {});
	const session_id = session.id;
	setCookie(c, "Set-Cookie", lucia.createSessionCookie(session_id).serialize());

	const user = await getUserById(newUser.id);
	return c.json(user, 200);
});

export type LoginType = typeof login;
export type GetSessionType = typeof getSession;
export type LogoutUserType = typeof logoutUser;
export type SignupUserType = typeof signupUser;

export default auth;
