# Lapis

## Architecture

For details on the project's architecture, see [Architecture](architecture.md).

## Requirements

- `Node` >=24.19
- `pnpm` >=11.25 (can be enabled through [corepack](https://pnpm.io/installation#using-corepack) via
  `corepack enable pnpm`)
- [docker](https://docs.docker.com/engine/install/ubuntu/) (for local development)
- Optional: [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script) for node
  version management

## Quick Start

1. Clone the repository
2. Install dependencies in the project root via `pnpm i`
3. Build all shared nuxt layers via `Tasks: Run Task` > `Build Nuxt Layers`
4. Setup a PostgreSQL container via `Tasks: Run Task` > `Start DB Container`
5. Seed the DB via `Tasks: Run Task` > `Seed DB`

Hint: VSCode tasks can be run by opening the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on
macOS).

### Setup Backend .env file

```bash
# in /apps/backend
cp .env.local.example .env.dev.local
```

Ask a LAPIS team member for any secret keys

### Setup Frontend .env files

```bash
# in /apps/<app>
cp .env.local.example .env.dev.local
```

MacOS Users: don't use default port `5000` for `NUXT_PUBLIC_API_BASE_URL`

Ask a LAPIS team member for any secret keys

### Run Applications

To start an application, run its respective VSCode task. E.g. `Tasks: Run Task` > `Start Backend`

## (Optional) Manual PostgreSQL setup

1. Spin up a PostgreSQL instance via Docker:

   `docker compose --env-file .env.localsetup up -d`

2. Verify that a container instance is running by typing `docker ps`
3. Fill the database with dummy data

   `docker exec -i lapis-dev-database-1  psql -U lapis_dev lapis_dev < ./db/lapis_dump.sql`

## Run GUI for Ceph S3

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

## Troubleshooting

### Reset local DB

To completely shut down the db container and delete any associated volumes:

- Run task "Reset DB"
- OR `docker compose --env-file .env.localsetup down`

### Reset repository

This is **the** go-to recipe when facing strange errors in your application

1. `Tasks: Run Task` > `Clean workspace (node_modules + caches)`
2. `pnpm i`
3. `Tasks: Run Task` > `Build Nuxt Layers`

You're welcome ✌🏻

## Setup for mobile testing (local)

### Network Requirements

Ensure both your development machine and your Android/iOS device are connected to the same Wi-Fi
network.

### Identify your local IP address

Find your machine's local IP (e.g., `192.168.x.x`):

- Windows: Run `ipconfig` in PowerShell/CMD (look for "IPv4 Address").

- macOS: Run `ipconfig getifaddr en0` in the terminal.

- Linux: Run `ip -4 addr show wlan0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'` in the console.

### Environment Configuration

Update your local environment files. Note: Ensure these changes are made in your
`.env.*.local`/`.env.local` files to avoid committing private network configurations to the
repository.

#### Backend

In `apps/backend/.env.local` add your machine's network address to the allowed origins to permit
cross-device requests:

```bash
ALLOWED_ORIGINS="http://localhost:3000,http://192.168.x.x:3000"
```

#### Frontend

In `apps/lexat/.env.dev.local` update the base URLs to point to your machine's IP instead of
localhost:

```bash
NUXT_PUBLIC_APP_BASE_URL="http://192.168.x.x:3000"
NUXT_PUBLIC_API_BASE_URL="http://192.168.x.x:5000"
```

### Accessing the app

1. Start both the backend and frontend servers.

2. On your mobile device, open a browser and navigate to: `http://192.168.x.x:3000`

## Dependencies

### Playwright

after every playwright update, execute `pnpm exec playwright install` in the respective app folder
to download the latest browser runtimes
