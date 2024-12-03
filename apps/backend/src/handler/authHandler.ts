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

const auth = new Hono<Context>();

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

// Checks if the user is privileged for admin or higher
// If not will return 403
auth.use("/signup", checkIfPrivilegedForAdminOrHigher);

/**
 * Gets the current session of the user
 * If the user is logged in it will return the user object with a status code of 200
 * If the user is not logged in it will return null with a status code of 401
 * @returns status code 200 with the user object if the user is logged in
 * @returns status code 401 if the user is not logged in
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getSession = auth.get("/session", async (c) => {
	const session = c.get("session");
	if (session?.userId) {
		const user = await getUserById(Number(session.userId));
		return c.json(user, 200);
	}
	return c.json(null, 401);
});

/**
 * Logs the user with the provided credentials, which are provided in the body, in.
 * Returns the user object with a status code of 200 if the login was successful
 * Returns a status code of 401 if the login was unsuccessful
 * @returns status code 200 with the user object if the login was successful
 * @returns status code 401 if the login was unsuccessful
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const login = auth.post("/login", vValidator("json", loginSchema), async (c, next) => {
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

/**
 * Logs the user out by invalidating the session and setting the session cookie to an empty string
 * Returns a status code of 201 if the logout was successful
 * Returns a status code of 401 if the user is not logged in
 * @returns status code 201 if the logout was successful
 * @returns status code 401 if the user is not logged in
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logoutUser = auth.post("/logout", async (c) => {
	const session = c.get("session");
	if (!session) {
		return c.json("Unauthorized", 401);
	}
	await lucia.invalidateSession(session.id);
	c.header("Set-Cookie", lucia.createSessionCookie("").serialize(), { append: true });
	return c.json("OK", 201);
});

/**
 * Creates a new user account in the database with the provided credentials. E-Mail adress must be unique and from oeaw or univie.
 * If the signup was successful the user is logged in and a session cookie is set.
 * Returns the user object with a status code of 200 if the signup was successful
 * Returns a status code of 409 if the user already exists
 * Returns a status code of 400 if the email is not from oeaw or univie
 * @returns status code 200 with the user object if the signup was successful
 * @returns status code 409 if the user already exists
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const signupUser = auth.post("/signup", vValidator("json", signupSchema), async (c) => {
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

export type LoginType = typeof login;
export type GetSessionType = typeof getSession;
export type LogoutUserType = typeof logoutUser;
export type SignupUserType = typeof signupUser;

export default auth;
