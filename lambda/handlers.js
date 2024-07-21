import Alexa from 'ask-sdk-core';
// eslint-disable-next-line no-unused-vars -- needed for typedefs
import services from 'ask-sdk-model';
import moment from 'moment-timezone';
import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
    exitOnError: false,
});

import * as db from './db.js';
import * as utils from './utils.js';

// Get a moment object for now in user's time zone, so if he says "today" we're not simpy using the server time.
// If there's no API Access Token, there's no user, i.e. we're in a unit test.
async function getNowWithSystemTimeZone(handlerInput) {
    // see https://gist.github.com/memodoring/84f19600e1c55f68e24af16535af52b8
    logger.debug('getNowWithSystemTimeZone', handlerInput.requestEnvelope);
    const apiAccessToken = Alexa.getApiAccessToken(handlerInput.requestEnvelope);
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    if (apiAccessToken) {
        const upsServiceClient = handlerInput.serviceClientFactory.getUpsServiceClient();
        const deviceId = Alexa.getDeviceId(handlerInput.requestEnvelope);
        try {
            const systemTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
            const now = moment().tz(systemTimeZone).locale(locale);
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
    return moment().locale(locale);
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

export async function handleSetCounterIntent(handlerInput) {
    /** @type {services.IntentRequest} */
    const request = handlerInput.requestEnvelope.request;
    logger.debug('request', request);

    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const slots = request.intent.slots;
    if (slots.count.value) {
        if (isNaN(slots.count.value)) {
            logger.error('Numeric value expected, got ' + slots.count.value);
            const speechOutput = requestAttributes.t('NOT_A_NUMBER');
            return handlerInput.responseBuilder.speak(speechOutput).getResponse();
        }

        const date = utils.calculateDateKey(slots, await getNowWithSystemTimeZone(handlerInput));
        if (!date) {
            logger.error('invalid date', slots.date);
            const speechOutput = requestAttributes.t('NO_SPECIFIC_DAY_GIVEN_SET');
            return handlerInput.responseBuilder.speak(speechOutput).getResponse();
        }

        const count = parseInt(slots.count.value, 10);
        return insertDbAndGetResponse(
            handlerInput,
            slots,
            handlerInput.requestEnvelope.session.user.userId,
            date,
            count,
        );
    } else {
        logger.error('No slot value given for count');
        const speechOutput = requestAttributes.t('NO_VALUE_GIVEN');
        return handlerInput.responseBuilder.speak(speechOutput).getResponse();
    }
}

export async function handleIncreaseCounterIntent(handlerInput) {
    /** @type {services.IntentRequest} */
    const request = handlerInput.requestEnvelope.request;
    logger.debug('request', request);

    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const slots = request.intent.slots;
    if (slots.count.value) {
        if (isNaN(slots.count.value)) {
            logger.error('Numeric value expected, got ' + slots.count.value);
            const speechOutput = requestAttributes.t('NOT_A_NUMBER');
            return handlerInput.responseBuilder.speak(speechOutput).getResponse();
        }

        const date = utils.calculateDateKey(slots, await getNowWithSystemTimeZone(handlerInput));
        if (!date) {
            logger.error('invalid date', slots.date);
            const speechOutput = requestAttributes.t('NO_SPECIFIC_DAY_GIVEN_SET');
            return handlerInput.responseBuilder.speak(speechOutput).getResponse();
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
        return handlerInput.responseBuilder.speak(speechOutput).getResponse();
    }
}

export async function handleQueryCounterIntent(handlerInput) {
    /** @type {services.IntentRequest} */
    const request = handlerInput.requestEnvelope.request;
    logger.debug('request', request);

    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const slots = request.intent.slots;
    const date = utils.calculateDateKey(slots, await getNowWithSystemTimeZone(handlerInput));
    if (!date) {
        logger.error('invalid date', slots.date);
        const speechOutput = requestAttributes.t('NO_SPECIFIC_DAY_GIVEN_QUERY');
        return handlerInput.responseBuilder.speak(speechOutput).getResponse();
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
    return handlerInput.responseBuilder.speak(speechOutput).getResponse();
}

export async function handleQuerySumIntent(handlerInput) {
    /** @type {services.IntentRequest} */
    const request = handlerInput.requestEnvelope.request;
    logger.debug('request', request);

    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const slots = request.intent.slots;
    const { fromDate, toDate } = utils.calculateFromToDateKeys(slots, await getNowWithSystemTimeZone(handlerInput));
    if (!fromDate || !toDate) {
        logger.error('invalid date', slots.date);
        const speechOutput = requestAttributes.t('NO_SPECIFIC_RANGE_GIVEN_QUERY');
        return handlerInput.responseBuilder.speak(speechOutput).getResponse();
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
}

