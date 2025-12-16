import type { Context as HonoContext, Env } from "hono";
import type { Session, User } from "lucia";

import type { Userroles } from "@/types/db.ts";

// the ENV type for Hono generics
export interface AppEnv extends Env {
	Variables: {
		user: User | null;
		session: Session | null;
		role: Userroles | null;
	};
}

// actual context type we use in handlers
export type AppContext = HonoContext<AppEnv>;
