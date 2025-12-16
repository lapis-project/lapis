import { createMiddleware } from "hono/factory";

import type { AppEnv as Context } from "@/lib/context.ts";
import type { Userroles } from "@/types/db.ts";

export const restrictedRoute = createMiddleware<Context>(async (c, next) => {
	const sessionCookie = c.get("session");
	const userObject = c.get("user");

	if (!sessionCookie || !userObject) {
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

export const checkIfRoleIsAllowed = (
	editedUserRole: Userroles | null,
	userRole: Userroles | null,
) => {
	if (
		(editedUserRole === "admin" || editedUserRole === "superadmin") &&
		userRole !== "superadmin"
	) {
		return false;
	}

	return true;
};

export const isSuperadmin = (userRole: Userroles | null) => {
	return userRole === "superadmin";
};
