import Alexa from 'ask-sdk-core';
import i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';
import winston from 'winston';
import * as handlers from './handlers.js';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
    exitOnError: false,
});

const SKILL_ID = 'amzn1.ask.skill.d3ee5865-d4bb-4076-b13d-fbef1f7e0216';

const languageStrings = {
    de: {
        translation: {
            HELP_MESSAGE:
                'Der Tageszähler zählt Ereignisse pro Tag und speichert die Anzahl dauerhaft. ' +
                'Du kannst sagen „Setze den Wert auf drei“, oder „Zähle eins dazu“, oder „Frage Tageszähler nach dem Stand“. ' +
                'Du kannst auch immer einen bestimmten Tag angeben wie „Gestern“ oder „Letzten Sonntag“, z.B. „Frage Tageszähler nach dem Stand von gestern“ oder „Frage Tageszähler nach der Summe von letztem Monat“. ' +
                'Oder du kannst „Beenden“ sagen. Was soll ich tun?',
            HELP_REPROMPT:
                'Sage „Setze den Wert auf Zahl“, oder „Zähle Zahl dazu für Datum“, oder „Frage Tageszähler nach dem Stand“. Was soll ich tun?',
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
            HELP_MESSAGE:
                'Daily Counter counts events per day and stores the count persistently. ' +
                'You can say „Set the count to three“, or „Add one“, or „Ask Daily Counter for the count“. ' +
                'You can always give a specific date like „yesterday“ or „last sunday“, e.g. „Ask Daily Counter for the count of yesterday“ or „Ask Daily Counter for the sum of last month“. ' +
                'Or you can say „Exit“. What should I do?',
            HELP_REPROMPT:
                'Say „Set the count to number“, or „Add number for date“, or „Ask Daily Counter for the count“. What should I do?',
            STOP_MESSAGE: 'See you soon!',
            NOT_UNDERSTOOD_MESSAGE: "Sorry, I don't understand. Please say again?",
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

i18next.use(sprintf).init({
    overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
    resources: languageStrings,
    returnObjects: true,
});

const SetCounterIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'SetCounterIntent';
    },
    async handle(handlerInput) {
        return handlers.handleSetCounterIntent(handlerInput);
    },
};

const IncreaseCounterIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'IncreaseCounterIntent';
    },
    async handle(handlerInput) {
        return handlers.handleIncreaseCounterIntent(handlerInput);
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
        return handlers.handleQueryCounterIntent(handlerInput);
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
        return handlers.handleQuerySumIntent(handlerInput);
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        return (
            request.type === 'LaunchRequest' ||
            (request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent')
        );
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
        return (
            request.type === 'IntentRequest' &&
            (request.intent.name === 'AMAZON.CancelIntent' || request.intent.name === 'AMAZON.StopIntent')
        );
    },
    handle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;
        logger.debug('request', request);

        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const speechOutput = requestAttributes.t('STOP_MESSAGE');
        return handlerInput.responseBuilder.speak(speechOutput).getResponse();
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
        if (
            request.type === 'IntentRequest' &&
            (request.intent.name === 'QueryCounterIntent' ||
                request.intent.name === 'SetCounterIntent' ||
                request.intent.name === 'IncreaseCounterIntent' ||
                request.intent.name === 'QuerySumIntent')
        ) {
            const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
            const speechOutput = requestAttributes.t('NOT_POSSIBLE_NOW');
            response = handlerInput.responseBuilder.speak(speechOutput).getResponse();
        } else {
            const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
            const speechOutput = requestAttributes.t('NOT_UNDERSTOOD_MESSAGE');
            response = handlerInput.responseBuilder.speak(speechOutput).reprompt(speechOutput).getResponse();
        }
        return response;
    },
};

const LocalizationInterceptor = {
    process(handlerInput) {
        i18next.changeLanguage(Alexa.getLocale(handlerInput.requestEnvelope));

        const attributes = handlerInput.attributesManager.getRequestAttributes();
        attributes.t = (...args) => {
            // @ts-ignore
            return i18next.t(...args);
        };
    },
};

let skill;

export const handler = async function (event, context) {
    if (!skill) {
        skill = Alexa.SkillBuilders.custom()
            .addRequestHandlers(
                SetCounterIntentHandler,
                IncreaseCounterIntentHandler,
                QueryCounterIntentHandler,
                QuerySumIntentHandler,
                HelpIntentHandler,
                CancelAndStopIntentHandler,
                SessionEndedRequestHandler,
            )
            .addRequestInterceptors(LocalizationInterceptor)
            .addErrorHandlers(ErrorHandler)
            .withApiClient(new Alexa.DefaultApiClient())
            .withSkillId(SKILL_ID)
            .create();
    }

    return skill.invoke(event, context);
};
