import { createMiddleware } from "hono/factory";

import type { AppEnv as Context } from "@/lib/context.ts";
import type { Userroles } from "@/types/db.ts";

export const restrictedRoute = createMiddleware<Context>(async (c, next) => {
	const session = c.get("session");
	const userObject = c.get("user");

	if (!session || !userObject) {
		return c.json("Forbidden", 403);
	}

	return next();
});

export const checkIfPrivilegedForAdminOrHigher = createMiddleware<Context>(async (c, next) => {
	// Check if the role of the user is admin or higher
	const userRole = c.get("role");

	if (userRole !== "admin" && userRole !== "superadmin") {
		return c.json("Forbidden action", 403);
	}
	return next();
});

export const checkIfPrivilegedForsuperadmin = createMiddleware<Context>(async (c, next) => {
	// Check if the role of the user is superadmin
	const userRole = c.get("role");

	if (userRole !== "superadmin") {
		return c.json("Forbidden action", 403);
	}
	return next();
});

/**
 * Checks if a user is FORBIDDEN from modifying another user based on roles.
 * Returns TRUE if the action is forbidden (should trigger a 403).
 * Returns FALSE if the action is allowed.
 * * Logic: Admins and Superadmins cannot be modified by regular users (or regular admins).
 */
export const isRoleModificationForbidden = (
	targetUserRole: Userroles | null,
	actorRole: Userroles | null,
) => {
	// If the target is an Admin or Superadmin, the actor MUST be a Superadmin.
	if (
		(targetUserRole === "admin" || targetUserRole === "superadmin") &&
		actorRole !== "superadmin"
	) {
		return true; // -> access forbidden
	}

	return false; // -> access allowed
};

export const isSuperadmin = (userRole: Userroles | null) => {
	return userRole === "superadmin";
};
