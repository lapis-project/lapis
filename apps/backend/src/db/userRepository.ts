import { db } from "@/db/connect.ts";
import type { Inactivetype, Userroles } from "@/types/db.ts";

export async function getUsersByRole(role_name: Userroles) {
	return await db
		.selectFrom("user_account")
		.innerJoin("user_has_role", "user_account.id", "user_has_role.user_id")
		.innerJoin("user_roles", "user_has_role.role_id", "user_roles.id")
		.where("user_roles.role_name", "=", role_name)
		.select(({ eb }) => [
			eb.ref("user_account.username").as("username"),
			eb.ref("user_account.id").as("id"),
			eb.ref("user_account.firstname").as("firstname"),
			eb.ref("user_account.lastname").as("lastname"),
			eb.ref("user_roles.role_name").as("role_name"),
			eb.ref("user_account.email").as("email"),
		])
		.execute();
}

export async function getAllUsers() {
	return await db
		.selectFrom("user_account")
		.innerJoin("user_has_role", "user_account.id", "user_has_role.user_id")
		.innerJoin("user_roles", "user_has_role.role_id", "user_roles.id")
		.select([
			"user_account.username",
			"user_account.id",
			"user_account.firstname",
			"user_account.lastname",
			"user_roles.role_name",
			"user_account.email",
		])
		.execute();
}

export async function getAllUserRoles() {
	return await db
		.selectFrom("user_roles")
		.select(["user_roles.id", "user_roles.description", "user_roles.role_name"])
		.execute();
}
export async function editUserRoleByUserId(userId: number, roleName: Userroles) {
	return db.transaction().execute(async (trx) => {
		// 1) remove all current roles
		await trx.deleteFrom("user_has_role").where("user_id", "=", userId).execute();

		// 2) find the role id for the given role name
		const role = await trx
			.selectFrom("user_roles")
			.select(["id"])
			.where("role_name", "=", roleName)
			.executeTakeFirst();

		if (!role) {
			throw new Error(`Role "${roleName}" not found`);
		}

		// 3) insert the single new role
		return trx.insertInto("user_has_role").values({ user_id: userId, role_id: role.id }).execute();
	});
}
export async function editUserData(
	userId: number,
	userData: {
		username: string;
		email: string;
		firstname: string;
		lastname: string | undefined;
	},
) {
	return await db.updateTable("user_account").set(userData).where("id", "=", userId).execute();
}

export async function editUserPassword(userId: number, password: string) {
	return await db.updateTable("user_account").set({ password }).where("id", "=", userId).execute();
}

/**
 * Sets the user with the given id into inactive. This function sets an active user into inactive state.
 * If the user is inactive the user will be made active again
 * @param userId UserId of the user that will be set inactive or active.
 */
export async function setUserActiveState(userId: number, activeType: Inactivetype) {
	return await db
		.updateTable("user_account")
		.set({ inactive: activeType })
		.where("id", "=", userId)
		.execute();
}
