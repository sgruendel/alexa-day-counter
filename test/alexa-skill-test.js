'use strict';

// include the testing framework
const alexaTest = require('alexa-skill-test-framework');
var expect = require('chai').expect;

const db = require('../src/db');

const USER_ID = 'amzn1.ask.account.unit_test';

// initialize the testing framework
alexaTest.initialize(
    require('../src/index'),
    'amzn1.ask.skill.d3ee5865-d4bb-4076-b13d-fbef1f7e0216',
    USER_ID);
alexaTest.setLocale('de-DE');

describe('Daily Counter Skill', () => {
    before(async function() {
        await db.removeAll(USER_ID);
        var result = await db.findAll(USER_ID);
        expect(result).to.have.lengthOf(0);

        await db.insert(USER_ID, '2018-03-06', '5');
        result = await db.findAll(USER_ID);
        expect(result).to.have.lengthOf(1);
    });

    after(() => {
        return db.findAll(USER_ID)
            .then(result => {
                result.forEach(row => {
                    expect(row.count, 'date ' + row.date).to.be.a('number');
                });
            });
    });

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
                request: alexaTest.getIntentRequest('SetCounterIntent', { date: null, count: '1' }),
                says: 'Der Zähler steht jetzt auf 1.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // date given
            {
                request: alexaTest.getIntentRequest('SetCounterIntent', { date: '2018-03-07', count: '2' }),
                says: 'Der Zähler steht jetzt auf 2 für 2018-03-07.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // month given
            {
                request: alexaTest.getIntentRequest('SetCounterIntent', { date: '2018-03', count: '3' }),
                says: 'Ich kann den Zähler nur für konkrete Tage setzen.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // NaN
            {
                request: alexaTest.getIntentRequest('SetCounterIntent', { date: null, count: '?' }),
                says: 'Das ist kein Wert, den ich setzen kann.',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('IncreaseCounterIntent', () => {
        alexaTest.test([
            // no date given
            {
                request: alexaTest.getIntentRequest('IncreaseCounterIntent', { date: null, count: '1' }),
                says: 'Der Zähler steht jetzt auf 2.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // date given, value already in db
            {
                request: alexaTest.getIntentRequest('IncreaseCounterIntent', { date: '2018-03-06', count: '2' }),
                says: 'Der Zähler steht jetzt auf 7 für 2018-03-06.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // date given, no value in db yet
            {
                request: alexaTest.getIntentRequest('IncreaseCounterIntent', { date: '2018-03-05', count: '3' }),
                says: 'Der Zähler steht jetzt auf 3 für 2018-03-05.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // month given
            {
                request: alexaTest.getIntentRequest('IncreaseCounterIntent', { date: '2018-03', count: '4' }),
                says: 'Ich kann den Zähler nur für konkrete Tage setzen.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // NaN
            {
                request: alexaTest.getIntentRequest('IncreaseCounterIntent', { date: null, count: '?' }),
                says: 'Das ist kein Wert, den ich setzen kann.',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('QueryCounterIntent', () => {
        alexaTest.test([
            // no date given
            {
                request: alexaTest.getIntentRequest('QueryCounterIntent', {date: null}),
                says: 'Der Zähler steht auf 2.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // date given
            {
                request: alexaTest.getIntentRequest('QueryCounterIntent', { date: '2018-03-07' }),
                says: 'Der Zähler steht auf 2 für 2018-03-07.',
                repromptsNothing: true, shouldEndSession: true,
            },
            // month given
            {
                request: alexaTest.getIntentRequest('QueryCounterIntent', { date: '2018-03' }),
                says: 'Ich kann den Zähler bisher nur für konkrete Tage abfragen.',
                repromptsNothing: true, shouldEndSession: true,
            },
        ]);
    });

    describe('QuerySumIntent', () => {
        alexaTest.test([
            // month given
            {
                request: alexaTest.getIntentRequest('QuerySumIntent', { date: '2018-03' }),
                says: 'Die Summe ist 12 von 2018-03-01 bis 2018-03-31.',
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
