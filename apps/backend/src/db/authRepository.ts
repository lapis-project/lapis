import type { Userroles } from "@/types/db";

import { db } from "./connect";

export async function getUser(email: string) {
	return await db
		.selectFrom("user_account")
		.innerJoin("user_has_role", "user_account.id", "user_has_role.user_id")
		.innerJoin("user_roles", "user_has_role.role_id", "user_roles.id")
		.where("email", "=", email)
		.select([
			"username",
			"password",
			"user_account.id",
			"firstname",
			"lastname",
			"user_roles.role_name",
			"email",
		])
		.executeTakeFirst();
}

export async function getUserById(id: number) {
	return await db
		.selectFrom("user_account")
		.innerJoin("user_has_role", "user_account.id", "user_has_role.user_id")
		.innerJoin("user_roles", "user_has_role.role_id", "user_roles.id")
		.where("user_account.id", "=", id)
		.select([
			"username",
			"user_account.id",
			"firstname",
			"lastname",
			"user_roles.role_name",
			"email",
		])
		.executeTakeFirst();
}

export async function createUser(
	username: string,
	password: string,
	email: string,
	user_role: Userroles,
	firstname: string,
	lastname: string | undefined,
) {
	// Insert the new user into the database and get the new user's id
	const newUserId = await db
		.insertInto("user_account")
		.columns(["username", "password", "email", "firstname", "lastname"])
		.values({ username, password, email, firstname, lastname })
		.returning(["id"])
		.executeTakeFirst();
	await db
		.insertInto("user_has_role")
		.columns(["role_id", "user_id"])
		.expression((exp) =>
			exp
				.selectFrom("user_roles")
				.select((eb) => ["id as role_id", eb.val(newUserId?.id).as("user_id")])
				.where("role_name", "=", user_role),
		)
		.execute();
	return newUserId;
}
