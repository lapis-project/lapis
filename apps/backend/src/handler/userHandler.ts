import { Hono } from "hono";

import { getUsersByRole } from "@/db/userRepostiory";
import type { Context } from "@/lib/context";
import { instanceOfUserRole } from "@/lib/RepoHelper";

const user = new Hono<Context>();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const userByRole = user.get("/users/:role", async (c) => {
	const roleName = c.req.param("role");

	// Check if the role is an instance of Userroles
	// Check if the provided status is an element from the Poststatus enum
	if (!instanceOfUserRole(roleName)) {
		return c.json("Invalid status provided", 400);
	}
	const users = await getUsersByRole(roleName);
	return c.json(users, 200);
});

export type GetUserByRole = typeof userByRole;

export default user;
