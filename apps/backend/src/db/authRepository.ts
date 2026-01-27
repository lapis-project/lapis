import type { Userroles } from "@/types/db.ts";

import { db } from "./connect.ts";

export async function getUser(email: string) {
	return await db
		.selectFrom("user_account")
		.innerJoin("user_has_role", "user_account.id", "user_has_role.user_id")
		.innerJoin("user_roles", "user_has_role.role_id", "user_roles.id")
		.where("email", "=", email)
		.select([
			"user_account.username",
			"password",
			"user_account.id",
			"user_account.firstname",
			"user_account.lastname",
			"user_roles.role_name",
			"email",
		])
		.executeTakeFirst();
}

export async function getUsersByList(id: Array<number>) {
	return await db
		.selectFrom("user_account")
		.innerJoin("user_has_role", "user_account.id", "user_has_role.user_id")
		.innerJoin("user_roles", "user_has_role.role_id", "user_roles.id")
		.where("user_account.id", "in", id)
		.select(({ eb }) => [
			eb.ref("user_account.username").as("username"),
			eb.ref("user_account.id").as("id"),
			eb.ref("user_account.firstname").as("firstname"),
			eb.ref("user_account.lastname").as("lastname"),
			eb.ref("user_account.email").as("email"),
			eb.ref("user_roles.role_name").as("role_name"),
		])
		.execute();
}

export async function getUserById(id: number) {
	return await db
		.selectFrom("user_account")
		.innerJoin("user_has_role", "user_account.id", "user_has_role.user_id")
		.innerJoin("user_roles", "user_has_role.role_id", "user_roles.id")
		.where("user_account.id", "=", id)
		.select([
			"user_account.username",
			"user_account.id",
			"user_account.firstname",
			"user_account.lastname",
			"user_roles.role_name",
			"user_account.email",
			"user_account.inactive",
		])
		.executeTakeFirstOrThrow();
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
				.select((eb) => [eb.ref("id").as("role_id"), eb.val(newUserId?.id).as("user_id")])
				.where("role_name", "=", user_role),
		)
		.execute();
	return newUserId;
}
