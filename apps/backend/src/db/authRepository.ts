import { db } from "./connect";

export async function getUser(username: string) {
	return await db
		.selectFrom("user_account")
		.where("username", "=", username)
		.select(["username", "password", "id"])
		.executeTakeFirst();
}

export async function createUser(username: string, password: string) {
	return await db
		.insertInto("user_account")
		.values({ username, password })
		.returning(["id"])
		.executeTakeFirst();
}
