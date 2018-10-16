'use strict';

const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const dashbot = process.env.DASHBOT_API_KEY ? require('dashbot')(process.env.DASHBOT_API_KEY).alexa : undefined;

const db = require('./db');
const util = require('./util');

const SKILL_ID = 'amzn1.ask.skill.d3ee5865-d4bb-4076-b13d-fbef1f7e0216';

const languageStrings = {
    de: {
        translation: {
            HELP_MESSAGE: 'Der Tageszähler zählt Ereignisse pro Tag und speichert die Anzahl dauerhaft. '
                + 'Du kannst sagen „Starte Tageszähler und setze den Wert auf zwei“, oder „Starte Tageszähler und zähle eins dazu“, oder „Frag Tageszähler nach dem Stand“. '
                + 'Du kannst auch immer einen bestimmten Tag angeben wie „Gestern“ oder „Letzten Sonntag“, z.B. „Frag Tageszähler nach dem Stand von gestern“. '
                + 'Oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
            HELP_REPROMPT: 'Wie kann ich dir helfen?',
            STOP_MESSAGE: 'Auf Wiedersehen!',
            COUNTER_IS: 'Der Zähler steht auf {{count}}.',
            COUNTER_IS_FOR: 'Der Zähler steht auf {{count}} für {{date}}.',
            COUNTER_IS_NOW: 'Der Zähler steht jetzt auf {{count}}.',
            COUNTER_IS_NOW_FOR: 'Der Zähler steht jetzt auf {{count}} für {{date}}.',
            COUNTER_NOT_SET_FOR: 'Der Zähler ist nicht gesetzt für {{date}}.',
            SUM_IS: 'Die Summe ist {{count}} von {{fromDate}} bis {{toDate}}.',
            NOT_POSSIBLE_NOW: 'Das ist gerade leider nicht möglich.',
            NO_VALUE_GIVEN: 'Kein Wert angegeben.',
            NOT_A_NUMBER: 'Das ist kein Wert, den ich setzen kann.',
            NO_SPECIFIC_DAY_GIVEN_SET: 'Ich kann den Zähler nur für konkrete Tage setzen.',
            NO_SPECIFIC_DAY_GIVEN_QUERY: 'Ich kann den Zähler bisher nur für konkrete Tage abfragen.',
            NO_SPECIFIC_RANGE_GIVEN_QUERY: 'Ich verstehe diesen Zeitraum leider nicht.',
        },
    },
    en: {
        translation: {
            HELP_MESSAGE: 'Daily Counter counts events per day and stores the count persistently. '
                + 'You can say „Start Daily Counter and set the count to two“, or „Start Daily Counter and add one“, or „Ask Daily Counter for the count“. '
                + 'You can always give a specific date like „yesterday“ or „last sunday“, e.g. „Ask Daily Counter for the count of yesterday“. '
                + 'Or you can say „Exit“. What can I help you with?',
            HELP_REPROMPT: 'What can I help you with?',
            STOP_MESSAGE: 'Goodbye!',
            COUNTER_IS: 'The counter is at {{count}}.',
            COUNTER_IS_FOR: 'The counter is at {{count}} for {{date}}.',
            COUNTER_IS_NOW: 'The counter is now at {{count}}.',
            COUNTER_IS_NOW_FOR: 'The counter is now at {{count}} for {{date}}.',
            COUNTER_NOT_SET_FOR: 'The counter is not set for {{date}}.',
            SUM_IS: 'The sum is {{count}} from {{fromDate}} to {{toDate}}.',
            NOT_POSSIBLE_NOW: 'Sorry, this is not possible right now.',
            NO_VALUE_GIVEN: 'No value given.',
            NOT_A_NUMBER: 'This is not a value I can set.',
            NO_SPECIFIC_DAY_GIVEN_SET: 'I can only set the counter for specific days.',
            NO_SPECIFIC_DAY_GIVEN_QUERY: 'I can only query the counter for specific days for now.',
            NO_SPECIFIC_RANGE_GIVEN_QUERY: "Sorry, I don't understand this date range.",
        },
    },
};

async function insertDbAndGetResponse(handlerInput, slots, userId, date, count) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    console.log('setting count to', count, 'for', date);

    const result = await db.insert(userId, date, count);
    console.log('count successfully updated', result);
    const key = slots.Date.value ? 'COUNTER_IS_NOW_FOR' : 'COUNTER_IS_NOW';
    const speechOutput = requestAttributes.t(key, { count: count, date: date });
    return handlerInput.responseBuilder
        .speak(speechOutput)
        .getResponse();
}

const SetCounterIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'SetCounterIntent';
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        if (slots.Count.value) {
            if (isNaN(slots.Count.value)) {
                console.error('Numeric value expected, got', slots.Count.value);
                const speechOutput = requestAttributes.t('NOT_A_NUMBER');
                return handlerInput.responseBuilder
                    .speak(speechOutput)
                    .getResponse();
            }

            const date = util.calculateDateKey(slots);
            if (!date) {
                console.error('invalid date', slots.Date.value);
                const speechOutput = requestAttributes.t('NO_SPECIFIC_DAY_GIVEN_SET');
                return handlerInput.responseBuilder
                    .speak(speechOutput)
                    .getResponse();
            }

            const count = parseInt(slots.Count.value, 10);
            return insertDbAndGetResponse(handlerInput, slots, handlerInput.requestEnvelope.session.user.userId,
                date, count);
        } else {
            console.error('No slot value given for count');
            const speechOutput = requestAttributes.t('NO_VALUE_GIVEN');
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();
        }
    },
};

const IncreaseCounterIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'IncreaseCounterIntent';
    },
    async handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        if (slots.Count.value) {
            if (isNaN(slots.Count.value)) {
                console.error('Numeric value expected, got', slots.Count.value);
                const speechOutput = requestAttributes.t('NOT_A_NUMBER');
                return handlerInput.responseBuilder
                    .speak(speechOutput)
                    .getResponse();
            }

            const date = util.calculateDateKey(slots);
            if (!date) {
                console.error('invalid date', slots.Date.value);
                const speechOutput = requestAttributes.t('NO_SPECIFIC_DAY_GIVEN_SET');
                return handlerInput.responseBuilder
                    .speak(speechOutput)
                    .getResponse();
            }

            const count = parseInt(slots.Count.value, 10);
            console.log('increasing count by', count, 'for', date);

            const userId = handlerInput.requestEnvelope.session.user.userId;
            const result = await db.find(userId, date);
            if (result) {
                const newCount = parseInt(result.count, 10) + count;
                console.log('current value is', result.count);
                return insertDbAndGetResponse(handlerInput, slots, userId, date, newCount);
            } else {
                console.log('current value is not set for', date);
                return insertDbAndGetResponse(handlerInput, slots, userId, date, count);
            }
        } else {
            console.error('No slot value given for count');
            const speechOutput = requestAttributes.t('NO_VALUE_GIVEN');
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();
        }
    },
};

const QueryCounterIntentHandler = {
    canHandle(handlerInput) {
        /* TODO check date:
        const date = util.calculateDateKey(slots);
        if (!date) {
            const { fromDate, toDate } = util.calculateFromToDateKeys(slots);
            if (fromDate && toDate) {
                return this.emit('QuerySum');
            }
        */
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'QueryCounterIntent';
    },
    async handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const date = util.calculateDateKey(slots);
        if (!date) {
            console.error('invalid date', slots.Date.value);
            const speechOutput = requestAttributes.t('NO_SPECIFIC_DAY_GIVEN_QUERY');
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();
        }

        var speechOutput;
        const result = await db.find(handlerInput.requestEnvelope.session.user.userId, date);
        if (result) {
            console.log('current value is', result.count, 'for', date);
            const key = slots.Date.value ? 'COUNTER_IS_FOR' : 'COUNTER_IS';
            speechOutput = requestAttributes.t(key, { count: result.count, date: date });
        } else {
            console.log('current value is not set for', date);
            speechOutput = requestAttributes.t('COUNTER_NOT_SET_FOR', { date: date });
        }
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .getResponse();
    },
};

const QuerySumIntentHandler = {
    canHandle(handlerInput) {
        /* TODO check date:
        const date = util.calculateDateKey(slots);
        if (!date) {
            const { fromDate, toDate } = util.calculateFromToDateKeys(slots);
            if (fromDate && toDate) {
                return this.emit('QuerySum');
            }
        */
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest'
            && request.intent.name === 'QuerySumIntent';
    },
    async handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const { fromDate, toDate } = util.calculateFromToDateKeys(slots);
        if (!fromDate || !toDate) {
            console.error('invalid date', slots.Date.value);
            const speechOutput = requestAttributes.t('NO_SPECIFIC_RANGE_GIVEN_QUERY');
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();
        }

        const result = await db.findAll(handlerInput.requestEnvelope.session.user.userId);
        console.log('found', result.length, 'results');
        const count =
            result
                .filter(row => (row.date >= fromDate && row.date <= toDate))
                .reduce((sum, row) => sum + parseInt(row.count, 10), 0);
        console.log('sum is', count, 'from', fromDate, 'to', toDate);
        const speechOutput = requestAttributes.t('SUM_IS', { count: count, fromDate: fromDate, toDate: toDate });
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .getResponse();
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
            || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
                && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent');
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const speechOutput = requestAttributes.t('HELP_MESSAGE');
        const repromptSpeechOutput = requestAttributes.t('HELP_REPROMPT');
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptSpeechOutput)
            .getResponse();
    },
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const speechOutput = requestAttributes.t('STOP_MESSAGE');
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.error('Error handled:', error);

        const request = handlerInput.requestEnvelope.request;
        if (request.type === 'IntentRequest'
            && (request.intent.name === 'QueryCounterIntent'
                || request.intent.name === 'SetCounterIntent'
                || request.intent.name === 'IncreaseCounterIntent'
                || request.intent.name === 'QuerySumIntent')) {

            const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
            const speechOutput = requestAttributes.t('NOT_POSSIBLE_NOW');
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();
        }
        return handlerInput.responseBuilder
            .speak('Entschuldigung, das verstehe ich nicht. Bitte wiederholen Sie das?')
            .reprompt('Entschuldigung, das verstehe ich nicht. Bitte wiederholen Sie das?')
            .getResponse();
    },
};

const LocalizationInterceptor = {
    process(handlerInput) {
        const localizationClient = i18n.use(sprintf).init({
            lng: handlerInput.requestEnvelope.request.locale,
            overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
            resources: languageStrings,
            returnObjects: true,
        });

        const attributes = handlerInput.attributesManager.getRequestAttributes();
        attributes.t = (...args) => {
            return localizationClient.t(...args);
        };
    },
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        SetCounterIntentHandler,
        IncreaseCounterIntentHandler,
        QueryCounterIntentHandler,
        QuerySumIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler)
    .addRequestInterceptors(LocalizationInterceptor)
    .addErrorHandlers(ErrorHandler)
    .withSkillId(SKILL_ID)
    .lambda();
if (dashbot) exports.handler = dashbot.handler(exports.handler);
