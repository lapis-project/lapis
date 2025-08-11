# Lapis

## Architecture

For details on the project's architecture, see [Architecture](architecture.md).

## Requirements

- Node >=22.18
- `pnpm` package manager (can be enabled through
  [corepack](https://pnpm.io/installation#using-corepack) via `corepack enable pnpm`)
- [docker](https://docs.docker.com/engine/install/ubuntu/) installed on your system (for local
  development)
- Optional: [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script) for node
  version management

## Quick start for LexAT21

1. Clone the repository
2. Install dependencies from the project root via `pnpm i`
3. Run `pnpm dev:lexat` to start the LexAT application on port `3000` (Note: authentication between
   localhost and production is currently not supported -> follow `Setup for local development` to
   setup a full-stack environment)

## Setup for local development

### Setup backend .env files

1. Navigate to `/apps/backend` and create a `.env.local` file
2. Copy the contents from `.env.local.example` into `.env.local` and ask a Lapis team member for
   viable keys

### Setup LexAT21 .env files

1. Navigate to `/apps/lexat` and create a `.env.dev.local` file
2. Copy the contents from `.env.local.example` into `.env.dev.local` and ask a Lapis team member for
   viable keys

### Setup Corpus .env files

1. Navigate to `/apps/corpus` and create a `.env.dev.local` file
2. TODO

### Build UI Layer

1. In the project's root run `pnpm build` to generate the `.nuxt` folder (this is neccessary for
   extending Nuxt's default `tsconfig`)

### Option 1: Run setup via VSCode task

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
2. Search for `Tasks: Run Task`
3. Select `Full Local Setup - LexAT21` or `Full Local Setup - Corpus`

### Option 2: Run setup manually

#### Setup & run PostgreSQL instance

1. Spin up a PostgreSQL instance via Docker:

   `docker compose --env-file .env.localsetup up -d`

2. Verify that a container instance is running by typing `docker ps`
3. Fill the database with dummy data

   `docker exec -i lapis-dev-database-1  psql -U lapis_dev lapis_dev < ./db/lapis_dump.sql`

#### Run backend

1. Run the backend either via `pnpm dev:backend` (in root) or `pnpm dev` (in `/apps/backend`)
2. The app should now be running on port `5000` (default)

#### Run frontend

1. Run the frontend either via `pnpm dev-local:<lexat | corpus>` (in project root) or
   `pnpm dev-local` (in `/apps/<lexat | corpus>`)
2. The app should now be running on port `3000` (default)

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

### Reset local DB

To completely shut down the db container and delete any associated volumes:

- Run task "Reset DB"
- OR `docker compose --env-file .env.localsetup down`

## Dependencies

### Playwright

after every playwright update, execute `pnpm exec playwright install` in the lexat folder to
download the latest browser runtimes
