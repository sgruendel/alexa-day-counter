# Testing Day Counter

Run `mise install` from the repository root to install Node 24, matching the Lambda runtime in `ask-resources.json`.
Run the commands below through `mise exec --` from `lambda/` after `mise exec -- npm ci`.

| Command | Scope | External access |
| --- | --- | --- |
| `mise exec -- npm test` | Unit and local integration tests, with runtime coverage thresholds | None |
| `mise exec -- npm run test:unit` | Date and date-range calculations | None |
| `mise exec -- npm run test:integration` | Lambda handler and ASK SDK with an in-memory DynamoDB substitute | None |
| `mise exec -- npm run lint` | ESLint checks | None |

## Offline tests and coverage

Offline commands preload `test/env.js`, which sets a dummy skill ID and keeps local checks independent of deployment
configuration; they do not read `.env`. `test/setup.js` replaces the DynamoDB model operations used by the handlers
with an in-memory store.

`mise exec -- npm test` includes unexecuted runtime files in coverage and enforces at least 90% line, statement, and
function coverage and 85% branch coverage. Reports are written to `lambda/coverage/`.

GitHub Actions runs lint and the offline suite on Node 24 in both UTC and Europe/Berlin. Running in both time zones
helps catch date handling that accidentally depends on the Lambda host time zone.

## Before release: device checks

The offline suite does not verify speech recognition, pronunciation, microphone behavior, or cards in the Alexa app.
Before releasing, check launch, help, cancel, and stop as well as setting, increasing, querying, and summing counters
for both the current day and explicit dates on a real device or in the Alexa developer console.
