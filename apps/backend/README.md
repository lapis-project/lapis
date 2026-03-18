# Lapis Backend

Contains the functionality of the lapis backend

## How to run the backend

```
pnpm install
pnpm run dev
```

## Database Migrations

The backend uses a "Roll Forward" migration strategy powered by Kysely and raw `.sql` files.

**Architectural Note:** We only write **up** migrations. To prevent accidental data loss (such as
executing `DROP TABLE` in production), we do not use `down` or rollback migrations. If a schema
change needs to be reverted or fixed, write a new `up` migration that corrects the state.

Furthermore, migrations are **baked directly into the final Docker image** during the GitHub Actions
build step. The `.sql` files are copied into the `dist/migrations` directory, and the application
automatically checks and applies any pending migrations sequentially when the Kubernetes container
boots up, before the Hono API starts serving traffic.

The code is controlled by an environment variable called `RUN_MIGRATIONS`. If it is set to true the
startup sequence will include the check for migrations.

### 1. Create a New Migration

Always use the provided generator script to create new migrations. This ensures they receive a
precise, sortable timestamp prefix, which Kysely uses to determine the execution order.

```bash
# Generate a newly timestamped SQL file in the migrations directory
bash ./scripts/make-migration.sh add_user_preferences_table
```

- `./make-migration.sh`: Executes the bash script located in the repository root.
- `add_user_preferences_table`: The descriptive name appended to the timestamp for readability.

### 2. Write the Schema Changes

Open the newly created file in `apps/backend/src/db/migrations/` and write your standard Postgres
SQL commands.

### 3. Apply to Local Database

Test your migration against your local Docker Postgres instance. The script automatically chooses
the `.env.local` inside of the `apps/backend` folder.

```bash
# Apply the latest pending migrations using local credentials
pnpm --filter @lapis/backend migrate:latest
```

- `--filter @lapis/backend`: Directs `pnpm` to execute the command specifically within the backend
  workspace of the monorepo.

_(Note: If your local schema reaches a broken state during development, wipe the local database
volume and re-run the setup scripts rather than attempting to write a downgrade)._

### 4. Regenerate TypeScript Types

After successfully applying a schema change to your local database, you must update the Kysely type
definitions so your TypeScript code recognizes the new structure.

```bash
# Introspect the active database and overwrite the db.d.ts file
pnpm --filter @lapis/backend generate-types-kysely
```

- `generate-types-kysely`: Triggers the package.json script that runs `kysely-codegen`, mapping the
  current `public` schema into TypeScript interfaces.

Commit both the new `.sql` file and the updated `src/types/db.d.ts` file.
