import { expect } from 'chai';

import { runDialog } from './helpers/dialog.js';

function caption(result) {
    return result.alexaExecutionInfo.alexaResponses
        .filter(response => response.type === 'Speech')
        .map(response => response.content.caption.trim())
        .join(' ');
}

export function summarizeTurns(turns) {
    return turns.map((turn, index) => {
        const result = turn.result;
        const invocations = result.skillExecutionInfo?.invocations ?? [];
        const intents = invocations
            .map(invocation => invocation.invocationRequest?.body?.request)
            .filter(request => request?.type === 'IntentRequest')
            .map(request => ({
                name: request.intent.name,
                slots: Object.fromEntries(
                    Object.entries(request.intent.slots ?? {}).map(([name, slot]) => [name, slot.value]),
                ),
            }));

        return {
            turn: index + 1,
            status: turn.status,
            speech: caption(result),
            intents,
        };
    });
}

/** Assert the speech and skill request/response contract of every dialog turn. */
export function verifyTurns(turns, expectations) {
    expect(turns, 'dialog turns').to.have.length(expectations.length);
    for (const [index, expected] of expectations.entries()) {
        const result = turns[index].result;
        expect(caption(result), `turn ${index + 1} speech`).to.equal(expected.speech);

        const invocations = result.skillExecutionInfo?.invocations ?? [];
        const intentInvocation = invocations
            .filter(invocation => invocation.invocationRequest?.body?.request?.type === 'IntentRequest')
            .at(-1);
        expect(intentInvocation, `turn ${index + 1} skill invocation`).to.exist;

        const request = intentInvocation.invocationRequest.body.request;
        expect(request.intent.name, `turn ${index + 1} intent`).to.equal(expected.intent);
        for (const [name, value] of Object.entries(expected.slots ?? {})) {
            expect(request.intent.slots?.[name]?.value, `turn ${index + 1} ${name} slot`).to.equal(value);
        }
        expect(intentInvocation.invocationResponse?.body?.response, `turn ${index + 1} skill response`).to.exist;
    }
}

export async function verifyDialog(replayFile, expectations) {
    const turns = await runDialog(replayFile, {
        skillId: process.env.SKILL_ID,
        profile: process.env.ASK_PROFILE,
    });
    verifyTurns(turns, expectations);
}
