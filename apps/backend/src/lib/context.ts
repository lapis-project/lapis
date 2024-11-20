import type { Env } from "hono";
import type { Session, User } from "lucia";

import type { Userroles } from "@/types/db";

export interface Context extends Env {
	Variables: {
		user: User | null;
		session: Session | null;
		role: Userroles | null;
	};
}
