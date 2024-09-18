import { db } from "./connect";

export async function getUser(username: string) {
	return await db.selectFrom("user_account").where("username", "=", username).execute();
}
