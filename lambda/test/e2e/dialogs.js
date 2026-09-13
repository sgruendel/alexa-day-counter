import { readFileSync } from 'node:fs';

import { verifyDialog } from '../ask.js';

const workflows = JSON.parse(readFileSync(new URL('./workflows.json', import.meta.url), 'utf8'));

describe('Alexa development skill workflows', function () {
    this.timeout(360000);

    for (const [locale, steps] of Object.entries(workflows)) {
        it(locale, async () => {
            for (const { replay, ...expectation } of steps) {
                await verifyDialog(new URL(replay, import.meta.url), [expectation]);
            }
        });
    }
});
