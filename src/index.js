'use strict';

const Alexa = require('ask-sdk-core');
const i18next = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const moment = require('moment-timezone');
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
    exitOnError: false,
});

const db = require('./db');
const utils = require('./utils');

const SKILL_ID = 'amzn1.ask.skill.d3ee5865-d4bb-4076-b13d-fbef1f7e0216';

const languageStrings = {
    de: {
        translation: {
            HELP_MESSAGE: 'Der Tageszähler zählt Ereignisse pro Tag und speichert die Anzahl dauerhaft. '
                + 'Du kannst sagen „Setze den Wert auf drei“, oder „Zähle eins dazu“, oder „Frage Tageszähler nach dem Stand“. '
                + 'Du kannst auch immer einen bestimmten Tag angeben wie „Gestern“ oder „Letzten Sonntag“, z.B. „Frage Tageszähler nach dem Stand von gestern“ oder „Frage Tageszähler nach der Summe von letztem Monat“. '
                + 'Oder du kannst „Beenden“ sagen. Was soll ich tun?',
            HELP_REPROMPT: 'Sage „Setze den Wert auf Zahl“, oder „Zähle Zahl dazu für Datum“, oder „Frage Tageszähler nach dem Stand“. Was soll ich tun?',
            STOP_MESSAGE: '<say-as interpret-as="interjection">bis dann</say-as>',
            NOT_UNDERSTOOD_MESSAGE: 'Entschuldigung, das verstehe ich nicht. Bitte wiederhole das?',
            COUNTER_IS: 'Der Zähler steht auf {{count}}.',
            COUNTER_IS_FOR: 'Der Zähler steht auf {{count}} für {{date}}.',
            COUNTER_IS_NOW: 'Der Zähler steht jetzt auf {{count}}.',
            COUNTER_IS_NOW_FOR: 'Der Zähler steht jetzt auf {{count}} für {{date}}.',
            COUNTER_NOT_SET_FOR: 'Der Zähler ist nicht gesetzt für {{date}}.',
            SUM_IS: 'Die Summe ist {{count}} von {{fromDate}} bis {{toDate}}.',
            SUM_FROM_TO: 'Summe von {{fromDate}} bis {{toDate}}',
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
                + 'You can say „Set the count to three“, or „Add one“, or „Ask Daily Counter for the count“. '
                + 'You can always give a specific date like „yesterday“ or „last sunday“, e.g. „Ask Daily Counter for the count of yesterday“ or „Ask Daily Counter for the sum of last month“. '
                + 'Or you can say „Exit“. What should I do?',
            HELP_REPROMPT: 'Say „Set the count to number“, or „Add number for date“, or „Ask Daily Counter for the count“. What should I do?',
            STOP_MESSAGE: 'See you soon!',
            NOT_UNDERSTOOD_MESSAGE: 'Sorry, I don\'t understand. Please say again?',
            COUNTER_IS: 'The counter is at {{count}}.',
            COUNTER_IS_FOR: 'The counter is at {{count}} for {{date}}.',
            COUNTER_IS_NOW: 'The counter is now at {{count}}.',
            COUNTER_IS_NOW_FOR: 'The counter is now at {{count}} for {{date}}.',
            COUNTER_NOT_SET_FOR: 'The counter is not set for {{date}}.',
            SUM_IS: 'The sum is {{count}} from {{fromDate}} to {{toDate}}.',
            SUM_FROM_TO: 'Sum from {{fromDate}} to {{toDate}}',
            NOT_POSSIBLE_NOW: 'Sorry, this is not possible right now.',
            NO_VALUE_GIVEN: 'No value given.',
            NOT_A_NUMBER: 'This is not a value I can set.',
            NO_SPECIFIC_DAY_GIVEN_SET: 'I can only set the counter for specific days.',
            NO_SPECIFIC_DAY_GIVEN_QUERY: 'I can only query the counter for specific days for now.',
            NO_SPECIFIC_RANGE_GIVEN_QUERY: "Sorry, I don't understand this date range.",
        },
    },
};

// Get a moment object for now in user's time zone, so if he says "today" we're not simpy using the server time.
// If there's no API Access Toekn, there's no user, i.e. we're in a unit test.
async function getNowWithSystemTimeZone(handlerInput) {
    // see https://gist.github.com/memodoring/84f19600e1c55f68e24af16535af52b8
    logger.debug('getNowWithSystemTimeZone', handlerInput.requestEnvelope);
    const apiAccessToken = Alexa.getApiAccessToken(handlerInput.requestEnvelope);
    if (apiAccessToken) {
        const upsServiceClient = handlerInput.serviceClientFactory.getUpsServiceClient();
        const deviceId = Alexa.getDeviceId(handlerInput.requestEnvelope);
        try {
            const systemTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
            const now = moment().tz(systemTimeZone);
            if (now) {
                logger.debug('system TZ is ' + systemTimeZone + ', now is ' + now.format());
                return now;
            } else {
                logger.error('unsupported system TZ ' + systemTimeZone);
            }
        } catch (err) {
            logger.error(err.stack || err.toString());
        }
    }
    return moment();
}

async function insertDbAndGetResponse(handlerInput, slots, userId, date, count) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    logger.debug('setting count to ' + count + ' for ' + date);

    const dc = new db.Count({ userId: userId, date: date, count: count });
    const result = await dc.save();
    logger.debug('count successfully updated', result);
    const key = slots.date.value ? 'COUNTER_IS_NOW_FOR' : 'COUNTER_IS_NOW';
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
    async handle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        logger.debug('request', request);

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const slots = request.intent.slots;
        if (slots.count.value) {
            if (isNaN(slots.count.value)) {
                logger.error('Numeric value expected, got ' + slots.count.value);
                const speechOutput = requestAttributes.t('NOT_A_NUMBER');
                return handlerInput.responseBuilder
                    .speak(speechOutput)
                    .getResponse();
            }

            const date = utils.calculateDateKey(slots, await getNowWithSystemTimeZone(handlerInput));
            if (!date) {
                logger.error('invalid date', slots.date);
                const speechOutput = requestAttributes.t('NO_SPECIFIC_DAY_GIVEN_SET');
                return handlerInput.responseBuilder
                    .speak(speechOutput)
                    .getResponse();
            }

            const count = parseInt(slots.count.value, 10);
            return insertDbAndGetResponse(handlerInput, slots, handlerInput.requestEnvelope.session.user.userId,
                date, count);
        } else {
            logger.error('No slot value given for count');
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
        const { request } = handlerInput.requestEnvelope;
        logger.debug('request', request);

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const slots = request.intent.slots;
        if (slots.count.value) {
            if (isNaN(slots.count.value)) {
                logger.error('Numeric value expected, got ' + slots.count.value);
                const speechOutput = requestAttributes.t('NOT_A_NUMBER');
                return handlerInput.responseBuilder
                    .speak(speechOutput)
                    .getResponse();
            }

            const date = utils.calculateDateKey(slots, await getNowWithSystemTimeZone(handlerInput));
            if (!date) {
                logger.error('invalid date', slots.date);
                const speechOutput = requestAttributes.t('NO_SPECIFIC_DAY_GIVEN_SET');
                return handlerInput.responseBuilder
                    .speak(speechOutput)
                    .getResponse();
            }

            const count = parseInt(slots.count.value, 10);
            logger.info('increasing count by ' + count + ' for ' + date);

            const userId = handlerInput.requestEnvelope.session.user.userId;
            const result = await db.Count.query({ userId: { eq: userId }, date: { eq: date } }).exec();
            if (result.count > 0) {
                logger.debug('current value is', result[0]);
                return insertDbAndGetResponse(handlerInput, slots, userId, date, result[0].count + count);
            } else {
                logger.debug('current value is not set for ' + date);
                return insertDbAndGetResponse(handlerInput, slots, userId, date, count);
            }
        } else {
            logger.error('No slot value given for count');
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
        const date = utils.calculateDateKey(slots);
        if (!date) {
            const { fromDate, toDate } = utils.calculateFromToDateKeys(slots);
            if (fromDate && toDate) {
                return this.emit('QuerySum');
            }
        */
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'QueryCounterIntent';
    },
    async handle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        logger.debug('request', request);

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const slots = request.intent.slots;
        const date = utils.calculateDateKey(slots, await getNowWithSystemTimeZone(handlerInput));
        if (!date) {
            logger.error('invalid date', slots.date);
            const speechOutput = requestAttributes.t('NO_SPECIFIC_DAY_GIVEN_QUERY');
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();
        }

        const result = await db.Count.query({
            userId: { eq: handlerInput.requestEnvelope.session.user.userId },
            date: { eq: date },
        }).exec();
        let speechOutput;
        if (result.count > 0) {
            logger.debug('current value is', result[0]);
            const key = slots.date.value ? 'COUNTER_IS_FOR' : 'COUNTER_IS';
            speechOutput = requestAttributes.t(key, { count: result[0].count, date: date });
        } else {
            logger.debug('current value is not set for ' + date);
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
        const date = utils.calculateDateKey(slots);
        if (!date) {
            const { fromDate, toDate } = utils.calculateFromToDateKeys(slots);
            if (fromDate && toDate) {
                return this.emit('QuerySum');
            }
        */
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'QuerySumIntent';
    },
    async handle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        logger.debug('request', request);

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const slots = request.intent.slots;
        const { fromDate, toDate } = utils.calculateFromToDateKeys(slots, await getNowWithSystemTimeZone(handlerInput));
        if (!fromDate || !toDate) {
            logger.error('invalid date', slots.date);
            const speechOutput = requestAttributes.t('NO_SPECIFIC_RANGE_GIVEN_QUERY');
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();
        }

        const result = await db.Count.query({
            userId: { eq: handlerInput.requestEnvelope.session.user.userId },
            date: { between: [fromDate, toDate] },
        }).exec();
        let sum = 0;
        let cardContent = '';
        for (let i = 0; i < result.count; i++) {
            sum += result[i].count;
            cardContent += result[i].date + ': ' + result[i].count + '\n';
        }
        logger.debug('sum is ' + sum + ' from ' + fromDate + ' to ' + toDate);
        const speechOutput = requestAttributes.t('SUM_IS', { count: sum, fromDate: fromDate, toDate: toDate });
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withSimpleCard(requestAttributes.t('SUM_FROM_TO', { fromDate: fromDate, toDate: toDate }), cardContent)
            .getResponse();
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        return request.type === 'LaunchRequest'
            || (request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent');
    },
    handle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        logger.debug('request', request);

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        return handlerInput.responseBuilder
            .speak(requestAttributes.t('HELP_MESSAGE'))
            .reprompt(requestAttributes.t('HELP_REPROMPT'))
            .getResponse();
    },
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        return request.type === 'IntentRequest'
            && (request.intent.name === 'AMAZON.CancelIntent' || request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        logger.debug('request', request);

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const speechOutput = requestAttributes.t('STOP_MESSAGE');
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .getResponse();
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        try {
            if (request.reason === 'ERROR') {
                logger.error(request.error.type + ': ' + request.error.message);
            }
        } catch (err) {
            logger.error(err.stack || err.toString(), request);
        }

        logger.debug('session ended', request);
        return handlerInput.responseBuilder.getResponse();
    },
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const { request } = handlerInput.requestEnvelope;
        logger.error(error.stack || error.toString(), request);

        let response;
        if (request.type === 'IntentRequest'
            && (request.intent.name === 'QueryCounterIntent'
                || request.intent.name === 'SetCounterIntent'
                || request.intent.name === 'IncreaseCounterIntent'
                || request.intent.name === 'QuerySumIntent')) {

            const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
            const speechOutput = requestAttributes.t('NOT_POSSIBLE_NOW');
            response = handlerInput.responseBuilder
                .speak(speechOutput)
                .getResponse();
        } else {
            const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
            const speechOutput = requestAttributes.t('NOT_UNDERSTOOD_MESSAGE');
            response = handlerInput.responseBuilder
                .speak(speechOutput)
                .reprompt(speechOutput)
                .getResponse();
        }
        return response;
    },
};

const LocalizationInterceptor = {
    process(handlerInput) {
        i18next.use(sprintf).init({
            lng: handlerInput.requestEnvelope.request.locale,
            overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
            resources: languageStrings,
            returnObjects: true,
        });

        const attributes = handlerInput.attributesManager.getRequestAttributes();
        attributes.t = (...args) => {
            return i18next.t(...args);
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
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler)
    .addRequestInterceptors(LocalizationInterceptor)
    .addErrorHandlers(ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .withSkillId(SKILL_ID)
    .lambda();
