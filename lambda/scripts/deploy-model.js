import { spawnSync } from 'node:child_process';

import { SKILL_ID } from '../config.js';

const locales = ['de-DE', 'en-AU', 'en-CA', 'en-GB', 'en-IN', 'en-US'];

for (const locale of locales) {
    const result = spawnSync(
        'ask',
        [
            'smapi',
            'set-interaction-model',
            '--skill-id',
            SKILL_ID,
            '--stage',
            'development',
            '--locale',
            locale,
            '--interaction-model',
            `file:../skill-package/interactionModels/custom/${locale}.json`,
            '--profile',
            'default',
        ],
        { stdio: 'inherit' },
    );

    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        process.exitCode = result.status ?? 1;
        break;
    }
}
