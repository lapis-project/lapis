import { log } from "@acdh-oeaw/lib";
import { vValidator } from "@hono/valibot-validator";
import { hash, verify } from "@node-rs/argon2";
import { Hono } from "hono";
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

import {
	createSession,
	deleteSessionTokenCookie,
	invalidateSession,
	setSessionTokenCookie,
} from "@/auth/auth.ts";
import { argon2Config, userRolesConst } from "@/config/config.ts";
import { createUser, getUser, getUserById } from "@/db/authRepository.ts";
import { checkIfPrivilegedForAdminOrHigher } from "@/lib/authHelper.ts";
import type { AppEnv } from "@/lib/context.ts";
import type { Userroles } from "@/types/db.ts";

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

// TODO: fix type inference to avoid defining explicit return type
export interface SessionUserDTO {
	id: number;
	email: string;
	firstname: string | null;
	inactive: "active" | "inactive" | null;
	lastname: string | null;
	username: string | null;
	role_name: "admin" | "editor" | "superadmin" | null;
}

const auth = new Hono<AppEnv>()
	.get("/session", async (c) => {
		const session = c.get("session");
		if (!session?.userId) {
			return c.json("Unauthorized", 401);
		}
		const user = await getUserById(session.userId);
		return c.json<SessionUserDTO>(user, 200);
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

		const session = await createSession(existingUser.id);
		setSessionTokenCookie(c, session.id, session.expiresAt);

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

		await invalidateSession(session.id);
		deleteSessionTokenCookie(c);

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

		const session = await createSession(newUser.id);
		setSessionTokenCookie(c, session.id, session.expiresAt);

		const user = await getUserById(newUser.id);
		return c.json(user, 200);
	})
	.post("/create-user", vValidator("json", signupSchema), async (c) => {
		const { username, password, email, user_role, firstname, lastname } = c.req.valid("json");

		// Check if the email ends with @oeaw.ac.at or @univie.ac.at
		if (!email.endsWith("@oeaw.ac.at") && !email.endsWith("@univie.ac.at")) {
			log.info(`Email ${email} is not from oeaw or univie`);
			return c.json("This email handle is not allowed to be used!", 400);
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

		const user = await getUserById(newUser.id);
		return c.json({ user }, 200);
	});

auth.use("/signup", checkIfPrivilegedForAdminOrHigher);
auth.use("/create-user", checkIfPrivilegedForAdminOrHigher);

export default auth;

export type AuthType = typeof auth;
