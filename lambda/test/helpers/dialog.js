import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

const execute = promisify(execFile);

export class SimulationError extends Error {
    constructor(message, retryable = false) {
        super(message);
        this.name = 'SimulationError';
        this.retryable = retryable;
    }
}

/** Return every completed turn; retain the final poll for each simulation ID. */
export function parseDialogOutput(output, expectedTurns) {
    const completed = new Map();
    for (const invocation of output.invocations ?? []) {
        const body = invocation.response?.body;
        if (body && body.status !== 'IN_PROGRESS') {
            completed.set(body.id ?? completed.size, body);
        }
    }

    const turns = [...completed.values()];
    let retryableError;
    for (const [index, turn] of turns.entries()) {
        const error = turn.result?.error;
        if (error) {
            const simulationError = new SimulationError(
                `Turn ${index + 1}: ${error.message}`,
                error.message === 'An unexpected error occurred.',
            );
            if (simulationError.retryable) {
                retryableError ??= simulationError;
                continue;
            }
            throw simulationError;
        }
        if (turn.status !== 'SUCCESSFUL') {
            throw new SimulationError(`Turn ${index + 1}: simulation status ${turn.status}`);
        }

        const responses = turn.result?.alexaExecutionInfo?.alexaResponses;
        const hasSpeech = Array.isArray(responses)
            && responses.some(response => response.type === 'Speech' && typeof response.content?.caption === 'string');
        if (!hasSpeech) {
            throw new SimulationError(`Turn ${index + 1}: missing Alexa speech`);
        }
    }

    if (retryableError) {
        throw retryableError;
    }

    if (turns.length !== expectedTurns) {
        throw new SimulationError(`Expected ${expectedTurns} completed turns, received ${turns.length}`, true);
    }
    return turns;
}

/** Run the development skill with bounded retries and a hard subprocess deadline. */
export async function runDialog(replayFile, {
    skillId,
    profile,
    run = execute,
    totalTimeoutMs = 80000,
    attemptTimeoutMs = 35000,
    retryDelayMs = 1000,
    maxAttempts = 2,
} = {}) {
    if (!skillId) {
        throw new Error('SKILL_ID is required for deployed Alexa tests');
    }
    if (!profile || profile === 'default') {
        throw new Error('ASK_PROFILE must name a dedicated, non-default profile for deployed Alexa tests');
    }

    const { allowRetry = true, ...replay } = JSON.parse(await readFile(replayFile, 'utf8'));
    const expectedTurns = replay.userInput.filter(input => !input.startsWith('.')).length;
    if (!expectedTurns) {
        throw new Error('A replay must contain at least one utterance');
    }

    const directory = await mkdtemp(path.join(tmpdir(), 'alexa-day-counter-dialog-'));
    const inputFile = path.join(directory, 'replay.json');
    const outputFile = path.join(directory, 'output.json');
    const deadline = performance.now() + totalTimeoutMs;

    try {
        await writeFile(inputFile, JSON.stringify({ ...replay, skillId }));
        const attempts = allowRetry ? maxAttempts : 1;
        for (let attempt = 1; attempt <= attempts; attempt += 1) {
            const remaining = Math.floor(deadline - performance.now());
            if (remaining <= 0) {
                throw new Error('ASK dialog deadline exceeded');
            }

            await writeFile(outputFile, JSON.stringify({ invocations: [] }));
            const { stdout, stderr } = await run(
                'ask',
                [
                    'dialog',
                    '--locale',
                    replay.locale ?? 'de-DE',
                    '--stage',
                    'development',
                    '--profile',
                    profile,
                    '--replay',
                    inputFile,
                    '--save-skill-io',
                    outputFile,
                ],
                {
                    encoding: 'utf8',
                    timeout: Math.min(attemptTimeoutMs, remaining),
                    killSignal: 'SIGKILL',
                    maxBuffer: 4 * 1024 * 1024,
                },
            );

            try {
                return parseDialogOutput(JSON.parse(await readFile(outputFile, 'utf8')), expectedTurns);
            } catch (error) {
                const retryable = error instanceof SimulationError && error.retryable;
                if (!retryable || attempt === attempts) {
                    error.message += `\nASK diagnostics:\n${stderr ?? ''}${stdout ?? ''}`;
                    throw error;
                }
                if (deadline - performance.now() <= retryDelayMs) {
                    throw new Error('ASK dialog deadline exceeded', { cause: error });
                }
                await delay(retryDelayMs);
            }
        }
        throw new Error('ASK dialog exhausted its attempts');
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
}
