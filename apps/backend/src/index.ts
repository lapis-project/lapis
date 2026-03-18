import { log } from "@acdh-oeaw/lib";
import { serve } from "@hono/node-server";

import { app } from "@/app.ts";
import { migrator } from "@/db/provider.ts";

/*
// Starting the server
const port = Number(process.env.BACKEND_PORT) || 3000;
log.success(`Server is running on port: ${String(port)}`);

serve({
	fetch: app.fetch,
	port,
});
*/

async function bootstrap() {
	// Check if env variable for migration has been set
	if (process.env.RUN_MIGRATIONS === "true") {
		log.info("Checking for pending database migrations...");

		const { error, results } = await migrator.migrateToLatest();

		results?.forEach((it) => {
			if (it.status === "Success") {
				log.info(`Migration "${it.migrationName}" was executed successfully`);
			} else if (it.status === "Error") {
				log.error(`Failed to execute migration "${it.migrationName}"`);
			}
		});

		// If migrations break, throw error
		if (error) {
			throw new Error(`Database migration Failed`, error);
		}

		log.info("Database schema is up to date.");
	}

	// Start the Hono server only after the database is confirmed ready
	const port = process.env.BACKEND_PORT ? Number(process.env.BACKEND_PORT) : 3000;

	serve({
		fetch: app.fetch,
		port,
	});

	log.info(`Backend server is running on port ${String(port)}`);
}

// Initialize the application
try {
	await bootstrap();
} catch (err) {
	log.error(`Fatal startup error:`, err);
	throw err;
}
