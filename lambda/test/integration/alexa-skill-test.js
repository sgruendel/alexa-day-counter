import { expect } from 'chai';

import { handler } from '../../index.js';
import { intentRequest, launchRequest, sessionEndedRequest, slot, USER_ID } from '../helpers/alexa.js';
import { resetCounts } from '../setup.js';

function speech(responseEnvelope) {
    return responseEnvelope.response.outputSpeech.ssml;
}

function slots(date, count) {
    return {
        date: slot('date', date),
        ...(count === undefined ? {} : { count: slot('count', count) }),
    };
}

describe('Tageszähler skill workflow', () => {
    it('handles a launch request', async () => {
        const result = await handler(launchRequest(), {});

        expect(speech(result)).to.contain('Der Tageszähler zählt Ereignisse pro Tag');
        expect(result.response.reprompt.outputSpeech.ssml).to.contain('Sage „Setze den Wert auf Zahl“');
        expect(result.response.shouldEndSession).to.equal(false);
    });

    it('handles the help intent', async () => {
        const result = await handler(intentRequest('AMAZON.HelpIntent'), {});

        expect(speech(result)).to.contain('Der Tageszähler zählt Ereignisse pro Tag');
        expect(result.response.reprompt.outputSpeech.ssml).to.contain('Sage „Setze den Wert auf Zahl“');
        expect(result.response.shouldEndSession).to.equal(false);
    });

    for (const intentName of ['AMAZON.CancelIntent', 'AMAZON.StopIntent']) {
        it(`handles ${intentName}`, async () => {
            const result = await handler(intentRequest(intentName), {});

            expect(speech(result)).to.contain('bis dann');
            expect(result.response).to.not.have.property('reprompt');
            expect(result.response.shouldEndSession).to.equal(true);
        });
    }

    it('handles a session-ended request', async () => {
        const result = await handler(sessionEndedRequest('ERROR'), {});

        expect(result.response).to.not.have.property('outputSpeech');
        expect(result.response).to.not.have.property('reprompt');
        expect(result.response.shouldEndSession).to.equal(true);
    });

    it('uses the error handler for unsupported intents', async () => {
        const result = await handler(intentRequest('UnsupportedIntent'), {});

        expect(speech(result)).to.contain('Entschuldigung, das verstehe ich nicht.');
        expect(result.response.reprompt.outputSpeech.ssml).to.contain('Entschuldigung, das verstehe ich nicht.');
        expect(result.response.shouldEndSession).to.equal(false);
    });

    describe('SetCounterIntent', () => {
        it('sets the counter for today', async () => {
            const result = await handler(intentRequest('SetCounterIntent', slots(undefined, '1')), {});

            expect(speech(result)).to.contain('Der Zähler steht jetzt auf 1.');
        });

        it('sets the counter for a specified date', async () => {
            const result = await handler(intentRequest('SetCounterIntent', slots('2018-03-07', '2')), {});

            expect(speech(result)).to.contain('Der Zähler steht jetzt auf 2 für 2018-03-07.');
        });

        it('rejects a non-specific date', async () => {
            const result = await handler(intentRequest('SetCounterIntent', slots('2018-03', '3')), {});

            expect(speech(result)).to.contain('Ich kann den Zähler nur für konkrete Tage setzen.');
        });

        it('rejects a non-numeric count', async () => {
            const result = await handler(intentRequest('SetCounterIntent', slots(undefined, '?')), {});

            expect(speech(result)).to.contain('Das ist kein Wert, den ich setzen kann.');
        });

        it('requires a count', async () => {
            const result = await handler(
                intentRequest('SetCounterIntent', { date: slot('date'), count: slot('count') }),
                {},
            );

            expect(speech(result)).to.contain('Kein Wert angegeben.');
        });
    });

    describe('IncreaseCounterIntent', () => {
        it('increases the counter for today', async () => {
            await handler(intentRequest('SetCounterIntent', slots(undefined, '1')), {});

            const result = await handler(intentRequest('IncreaseCounterIntent', slots(undefined, '1')), {});

            expect(speech(result)).to.contain('Der Zähler steht jetzt auf 2.');
        });

        it('starts a counter that is not set', async () => {
            const result = await handler(intentRequest('IncreaseCounterIntent', slots('2018-03-05', '3')), {});

            expect(speech(result)).to.contain('Der Zähler steht jetzt auf 3 für 2018-03-05.');
        });

        it('increases an existing counter', async () => {
            resetCounts([{ userId: USER_ID, date: '2018-03-06', count: 5 }]);

            const result = await handler(intentRequest('IncreaseCounterIntent', slots('2018-03-06', '2')), {});

            expect(speech(result)).to.contain('Der Zähler steht jetzt auf 7 für 2018-03-06.');
        });

        it('rejects a non-specific date', async () => {
            const result = await handler(intentRequest('IncreaseCounterIntent', slots('2018-03', '4')), {});

            expect(speech(result)).to.contain('Ich kann den Zähler nur für konkrete Tage setzen.');
        });

        it('rejects a non-numeric count', async () => {
            const result = await handler(intentRequest('IncreaseCounterIntent', slots(undefined, '?')), {});

            expect(speech(result)).to.contain('Das ist kein Wert, den ich setzen kann.');
        });

        it('requires a count', async () => {
            const result = await handler(
                intentRequest('IncreaseCounterIntent', { date: slot('date'), count: slot('count') }),
                {},
            );

            expect(speech(result)).to.contain('Kein Wert angegeben.');
        });
    });

    describe('QueryCounterIntent', () => {
        it('returns the counter for today', async () => {
            await handler(intentRequest('SetCounterIntent', slots(undefined, '2')), {});

            const result = await handler(intentRequest('QueryCounterIntent', slots()), {});

            expect(speech(result)).to.contain('Der Zähler steht auf 2.');
        });

        it('returns a counter for a specified date', async () => {
            resetCounts([{ userId: USER_ID, date: '2018-03-07', count: 2 }]);

            const result = await handler(intentRequest('QueryCounterIntent', slots('2018-03-07')), {});

            expect(speech(result)).to.contain('Der Zähler steht auf 2 für 2018-03-07.');
        });

        it('reports a date without a counter', async () => {
            const result = await handler(intentRequest('QueryCounterIntent', slots('2018-03-01')), {});

            expect(speech(result)).to.contain('Der Zähler ist nicht gesetzt für 2018-03-01.');
        });

        it('rejects a non-specific date', async () => {
            const result = await handler(intentRequest('QueryCounterIntent', slots('2018-03')), {});

            expect(speech(result)).to.contain('Ich kann den Zähler bisher nur für konkrete Tage abfragen.');
        });
    });

    describe('QuerySumIntent', () => {
        it('returns the sum and card for a date range', async () => {
            resetCounts([
                { userId: USER_ID, date: '2018-03-07', count: 2 },
                { userId: USER_ID, date: '2018-03-05', count: 3 },
                { userId: USER_ID, date: '2018-03-06', count: 7 },
            ]);

            const result = await handler(intentRequest('QuerySumIntent', slots('2018-03')), {});

            expect(speech(result)).to.contain('Die Summe ist 12 von 2018-03-01 bis 2018-03-31.');
            expect(result.response.card).to.include({
                type: 'Simple',
                title: 'Summe von 2018-03-01 bis 2018-03-31',
            });
            expect(result.response.card.content).to.equal(
                '2018-03-05: 3\n2018-03-06: 7\n2018-03-07: 2\n',
            );
        });

        it('rejects an unsupported date range', async () => {
            const result = await handler(intentRequest('QuerySumIntent', slots('2017-SU')), {});

            expect(speech(result)).to.contain('Ich verstehe diesen Zeitraum leider nicht.');
        });
    });
});
