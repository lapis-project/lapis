import { Hono } from "hono";

import type { AppEnv } from "@/lib/context.ts";
import type { Userroles } from "@/types/db.ts";

export const testUser = { id: 42, username: "test-editor" };

// Supply authentication context while retaining the handlers' real authorization middleware.
export function createTestApp(role: Userroles | null = "editor") {
	return new Hono<AppEnv>().use("*", async (c, next) => {
		c.set("role", role);
		c.set("user", role === null ? null : testUser);
		c.set(
			"session",
			role === null
				? null
				: {
						id: "test-session",
						userId: testUser.id,
						expiresAt: new Date("2099-01-01"),
						fresh: false,
					},
		);
		await next();
	});
}

export function jsonRequest(method: "POST" | "PUT", body: unknown): RequestInit {
	return {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	};
}
