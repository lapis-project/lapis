# Validation

Runs on every pull request targeting `main`, and can also be started manually. All checks currently
run regardless of changed paths, so shared layers, backend code, workspace dependencies, and CI
configuration changes cannot bypass validation.

- **Repository lint and format** runs the root `format:check` and `lint:check` scripts.
- **Check lexat / corpus / lexvad** typechecks and builds each app independently. Matrix jobs
  continue when another app fails. Nuxt loads the shared `ui` and `shadcn` layers from source; no
  separate layer build is needed.
- **LexAT Playwright** builds LexAT, starts and seeds PostgreSQL, runs its existing Chromium suite,
  and uploads `apps/lexat/playwright-report/`. Only this job uses the existing `testing` environment
  variables and secrets. Corpus and LexVAD do not yet have E2E suites.
- **Validate** is the single required status check to select in branch protection or repository
  rulesets. It succeeds only when every preceding job succeeds; failures, cancellations, and skipped
  jobs fail the gate.

The app matrix uses local placeholder URLs and does not require testing secrets. Repository
lint/format covers all workspaces, but dedicated build/typecheck jobs currently cover only LexAT,
Corpus, and LexVAD. Backend integration tests are not part of this workflow yet.

To add an app, extend the matrix and provide its `types:check` and `build` scripts. Add future E2E
jobs separately, with their own service setup and report names, and include them in the final
`validate` job's `needs` list. If CI runtime becomes an issue, add affected-app detection inside
this workflow; retain the unconditional entry point and update the gate to distinguish intentional
skips from missing checks.
