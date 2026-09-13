import { SKILL_ID } from '../config.js';
import { runDialog } from './helpers/dialog.js';

const args = process.argv.slice(2);
const replayIndex = args.findIndex(arg => arg === '--replay' || arg === '-r');
const replayFile = args[replayIndex + 1];
if (replayIndex < 0 || !replayFile) {
    throw new Error('An ASK CLI replay file is required.');
}

runDialog(replayFile, { skillId: SKILL_ID, profile: process.env.ASK_PROFILE })
    .then(turns => {
        process.stdout.write(`${JSON.stringify({ turns })}\n`);
    })
    .catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
