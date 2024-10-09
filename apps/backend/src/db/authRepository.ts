import type { Userroles } from "@/types/db";

import { db } from "./connect";

export async function getUser(username: string) {
	return await db
		.selectFrom("user_account")
		.innerJoin("user_roles", "user_account.role_id", "user_roles.id")
		.where("username", "=", username)
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
		.innerJoin("user_roles", "user_account.role_id", "user_roles.id")
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
	return await db
		.insertInto("user_account")
		.columns(["role_id", "username", "password", "email", "firstname", "lastname"])
		.expression((exp) =>
			exp
				.selectFrom("user_roles")
				.select((eb) => [
					"id as role_id",
					eb.val(username).as("username"),
					eb.val(password).as("password"),
					eb.val(email).as("email"),
					eb.val(firstname).as("firstname"),
					eb.val(lastname).as("lastname"),
				])
				.where("role_name", "=", user_role),
		)
		// .values({ username, password, email, user_role, firstname, lastname })
		.returning(["id"])
		.executeTakeFirst();
}
