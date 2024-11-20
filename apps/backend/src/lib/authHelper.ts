import { createMiddleware } from "hono/factory";

import type { Context } from "@/lib/context";
import type { Userroles } from "@/types/db";

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

	if (userRole !== "admin" && userRole !== "superuser") {
		return c.json("Forbidden action", 403);
	}
	return next();
});

export const checkIfPrivilegedForSuperuser = createMiddleware<Context>(async (c, next) => {
	// Check if the role of the user is superuser
	const userRole = c.get("role");

	if (userRole !== "superuser") {
		return c.json("Forbidden action", 403);
	}
	return next();
});

export const checkIfRoleIsAllowed = (
	editedUserRole: Userroles | null,
	userRole: Userroles | null,
) => {
	if ((editedUserRole === "admin" || editedUserRole === "superuser") && userRole !== "superuser") {
		return false;
	}

	return true;
};
