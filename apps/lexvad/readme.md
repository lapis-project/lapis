# LexVAD

This is the frontend repository for the LexVAD project. You can access the current development build
via https://lexvad.acdh-dev.oeaw.ac.at/

## how to run

prerequisites:

- [node.js >=24.11](https://nodejs.org/en/download)
- [pnpm >=10.25](https://pnpm.io/installation)

set required environment variables in `.env.dev.local` (development against local backend) and
`.env.prod.local` (development against production backend):

```bash
# in /apps/lexvad
cp .env.local.example .env.dev.local
cp .env.local.example .env.prod.local
```

additionally change `NUXT_PUBLIC_API_BASE_URL` to `"http://localhost:5000"` in `.env.dev.local`

install dependencies:

```bash
pnpm install
```

run a development server from the root folder on [http://localhost:3000](http://localhost:3000):

```bash
# dev server against production backend
pnpm dev:lexvad
# dev server against local backend
pnpm dev:backend
pnpm dev-local:lexvad
```

build the application:

```bash
pnpm build:lexvad
```
