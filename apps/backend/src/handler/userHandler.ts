import { vValidator } from "@hono/valibot-validator";
import { hash } from "@node-rs/argon2";
import { Hono } from "hono";
import {
	email,
	literal,
	minLength,
	object,
	optional,
	pipe,
	string,
	toLowerCase,
	trim,
	union,
} from "valibot";

import { argon2Config } from "@/config/config.ts";
import { getUserById } from "@/db/authRepository.ts";
import {
	editUserData,
	editUserPassword,
	editUserRoleByUserId,
	getUsersByRole,
	setUserActiveState,
} from "@/db/userRepository.ts";
import {
	checkIfPrivilegedForAdminOrHigher,
	checkIfRoleIsAllowed,
	isSuperadmin,
	restrictedRoute,
} from "@/lib/authHelper.ts";
import type { AppEnv } from "@/lib/context.ts";
import { instanceOfUserRole } from "@/lib/RepoHelper.ts";

const editRoleSchema = object({
	user_role: string(),
});

const editPasswordSchema = object({
	password: pipe(string(), trim(), minLength(8)),
});

const editUserDataSchema = object({
	username: pipe(string(), trim(), minLength(3)),
	email: pipe(string(), trim(), email(), toLowerCase()),
	firstname: pipe(string(), trim(), minLength(1)),
	lastname: optional(pipe(string(), trim(), minLength(1))),
});

const editActiveTypeSchema = object({
	active: union([literal("active"), literal("inactive")]),
});

const user = new Hono<AppEnv>()

	/**
	 * Gets all users by their role and returns them in an array with a status code of 200.
	 * Will return a status code of 400 if the role does not exist.
	 * @param {string} roleName - The role name which will be searched for
	 * @returns {Array} - An array of users with the specified role
	 */
	.get("/roles/:role", async (c) => {
		const roleName = c.req.param("role");

		// Check if the role is an instance of Userroles
		// Check if the provided status is an element from the Poststatus enum
		if (!instanceOfUserRole(roleName)) {
			return c.json("Invalid role provided", 400);
		}

		const users = await getUsersByRole(roleName);
		return c.json(users, 200);
	})

	/**
	 * Edits the user role of the user with the provided id. The userrole can only be edited by admins or superadmins.
	 * Admins are able to edit the userrole of all users which are not admins or superadmins.
	 * superadmins can edit the userrole of all users.
	 * @param {number} id - The id of the user which will have their role edited
	 * @returns {Object} - The edited user object
	 * @returns status code 200 with the edited user object if everything is successful and the user data has been edited
	 * @returns status code 400 if the provided id is not a number.
	 * @returns status code 403 if the user is not allowed to edit the user role.
	 * @returns status code 404 if the user with the provided id does not exist.
	 *
	 */
	.put("/roles/:id", vValidator("json", editRoleSchema), async (c) => {
		const userId = Number(c.req.param("id"));
		const { user_role } = c.req.valid("json");

		// Check if the passed roles is an instance of Userroles
		// Check if the provided status is an element from the Poststatus enum
		if (!instanceOfUserRole(user_role)) {
			return c.json("Invalid role provided", 400);
		}

		// Check if userid is a number
		if (Number.isNaN(userId)) {
			return c.json("Invalid user id provided", 400);
		}

		// Get the userobject of the user with the provided id
		const userObject = await getUserById(userId);
		if (!userObject.id) {
			return c.json("User not found", 404);
		}

		// Check the userrole of the user compared with the userrole of the user who wants to change the role
		const userRole = c.get("role");
		const editedUserRole = userObject.role_name;

		if (editedUserRole === "superadmin" && userRole !== "superadmin") {
			return c.json("Forbidden action", 403);
		}

		await editUserRoleByUserId(userId, user_role);
		return c.json(`Roles for user ${userObject.username ?? ""} have been updated`, 200);
	})

	/**
	 * Edits the user data of the user with the provided id. The user can only edit their own data.
	 * Admins are able to edit the data of all users which are not admins or superadmins.
	 * superadmins can edit the data of all users.
	 * The handler expects an object where username, email and firstname are required and the lastname is optional
	 *
	 * @param {number} id - The id of the user which will be edited
	 * @returns {Object} - The edited user object
	 * @returns status code 200 with the edited user object if everything is successful.
	 * @returns status code 400 if the provided id is not a number.
	 * @returns status code 403 if the user is not allowed to edit the user data.
	 * @returns status code 404 if the user with the provided id does not exist.
	 */
	.put("/data/:id", vValidator("json", editUserDataSchema), async (c) => {
		const userId = c.req.param("id");
		const { username, email, firstname, lastname } = c.req.valid("json");

		// Check if userid is a number
		if (Number.isNaN(Number(userId))) {
			return c.json("Invalid user id provided", 400);
		}

		// Get the userobject of the user with the provided id
		const userObject = await getUserById(Number(userId));
		if (!userObject.id) {
			return c.json("User not found", 404);
		}

		// Check the userrole of the user compared with the userrole of the user who wants to change the role
		const userRole = c.get("role");
		const signedInUser = c.get("user");
		const editedUserRole = userObject.role_name;

		if (userId !== signedInUser?.id || checkIfRoleIsAllowed(editedUserRole, userRole)) {
			return c.json("Forbidden action", 403);
		}

		const users = await editUserData(Number(userId), { username, email, firstname, lastname });
		return c.json(users, 200);
	})

	/**
	 * Changes the password of the user with the provided id. The user can only change their own password.
	 * Admins are able to change the password of all users which are not admins or superadmins.
	 * superadmins can change the password of all users.
	 *
	 * The password is in the body of the request and needs to be a string
	 * @param {number} id - The id of the user which will have their password changed
	 * @returns {Object} - The number of updated rows
	 * @returns status code 200 with the number of updated rows if everything is successful.
	 * @returns status code 400 if the provided id is not a number.
	 * @returns status code 403 if the user is not allowed to change the password.
	 * @returns status code 404 if the user with the provided id does not exist.
	 */
	.put("/password/:id", vValidator("json", editPasswordSchema), async (c) => {
		const userId = Number(c.req.param("id"));
		const { password } = c.req.valid("json");
		const passwordHash = await hash(password, argon2Config);

		// Check if userid is a number
		if (Number.isNaN(userId)) {
			return c.json("Invalid user id provided", 400);
		}

		// Get the userobject of the user with the provided id
		const userObject = await getUserById(userId);
		if (!userObject.id) {
			return c.json("User not found", 404);
		}

		// Check the userrole of the user compared with the userrole of the user who wants to change the role
		const userRole = c.get("role");
		const signedInUser = c.get("user");
		const editedUserRole = userObject.role_name;

		if (
			!isSuperadmin(userRole) &&
			(userId !== Number(signedInUser?.id) || checkIfRoleIsAllowed(editedUserRole, userRole))
		) {
			return c.json("Forbidden action", 403);
		}

		await editUserPassword(userId, passwordHash);

		return c.json("ok", 200);
	})

	/**
	 * Gets single user by its id and returns the corresponding user object.
	 *
	 *
	 * @param {number} id - The id of the user which will be returned
	 * @returns {Object} - The user object
	 * @returns status code 200 with the user object if everything is successful.
	 * @returns status code 400 if the provided id is not a number.
	 * @returns status code 404 if the user with the provided id does not exist.
	 */
	.get("/:id", async (c) => {
		const userId = c.req.param("id");

		// Check if userid is a number
		if (Number.isNaN(Number(userId))) {
			return c.json("Invalid user id provided", 400);
		}

		const userObject = await getUserById(Number(userId));
		if (!userObject.id) {
			return c.json("User not found", 404);
		}

		return c.json(userObject, 200);
	})
	.put("/active/:id", vValidator("json", editActiveTypeSchema), async (c) => {
		const userId = c.req.param("id");

		const { active } = c.req.valid("json");

		// Check if userid is a number
		if (Number.isNaN(Number(userId))) {
			return c.json("Invalid user id provided", 400);
		}

		const userObject = await getUserById(Number(userId));
		if (!userObject.id) {
			return c.json("User not found", 404);
		}

		// Update the active type of the user
		await setUserActiveState(Number(userId), active);

		return c.json("Ok", 200);
	});

user.use("*", restrictedRoute);

user.use("/roles/*", checkIfPrivilegedForAdminOrHigher);

export default user;

export type UserType = typeof user;
