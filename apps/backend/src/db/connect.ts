import * as dotenv from "dotenv";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

// import { type DB, Users } from "../types/db";

dotenv.config();

const pool = new Pool({
	database: process.env.PGDATABASE,
	host: process.env.PGHOST,
	port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
	user: process.env.PGUSER,
	password: process.env.PGPASSWORD,
});

const dialect = new PostgresDialect({
	pool,
});

// export const db = new Kysely<DB>({ dialect });
