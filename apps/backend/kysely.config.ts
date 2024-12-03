import { defineConfig } from "kysely-ctl";

import { db } from "./src/db/connect";

export default defineConfig({
	kysely: db,
	migrations: {
		allowJS: true,
		migrationFolder: "./db/migrations",
	},
	// replace me with a real dialect instance OR a dialect name + `dialectConfig` prop
	//   migrations: {
	//     migrationFolder: "migrations",
	//   },
	//   plugins: [],
	//   seeds: {
	//     seedFolder: "seeds",
	//   }
});
