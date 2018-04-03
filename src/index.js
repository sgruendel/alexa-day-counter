'use strict';

const Alexa = require('alexa-sdk');

const db = require('./db');
const util = require('./util');

const APP_ID = 'amzn1.ask.skill.d3ee5865-d4bb-4076-b13d-fbef1f7e0216';

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
            NOT_POSSIBLE_NOW: 'Das ist gerade leider nicht möglich.',
            NO_VALUE_GIVEN: 'Kein Wert angegeben.',
            NOT_A_NUMBER: 'Das ist kein Wert, den ich setzen kann.',
            NO_SPECIFIC_DAY_GIVEN_SET: 'Ich kann den Zähler nur für konkrete Tage setzen.',
            NO_SPECIFIC_DAY_GIVEN_QUERY: 'Ich kann den Zähler bisher nur für konkrete Tage abfragen.',
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
            NOT_POSSIBLE_NOW: 'Sorry, this is not possible right now.',
            NO_VALUE_GIVEN: 'No value given.',
            NOT_A_NUMBER: 'This is not a value I can set.',
            NO_SPECIFIC_DAY_GIVEN_SET: 'I can only set the counter for specific days.',
            NO_SPECIFIC_DAY_GIVEN_QUERY: 'I can only query the counter for specific days for now.',
        },
    },
};

function insertDbAndEmit(alexa, slots, userId, date, count) {
    console.log('setting count to', count, 'for', date);
    db.insert(userId, date, count)
        .then(result => {
            console.log('count successfully updated', result);
            const key = slots.Date.value ? 'COUNTER_IS_NOW_FOR' : 'COUNTER_IS_NOW';
            const speechOutput = alexa.t(key, { count: count, date: date });
            return alexa.emit(':tell', speechOutput);
        })
        .catch(err => {
            console.error('Error setting count in db', err);
            return alexa.emit(':tell', alexa.t('NOT_POSSIBLE_NOW'));
        });
}

const handlers = {
    LaunchRequest: function() {
        this.emit('AMAZON.HelpIntent');
    },
    SetCounterIntent: function() {
        this.emit('SetCounter');
    },
    SetCounter: function() {
        const slots = this.event.request.intent.slots;
        if (slots.Count.value) {
            if (isNaN(slots.Count.value)) {
                console.error('Numeric value expected, got', slots.Count.value);
                return this.emit(':tell', this.t('NOT_A_NUMBER'));
            }

            const date = util.calculateDateKey(slots);
            if (!date) {
                console.error('invalid date', slots.Date.value);
                return this.emit(':tell', this.t('NO_SPECIFIC_DAY_GIVEN_SET'));
            }

            const userId = this.event.session.user.userId;
            const count = parseInt(slots.Count.value, 10);
            return insertDbAndEmit(this, slots, userId, date, count);
        } else {
            console.error('No slot value given for count');
            return this.emit(':tell', this.t('NO_VALUE_GIVEN'));
        }
    },
    IncreaseCounterIntent: function() {
        this.emit('IncreaseCounter');
    },
    IncreaseCounter: function() {
        const slots = this.event.request.intent.slots;
        if (slots.Count.value) {
            if (isNaN(slots.Count.value)) {
                console.error('Numeric value expected, got', slots.Count.value);
                return this.emit(':tell', this.t('NOT_A_NUMBER'));
            }

            const date = util.calculateDateKey(slots);
            if (!date) {
                console.error('invalid date', slots.Date.value);
                return this.emit(':tell', this.t('NO_SPECIFIC_DAY_GIVEN_SET'));
            }

            const count = parseInt(slots.Count.value, 10);
            console.log('increasing count by', count, 'for', date);

            const userId = this.event.session.user.userId;
            db.find(userId, date)
                .then(result => {
                    const newCount = result.count + count;
                    console.log('current value is', result.count);
                    return insertDbAndEmit(this, slots, userId, date, newCount);
                })
                .catch(TypeError, err => {
                    console.log('current value is not set for', date, err);
                    return insertDbAndEmit(this, slots, userId, date, count);
                })
                .catch(err => {
                    console.error('Error getting count from db', err);
                    return this.emit(':tell', this.t('NOT_POSSIBLE_NOW'));
                });
        } else {
            console.error('No slot value given for count');
            return this.emit(':tell', this.t('NO_VALUE_GIVEN'));
        }
    },
    QueryCounterIntent: function() {
        this.emit('QueryCounter');
    },
    QueryCounter: function() {
        const slots = this.event.request.intent.slots;
        const date = util.calculateDateKey(slots);
        if (!date) {
            console.error('invalid date', slots.Date.value);
            return this.emit(':tell', this.t('NO_SPECIFIC_DAY_GIVEN_QUERY'));
        }

        const userId = this.event.session.user.userId;
        db.find(userId, date)
            .then(result => {
                console.log('current value is', result.count, 'for', date);
                const key = slots.Date.value ? 'COUNTER_IS_FOR' : 'COUNTER_IS';
                const speechOutput = this.t(key, { count: result.count, date: date });
                return this.emit(':tell', speechOutput);
            })
            .catch(TypeError, err => {
                console.log('current value is not set for', date, err);
                const speechOutput = this.t('COUNTER_NOT_SET_FOR', { date: date });
                return this.emit(':tell', speechOutput);
            })
            .catch(err => {
                console.error('Error getting count from db', err);
                return this.emit(':tell', this.t('NOT_POSSIBLE_NOW'));
            });
    },
    'AMAZON.HelpIntent': function() {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_REPROMPT');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function() {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function() {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    SessionEndedRequest: function() {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

exports.handler = (event, context, callback) => {
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
