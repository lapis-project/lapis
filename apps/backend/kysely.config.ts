// apps/backend/kysely.config.ts
import { defineConfig } from "kysely-ctl";

import { db } from "./src/db/connect.ts";
import { SqlFileMigrationProvider } from "./src/db/provider.ts";

export default defineConfig({
	kysely: db,
	migrations: {
		provider: new SqlFileMigrationProvider(),
	},
});
