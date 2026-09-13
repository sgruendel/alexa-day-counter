# alexa-day-counter

[![CI](https://github.com/sgruendel/alexa-day-counter/actions/workflows/node.js.yaml/badge.svg?branch=master)](https://github.com/sgruendel/alexa-day-counter/actions/workflows/node.js.yaml)
[![Node.js 24](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)](mise.toml)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)

Alexa Skill for persistent counting of events per day.

## Configuration

Commands are run from the `lambda/` directory. Copy `.env.example` to `.env` and set `SKILL_ID` to the Alexa skill
ID. The local file is ignored by Git. The deployed Lambda function must provide the same variable in its environment
configuration.

## Testing

Run `mise install` from the repository root, then run the offline checks from `lambda/`:

```bash
npm ci
npm run lint
npm test
```

See [TESTING.md](TESTING.md) for the individual suites and CI setup.

## TODO

- When requesting a week, consider the locale to determine its first day instead of hard-coding Monday.
- Add named counters. Feedback from Amazon.com:
  There could be a feature to count for a specific thing. Like add 20 to pushups, add I to cup of water, but it does
  what it says it will, so good enough.
- Export charts in S3 and show them as a response card: <https://www.npmjs.com/package/chartjs-node>
