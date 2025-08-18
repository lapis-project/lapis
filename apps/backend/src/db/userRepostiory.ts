import { db } from "@/db/connect";
import type { Inactivetype, Userroles } from "@/types/db";

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

export async function getAllUsers() {
	return await db
		.selectFrom("user_account")
		.innerJoin("user_has_role", "user_account.id", "user_has_role.user_id")
		.innerJoin("user_roles", "user_has_role.role_id", "user_roles.id")
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

export async function editUserRoleByUserId(userId: number, roleIds: Array<Userroles>) {
	// Delete all roles for the user
	await db.deleteFrom("user_has_role").where("user_id", "=", userId).execute();

	// get the role ids
	const userRoles = await db
		.selectFrom("user_roles")
		.where("role_name", "in", roleIds)
		.select(["id"])
		.execute();

	// Insert new roles for the user
	return await db
		.insertInto("user_has_role")
		.columns(["user_id", "role_id"])
		.values(userRoles.map((role) => ({ user_id: userId, role_id: role.id })))
		//.values(roleIds.map((roleId) => ({ user_id: userId, role_id: roleId })))
		.execute();
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
export async function setUserInactive(userId: number, activeType: Inactivetype) {
	return await db
		.updateTable("user_account")
		.set({ inactive: activeType })
		.where("id", "=", userId)
		.execute();
}
