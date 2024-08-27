import * as dotenv from "dotenv";
import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";

import type { DB } from "../types/db";

dotenv.config();

// eslint-disable-next-line import-x/no-named-as-default-member
const { Pool } = pg;
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

export const db = new Kysely<DB>({ dialect });
