import { promises as fs } from "node:fs";
import path from "node:path";

import { type Migration, type MigrationProvider, Migrator, sql } from "kysely";

import { db } from "@/db/connect.ts";

export class SqlFileMigrationProvider implements MigrationProvider {
	async getMigrations(): Promise<Record<string, Migration>> {
		const migrations: Record<string, Migration> = {};
		//const migrationsPath = path.join(process.cwd(), "src/db/migrations");
		const migrationsPath = path.join(import.meta.dirname, "migrations");

		const files = await fs.readdir(migrationsPath);

		for (const file of files.filter((f) => f.endsWith(".sql")).sort()) {
			const content = await fs.readFile(path.join(migrationsPath, file), "utf8");

			// Only implement up migrations
			// Work with apply forward migrations in case something needs to be removed
			migrations[file] = {
				up: async (db) => {
					await sql.raw(content).execute(db);
				},
			};
		}

		return migrations;
	}
}

export const migrator = new Migrator({
	db,
	provider: new SqlFileMigrationProvider(),
});
