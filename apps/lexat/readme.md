# LexAT

This is the frontend repository for the LexAT project. You can access the current development build
via https://lexat.acdh-ch-dev.oeaw.ac.at/

## how to run

prerequisites:

- [node.js 20.x](https://nodejs.org/en/download)
- [pnpm 9.x](https://pnpm.io/installation)

set required environment variables in `.env.local`:

```bash
cp .env.local.example .env.local
```

install dependencies:

```bash
pnpm install
```

run a development server on [http://localhost:3000](http://localhost:3000):

```bash
pnpm dev:lexat
```

build the application:

```bash
pnpm build:lexat
```
