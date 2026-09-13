import { execFile } from 'node:child_process';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { expect } from 'chai';

import { summarizeTurns, verifyTurns } from '../ask.js';
import { parseDialogOutput, runDialog } from '../helpers/dialog.js';

const successfulTurn = ({
    caption = 'OK',
    intent = 'QueryCounterIntent',
    slots = { date: { value: '2020-03-03' } },
} = {}) => ({
    status: 'SUCCESSFUL',
    result: {
        alexaExecutionInfo: { alexaResponses: [{ type: 'Speech', content: { caption } }] },
        skillExecutionInfo: {
            invocations: [
                {
                    invocationRequest: {
                        body: { request: { type: 'IntentRequest', intent: { name: intent, slots } } },
                    },
                    invocationResponse: { body: { response: {} } },
                },
            ],
        },
    },
});

const output = (...turns) => ({ invocations: turns.map(body => ({ response: { body } })) });

async function rejection(promise) {
    try {
        await promise;
    } catch (error) {
        return error;
    }
    throw new Error('Expected rejection');
}

describe('dialog runner', () => {
    let directory;
    let replayFile;
    let tempInput;

    beforeEach(async () => {
        directory = await mkdtemp(path.join(tmpdir(), 'alexa-dialog-test-'));
        replayFile = path.join(directory, 'replay.json');
        await writeFile(replayFile, JSON.stringify({ locale: 'de-DE', userInput: ['hello', '.quit'] }));
    });

    afterEach(async () => {
        await rm(directory, { recursive: true, force: true });
        if (tempInput) {
            expect((await rejection(access(tempInput))).code).to.equal('ENOENT');
        }
        tempInput = undefined;
    });

    const fakeRun = (responses, inspect = () => {}) => async (command, args, options) => {
        tempInput = args[args.indexOf('--replay') + 1];
        inspect(command, args, options);
        const replay = JSON.parse(await readFile(tempInput, 'utf8'));
        expect(replay.skillId).to.equal('test-skill');
        expect(replay).to.not.have.property('allowRetry');
        await writeFile(args[args.indexOf('--save-skill-io') + 1], JSON.stringify(responses));
        return { stdout: '', stderr: '' };
    };

    it('retains and validates every completed turn', async () => {
        const turns = await runDialog(replayFile, {
            skillId: 'test-skill',
            profile: 'test-profile',
            run: fakeRun(output(successfulTurn({ caption: 'First' })), (command, args, options) => {
                expect(command).to.equal('ask');
                expect(args[args.indexOf('--stage') + 1]).to.equal('development');
                expect(args[args.indexOf('--profile') + 1]).to.equal('test-profile');
                expect(options.timeout).to.equal(35000);
                expect(options.killSignal).to.equal('SIGKILL');
            }),
        });

        verifyTurns(turns, [
            {
                speech: 'First',
                intent: 'QueryCounterIntent',
                slots: { date: '2020-03-03' },
            },
        ]);
        expect(() => verifyTurns(turns, [{ speech: 'Wrong', intent: 'QueryCounterIntent' }])).to.throw();
    });

    it('fails an earlier error even when the final poll succeeds', async () => {
        let attempts = 0;
        const run = fakeRun(
            output(
                { status: 'FAILED', result: { error: { message: 'Invalid response' } } },
                successfulTurn(),
            ),
        );
        const error = await rejection(
            runDialog(replayFile, {
                skillId: 'test-skill',
                profile: 'test-profile',
                run: (...args) => {
                    attempts += 1;
                    return run(...args);
                },
            }),
        );
        expect(error.message).to.contain('Turn 1: Invalid response');
        expect(attempts).to.equal(1);
    });

    it('prioritizes non-retryable errors over an earlier transient error', () => {
        expect(() =>
            parseDialogOutput(
                output(
                    {
                        status: 'FAILED',
                        result: { error: { message: 'An unexpected error occurred.' } },
                    },
                    { status: 'FAILED', result: { error: { message: 'Invalid response' } } },
                ),
                2,
            ),
        ).to.throw('Turn 2: Invalid response');
    });

    it('deduplicates repeated polls by simulation ID', () => {
        const turn = { ...successfulTurn(), id: 'one' };
        expect(parseDialogOutput(output({ id: 'one', status: 'IN_PROGRESS' }, turn, turn), 1)).to.have.length(1);
    });

    it('retries incomplete output, then returns all turns', async () => {
        let attempts = 0;
        const turns = await runDialog(replayFile, {
            skillId: 'test-skill',
            profile: 'test-profile',
            retryDelayMs: 1,
            run: (...args) => {
                attempts += 1;
                const responses = attempts === 1 ? output() : output(successfulTurn());
                return fakeRun(responses)(...args);
            },
        });
        expect(attempts).to.equal(2);
        expect(turns).to.have.length(1);
    });

    it('bounds retries of the known transient simulation error', async () => {
        let attempts = 0;
        const run = fakeRun(
            output({ status: 'FAILED', result: { error: { message: 'An unexpected error occurred.' } } }),
        );
        const error = await rejection(
            runDialog(replayFile, {
                skillId: 'test-skill',
                profile: 'test-profile',
                retryDelayMs: 1,
                run: (...args) => {
                    attempts += 1;
                    return run(...args);
                },
            }),
        );
        expect(attempts).to.equal(2);
        expect(error.message).to.contain('unexpected error');
    });

    it('does not retry a state-changing replay', async () => {
        await writeFile(
            replayFile,
            JSON.stringify({ locale: 'de-DE', allowRetry: false, userInput: ['set counter', '.quit'] }),
        );
        let attempts = 0;
        const run = fakeRun(
            output({ status: 'FAILED', result: { error: { message: 'An unexpected error occurred.' } } }),
        );
        const error = await rejection(
            runDialog(replayFile, {
                skillId: 'test-skill',
                profile: 'test-profile',
                retryDelayMs: 1,
                run: (...args) => {
                    attempts += 1;
                    return run(...args);
                },
            }),
        );
        expect(attempts).to.equal(1);
        expect(error.message).to.contain('unexpected error');
    });

    it('does not retry missing speech or malformed JSON', async () => {
        expect(() => parseDialogOutput(output({ status: 'SUCCESSFUL', result: {} }), 1)).to.throw(
            'missing Alexa speech',
        );

        let attempts = 0;
        const error = await rejection(
            runDialog(replayFile, {
                skillId: 'test-skill',
                profile: 'test-profile',
                run: async (...runArgs) => {
                    const args = runArgs[1];
                    attempts += 1;
                    tempInput = args[args.indexOf('--replay') + 1];
                    await writeFile(args[args.indexOf('--save-skill-io') + 1], '{');
                    return {};
                },
            }),
        );
        expect(error).to.be.instanceOf(SyntaxError);
        expect(attempts).to.equal(1);
    });

    it('reports only controlled metadata when the ASK process fails', async () => {
        const error = await rejection(
            runDialog(replayFile, {
                skillId: 'test-skill',
                profile: 'test-profile',
                run: async (...runArgs) => {
                    const args = runArgs[1];
                    tempInput = args[args.indexOf('--replay') + 1];
                    const processError = new Error('Command failed with secret-token');
                    processError.code = 2;
                    processError.signal = null;
                    processError.killed = false;
                    processError.stdout = '{"apiAccessToken":"secret-token"}';
                    processError.stderr = 'secret-token';
                    throw processError;
                },
            }),
        );

        expect(error.message).to.equal('ASK CLI failed (code: 2, signal: none, killed: false)');
        expect(error).to.not.have.property('stdout');
        expect(error).to.not.have.property('stderr');
        expect(JSON.stringify(error)).to.not.contain('secret-token');
    });

    it('kills a stalled subprocess and cleans up its replay files', async () => {
        let attempts = 0;
        const error = await rejection(
            runDialog(replayFile, {
                skillId: 'test-skill',
                profile: 'test-profile',
                attemptTimeoutMs: 50,
                run: (command, args, options) => {
                    attempts += 1;
                    tempInput = args[args.indexOf('--replay') + 1];
                    return promisify(execFile)(
                        process.execPath,
                        ['-e', 'setInterval(() => {}, 1000)'],
                        options,
                    );
                },
            }),
        );
        expect(error.killed).to.equal(true);
        expect(error.signal).to.equal('SIGKILL');
        expect(attempts).to.equal(1);
    });

    it('rejects missing configuration before launching ASK', async () => {
        expect((await rejection(runDialog(replayFile))).message).to.contain('SKILL_ID');
        expect((await rejection(runDialog(replayFile, { skillId: 'test-skill' }))).message).to.contain(
            'ASK_PROFILE',
        );
        expect(
            (await rejection(runDialog(replayFile, { skillId: 'test-skill', profile: 'default' }))).message,
        ).to.contain('non-default');
    });

    it('summarizes diagnostics without exposing the request envelope', () => {
        const turn = successfulTurn();
        turn.result.skillExecutionInfo.invocations[0].invocationRequest.body.context = {
            System: { apiAccessToken: 'secret-token' },
        };

        const summary = summarizeTurns([turn]);
        expect(summary).to.deep.equal([
            {
                turn: 1,
                status: 'SUCCESSFUL',
                speech: 'OK',
                intents: [
                    {
                        name: 'QueryCounterIntent',
                        slots: { date: '2020-03-03' },
                    },
                ],
            },
        ]);
        expect(JSON.stringify(summary)).to.not.contain('secret-token');
    });
});
