# Lapis

## Requirements

- Node 22
- `pnpm` package manager (can be enabled through
  [corepack](https://pnpm.io/installation#using-corepack) via `corepack enable pnpm`)

## Quick Start for LexAT

1. Clone the repository
2. Install dependencies from root via `pnpm i`
3. Run `pnpm dev:lexat` to start the LexAT application on port `3000` (Note: authentication between
   localhost and production is currently not supported -> follow the `Local Setup for LexAT` guide
   below to enable all functionality)

## Local Setup for LexAT

In order to start locally developing on the LexAT platform, you'll need:

- [docker](https://docs.docker.com/engine/install/ubuntu/) installed on your system
- a locally running database instance (ideally filled with dummy data)
- a locally running backend (/apps/backend)
- a locally running frontend (/apps/lexat)

### Setup & run PostgreSQL instance

1. Spin up a PostgreSQL instance via Docker:

   `docker compose --env-file .env.localsetup up -d`

2. Verify that a container instance is running by typing `docker ps`

3. Fill the database with dummy data

   `docker exec -i lapis-dev-database-1  psql -U lapis_dev lapis_dev < ./db/lapis_dump.sql`

### Setup & run backend

1. Navigate to `/apps/backend` and create a `.env.local` file
2. Copy the contents from `.env.local.example` into `.env.local` and ask a LexAT team member for
   viable keys
3. Run the backend either via `pnpm dev:backend` (in root) or `pnpm dev` (in `/apps/backend`)
4. The app should now be running on port `5000` (default)

### Setup & run frontend

1. Navigate to `/apps/lexat` and create a `.env.dev.local` file
2. Copy the contents from `.env.local.example` into `.env.dev.local` and ask a LexAT team member for
   viable keys
3. Run the frontend either via `pnpm dev-local:lexat` (in root) or `pnpm dev-local` (in
   `/apps/lexat`)
4. The app should now be running on port `3000` (default)

### (Optional) Run GUI for Ceph S3

1. Run the following command in your terminal

```shell
docker run -it \
  -p 8080:8080 \
  -e 'ACCESS_KEY_ID=<ACCESS_KEY_ID>' \
  -e 'SECRET_ACCESS_KEY=<SECRET_ACCESS_KEY>' \
  -e 'ENDPOINT=s3.acdh-ch-dev.oeaw.ac.at' \
  cloudlena/s3manager
```

2. The GUI should now be running on port `8080`
