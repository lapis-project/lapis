import { db } from "@/db/connect";
import type { Userroles } from "@/types/db";

export async function getUsersByRole(role_name: Userroles) {
	return await db
		.selectFrom("user_account")
		.innerJoin("user_has_role", "user_account.id", "user_has_role.user_id")
		.innerJoin("user_roles", "user_has_role.role_id", "user_roles.id")
		.where("user_roles.role_name", "=", role_name)
		.select([
			"username",
			"user_account.id",
			"firstname",
			"lastname",
			"user_roles.role_name",
			"email",
		])
		.execute();
}
