# LIÖ

This is the frontend repository for the LIÖ project.

## how to run

prerequisites:

- [node.js >=24.11](https://nodejs.org/en/download)
- [pnpm >=10.25](https://pnpm.io/installation)

set required environment variables in `.env.dev.local` (development) and
`.env.prod.local` (production):

```bash
# in /apps/lioe
cp .env.local.example .env.dev.local
cp .env.local.example .env.prod.local
```

install dependencies:

```bash
pnpm install
```

run a development server from the root folder on [http://localhost:3000](http://localhost:3000):

```bash
pnpm dev:lioe
```

build the application:

```bash
pnpm build:lioe
```
