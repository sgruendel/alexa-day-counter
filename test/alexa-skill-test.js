'use strict';

// include the testing framework
const alexaTest = require('alexa-skill-test-framework');

// initialize the testing framework
alexaTest.initialize(
    require('../src/index'),
    'amzn1.ask.skill.d3ee5865-d4bb-4076-b13d-fbef1f7e0216',
    'amzn1.ask.account.unit_test');
alexaTest.setLocale('de-DE');

describe('Daily Counter Skill', () => {
    describe('LaunchRequest', () => {
        alexaTest.test([
            {
                request: alexaTest.getLaunchRequest(),
                says: 'Der Tageszähler zählt Ereignisse pro Tag und speichert die Anzahl dauerhaft. Du kannst sagen „Starte Tageszähler und setze den Wert auf zwei“, oder „Starte Tageszähler und zähle eins dazu“, oder „Frag Tageszähler nach dem Stand“. Du kannst auch immer einen bestimmten Tag angeben wie „Gestern“ oder „Letzten Sonntag“, z.B. „Frag Tageszähler nach dem Stand von gestern“. Oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
                reprompts: 'Wie kann ich dir helfen?',
                shouldEndSession: false,
            },
        ]);
    });

    describe('HelpIntent', () => {
        alexaTest.test([
            {
                request: alexaTest.getIntentRequest('AMAZON.HelpIntent'),
                says: 'Der Tageszähler zählt Ereignisse pro Tag und speichert die Anzahl dauerhaft. Du kannst sagen „Starte Tageszähler und setze den Wert auf zwei“, oder „Starte Tageszähler und zähle eins dazu“, oder „Frag Tageszähler nach dem Stand“. Du kannst auch immer einen bestimmten Tag angeben wie „Gestern“ oder „Letzten Sonntag“, z.B. „Frag Tageszähler nach dem Stand von gestern“. Oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
                reprompts: 'Wie kann ich dir helfen?',
                shouldEndSession: false,
            },
        ]);
    });

    describe('CancelIntent', () => {
        alexaTest.test([
            {
                request: alexaTest.getIntentRequest('AMAZON.CancelIntent'),
                says: 'Auf Wiedersehen!',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('StopIntent', () => {
        alexaTest.test([
            {
                request: alexaTest.getIntentRequest('AMAZON.StopIntent'),
                says: 'Auf Wiedersehen!',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('SetCounterIntent', () => {
        alexaTest.test([
            // no date given
            {
                request: alexaTest.getIntentRequest('SetCounterIntent', { Date: null, Count: '1' }),
                says: 'Der Zähler steht jetzt auf 1.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // date given
            {
                request: alexaTest.getIntentRequest('SetCounterIntent', { Date: '2018-03-07', Count: '2' }),
                says: 'Der Zähler steht jetzt auf 2 für 2018-03-07.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // month given
            {
                request: alexaTest.getIntentRequest('SetCounterIntent', { Date: '2018-03', Count: '3' }),
                says: 'Ich kann den Zähler nur für konkrete Tage setzen.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // NaN
            {
                request: alexaTest.getIntentRequest('SetCounterIntent', { Date: null, Count: '?' }),
                says: 'Das ist kein Wert, den ich setzen kann.',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('IncreaseCounterIntent', () => {
        alexaTest.test([
            // no date given
            {
                request: alexaTest.getIntentRequest('IncreaseCounterIntent', { Date: null, Count: '1' }),
                says: 'Der Zähler steht jetzt auf 2.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // date given, value already in db
            // TODO set to known value before increase
            {
                request: alexaTest.getIntentRequest('IncreaseCounterIntent', { Date: '2018-03-06', Count: '2' }),
                saysLike: 'Der Zähler steht jetzt auf ',
                repromptsNothing: true, shouldEndSession: true,
            },
            // date given, no value in db yet
            // TODO remove from db before increase
            {
                request: alexaTest.getIntentRequest('IncreaseCounterIntent', { Date: '2018-03-05', Count: '3' }),
                saysLike: 'Der Zähler steht jetzt auf ',
                repromptsNothing: true, shouldEndSession: true,
            },
            // month given
            {
                request: alexaTest.getIntentRequest('IncreaseCounterIntent', { Date: '2018-03', Count: '4' }),
                says: 'Ich kann den Zähler nur für konkrete Tage setzen.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // NaN
            {
                request: alexaTest.getIntentRequest('IncreaseCounterIntent', { Date: null, Count: '?' }),
                says: 'Das ist kein Wert, den ich setzen kann.',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('QueryCounterIntent', () => {
        alexaTest.test([
            // no date given
            {
                request: alexaTest.getIntentRequest('QueryCounterIntent', {Date: null}),
                says: 'Der Zähler steht auf 2.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // date given
            {
                request: alexaTest.getIntentRequest('QueryCounterIntent', { Date: '2018-03-07' }),
                says: 'Der Zähler steht auf 2 für 2018-03-07.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // month given
            {
                request: alexaTest.getIntentRequest('QueryCounterIntent', { Date: '2018-03' }),
                says: 'Ich kann den Zähler bisher nur für konkrete Tage abfragen.',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('QuerySumIntent', () => {
        alexaTest.test([
            // month given
            // TODO once IncreaseCounterIntent resets db we can expect a fixed value here
            {
                request: alexaTest.getIntentRequest('QuerySumIntent', { Date: '2018-03' }),
                saysLike: 'Die Summe ist ',
                repromptsNothing: true, shouldEndSession: true,
            },
            // TODO many more uses cases here
        ]);
    });

    describe('ErrorHandler', () => {
        alexaTest.test([
            {
                request: alexaTest.getIntentRequest(''),
                says: 'Entschuldigung, das verstehe ich nicht. Bitte wiederholen Sie das?',
                reprompts: 'Entschuldigung, das verstehe ich nicht. Bitte wiederholen Sie das?',
                shouldEndSession: false,
            },
        ]);
    });
});
