import { createMiddleware } from "hono/factory";

import type { Context } from "@/lib/context";

export const restrictedRoute = createMiddleware<Context>(async (c, next) => {
	const sessionCookie = c.get("session");
	const userObject = c.get("user");

	if (!sessionCookie || !userObject) {
		return c.json("Forbidden", 403);
	}

	return next();
});
