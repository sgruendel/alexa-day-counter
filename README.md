# alexa-day-counter
Alexa Skill for persistent counting of events per day

## Configuration

Commands are run from the `lambda/` directory. Copy `.env.example` to `.env` and set `SKILL_ID` to the Alexa skill
ID. The local file is ignored by Git.

GitHub Actions reads `SKILL_ID` from a repository variable. The deployed Lambda function must provide the same
variable in its environment configuration.

## Testing

Run commands from the `lambda/` directory:

```bash
npm test
```

## TODO
- when requesting a week, consider locale to determine first day of week, don't hard code Monday
- Add named counters, feedback from Amazon.com:
  There could be a feature to count for a specific thing. Like add 20 to pushups, add I to cup of water, but it does what it says it will, so good enough.
- Export charts in S3 and show as response card: https://www.npmjs.com/package/chartjs-node
