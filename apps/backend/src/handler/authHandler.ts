import { log } from "@acdh-oeaw/lib";
import { vValidator } from "@hono/valibot-validator";
import { hash, verify } from "@node-rs/argon2";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import {
	check,
	email,
	minLength,
	object,
	optional,
	pipe,
	string,
	toLowerCase,
	trim,
} from "valibot";

import { lucia } from "@/auth/auth";
import { argon2Config, userRolesConst } from "@/config/config";
import { createUser, getUser, getUserById } from "@/db/authRepository";
import { checkIfPrivilegedForAdminOrHigher } from "@/lib/authHelper";
import type { Context } from "@/lib/context";
import type { Userroles } from "@/types/db";

const loginSchema = object({
	email: pipe(string(), toLowerCase()),
	password: string(),
});

const signupSchema = object({
	username: pipe(string(), trim(), minLength(3)),
	password: pipe(string(), trim(), minLength(8)),
	email: pipe(string(), trim(), email(), toLowerCase()),
	user_role: pipe(
		string(),
		trim(),
		check((val) => userRolesConst.includes(val), "User role must be specified"),
	),
	firstname: pipe(string(), trim(), minLength(1)),
	lastname: optional(pipe(string(), trim(), minLength(1))),
});

const auth = new Hono<Context>()
	.get("/session", async (c) => {
		const session = c.get("session");
		if (session?.userId) {
			const user = await getUserById(Number(session.userId));
			return c.json(user, 200);
		}
		return c.json(null, 401);
	})
	.post("/login", vValidator("json", loginSchema), async (c) => {
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
	})
	.post("/logout", async (c) => {
		const session = c.get("session");
		if (!session) {
			return c.json("Unauthorized", 401);
		}
		await lucia.invalidateSession(session.id);
		c.header("Set-Cookie", lucia.createSessionCookie("").serialize(), { append: true });
		return c.json("OK", 201);
	})
	.post("/signup", vValidator("json", signupSchema), async (c) => {
		const { username, password, email, user_role, firstname, lastname } = c.req.valid("json");

		// Check if the email ends with @oeaw.ac.at or @univie.ac.at
		if (!email.endsWith("@oeaw.ac.at") && !email.endsWith("@univie.ac.at")) {
			log.info(`Email ${email} is not from oeaw or univie`);
			return c.json("This email is not allowed to be used for signup!", 400);
		}
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

auth.use("/signup", checkIfPrivilegedForAdminOrHigher);

export default auth;

export type AuthType = typeof auth;
