# Testing Day Counter

Run `mise install` from the repository root to install Node 24, matching the Lambda runtime in `ask-resources.json`.
Run the commands below through `mise exec --` from `lambda/` after `mise exec -- npm ci`.

| Command | Scope | External access |
| --- | --- | --- |
| `mise exec -- npm test` | Unit and local integration tests, with runtime coverage thresholds | None |
| `mise exec -- npm run test:unit` | Date and date-range calculations | None |
| `mise exec -- npm run test:integration` | Lambda handler and ASK SDK with an in-memory DynamoDB substitute | None |
| `mise exec -- npm run test:e2e` | German and US English workflows against the development skill | Alexa, DynamoDB |
| `mise exec -- npm run lint` | ESLint checks | None |

## Offline tests and coverage

Offline commands preload `test/env.js`, which sets a dummy skill ID and keeps local checks independent of deployment
configuration; they do not read `.env`. `test/setup.js` replaces the DynamoDB model operations used by the handlers
with an in-memory store.

`mise exec -- npm test` includes unexecuted runtime files in coverage and enforces at least 90% line, statement, and
function coverage and 85% branch coverage. Reports are written to `lambda/coverage/`.

GitHub Actions runs lint and the offline suite on Node 24 in both UTC and Europe/Berlin. Running in both time zones
helps catch date handling that accidentally depends on the Lambda host time zone.

## Deployed Alexa workflows

Install and configure ASK CLI, then create a dedicated test account profile. Copy `.env.example` to `.env`, set
`SKILL_ID`, and set `ASK_PROFILE` to that profile name. The profile is required; the E2E runner never falls back to
`default` because these tests write persistent counter data.

Deploy the intended Lambda code and all interaction models, wait for the model builds to finish, and then run:

```bash
mise exec -- npm run test:e2e
```

The German workflow resets `2020-03-03` to 40, increases it to 42, queries it, and verifies its same-day sum. The US
English workflow does the same on `2020-03-04`, resetting 50 and increasing to 53. Each run is deterministic but leaves
those sentinel values in the dedicated account. The tests exercise the already-deployed development skill and do not
deploy code or models themselves, so they are intentionally excluded from ordinary GitHub Actions checks.

The runner validates resolved intents, normalized slots, localized speech, and the Lambda response for every step. It
allows two attempts only for incomplete output or Alexa's known transient simulation error, bounds every ASK process,
and removes temporary replay and output files.

To replay one utterance for diagnostics, run from `lambda/`:

```bash
mise exec -- node --env-file-if-exists=.env test/run-dialog.js -r test/e2e/de-DE/query.json
```

## Before release: device checks

The offline suite does not verify speech recognition, pronunciation, microphone behavior, or cards in the Alexa app.
Before releasing, check launch, help, cancel, and stop as well as setting, increasing, querying, and summing counters
for both the current day and explicit dates on a real device or in the Alexa developer console.
