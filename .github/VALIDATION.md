# Validation

Runs on every pull request targeting `main`, and can also be started manually. All checks currently
run regardless of changed paths, so shared layers, backend code, workspace dependencies, and CI
configuration changes cannot bypass validation.

- **Repository lint and format** runs the root `format:check` and `lint:check` scripts.
- **Check lexat / corpus / lexvad** builds each app independently. Typechecking is temporarily
  disabled pending a separate PR to fix the existing type errors. Matrix jobs continue when another
  app fails. Before building, each job runs `nuxt prepare` for its shared layer (`ui` for
  LexAT/LexVAD, `shadcn` for Corpus) to generate the layer’s `.nuxt/tsconfig.json`.
- **LexAT Playwright** prepares the `ui` layer, builds LexAT, starts and seeds PostgreSQL, runs its
  existing Chromium suite, and uploads `apps/lexat/playwright-report/`. Only this job uses the
  existing `testing` environment variables and secrets. Corpus and LexVAD do not yet have E2E
  suites.
- **Validate** is the single required status check to select in branch protection or repository
  rulesets. It succeeds only when every preceding job succeeds; failures, cancellations, and skipped
  jobs fail the gate.

The app matrix uses local placeholder URLs and does not require testing secrets. Repository
lint/format covers all workspaces, but dedicated build jobs currently cover only LexAT, Corpus, and
LexVAD. Backend integration tests are not part of this workflow yet.

To add an app, extend the matrix with its app and layer names and provide its `types:check` and
`build` scripts. Add future E2E jobs separately, with their own service setup and report names, and
include them in the final `validate` job's `needs` list. If CI runtime becomes an issue, add
affected-app detection inside this workflow; retain the unconditional entry point and update the
gate to distinguish intentional skips from missing checks.

## TypeScript boundaries

The three frontend `types:check` scripts first build `@lapis/backend`, which generates
`apps/backend/dist/app.d.ts`, then run `nuxt typecheck`. The `@lapis/backend/api` type export points
to that bundled declaration file. This preserves Hono RPC response inference without including
backend implementation, tests, or tooling in frontend TypeScript projects. These scripts remain
available locally while the CI typecheck step is disabled. Uncomment that step in `validate.yml` to
restore CI typechecking after fixing the errors.

After a fresh checkout, run `pnpm --filter @lapis/backend build` to make the API types available in
the editor. Rebuild after backend API changes; the frontend `types:check` scripts always do this
automatically. Do not commit the generated `dist` files.

Nuxt generates frontend aliases from `nuxt.config.ts`. Do not add the backend as a frontend
TypeScript project reference: `nuxt typecheck` uses build mode for project references, and would
check backend tests in each frontend job again. Backend tests still need their own separate
validation job.
