import { NodePostgresAdapter } from "@lucia-auth/adapter-postgresql";
import { Lucia, TimeSpan } from "lucia";

import { pool } from "@/db/connect";
import type { UserAccount } from "@/types/db";

const dbAdapterAuth = new NodePostgresAdapter(pool, {
	user: "user_account",
	session: "user_session",
});

// Setup for auth
export const lucia = new Lucia(dbAdapterAuth, {
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: process.env.NODE_ENV === "production",
		},
	},
	sessionExpiresIn: new TimeSpan(3, "d"),
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username,
		};
	},
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: Omit<UserAccount, "id">;
	}
}
