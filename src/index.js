'use strict';

const Alexa = require('alexa-sdk');

const db = require('./db');

const APP_ID = 'amzn1.ask.skill.d3ee5865-d4bb-4076-b13d-fbef1f7e0216';

const languageStrings = {
    de: {
        translation: {
            HELP_MESSAGE: 'Du kannst sagen, „Frag Tageszähler nach dem Stand, oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
            HELP_REPROMPT: 'Wie kann ich dir helfen?',
            STOP_MESSAGE: 'Auf Wiedersehen!',
            COUNTER_IS: 'Der Zähler steht auf {count}.',
            COUNTER_IS_FOR: 'Der Zähler steht auf {count} für {date}.',
            COUNTER_IS_NOW: 'Der Zähler steht jetzt auf {count}.',
            COUNTER_IS_NOW_FOR: 'Der Zähler steht jetzt auf {count} für {date}.',
            COUNTER_NOT_SET_FOR: 'Der Zähler ist nicht gesetzt für {date}.',
            NOT_POSSIBLE_NOW: 'Das ist gerade leider nicht möglich.',
            NO_VALUE_GIVEN: 'Kein Wert angegeben.',
        },
    },
};

const handlers = {
    LaunchRequest: function() {
        this.emit('AMAZON.HelpIntent');
    },
    SetCounterIntent: function() {
        this.emit('SetCounter');
    },
    SetCounter: function() {
        const { userId } = this.event.session.user;
        // const { slots } = this.event.request.intent;
        // const countSlot = this.event.request.intent.slots.Count;
        const { slots } = this.event.request.intent;
        if (slots.Count.value) {
            const count = parseInt(slots.Count.value, 10);
            const date = slots.Date.value || db.dateKey(new Date());
            console.log('setting count to', count, 'for', date);
            db.insert(userId, date, count)
                .then(result => {
                    console.log('count successfully updated', result);
                    var speechOutput;
                    if (slots.Date.value) {
                        speechOutput = this.t('COUNTER_IS_NOW_FOR')
                            .replace('{count}', count)
                            .replace('{date}', date);
                    } else {
                        speechOutput = this.t('COUNTER_IS_NOW')
                            .replace('{count}', count);
                    }
                    this.emit(':tell', speechOutput);
                })
                .catch(err => {
                    console.error('Error setting count in db', err);
                    this.emit(':tell', this.t('NOT_POSSIBLE_NOW'));
                });
        } else {
            console.error('No slot value given for count');
            this.emit(':tell', this.t('NO_VALUE_GIVEN'));
        }
    },
    IncreaseCounterIntent: function() {
        this.emit('IncreaseCounter');
    },
    IncreaseCounter: function() {
        const { userId } = this.event.session.user;
        // const { slots } = this.event.request.intent;
        // const countSlot = this.event.request.intent.slots.Count;
        const { slots } = this.event.request.intent;
        if (slots.Count.value) {
            const count = parseInt(slots.Count.value, 10);
            const date = slots.Date.value || db.dateKey(new Date());
            console.log('increasing count by', count, 'for', date);

            db.find(userId, date)
                .then(result => {
                    const newCount = result.count + count;
                    console.log('current value is', result.count, 'setting to', newCount);
                    db.insert(userId, date, newCount)
                        .then(result => {
                            console.log('count successfully updated', result);
                            var speechOutput;
                            if (slots.Date.value) {
                                speechOutput = this.t('COUNTER_IS_NOW_FOR')
                                    .replace('{count}', newCount)
                                    .replace('{date}', date);
                            } else {
                                speechOutput = this.t('COUNTER_IS_NOW')
                                    .replace('{count}', newCount);
                            }
                            this.emit(':tell', speechOutput);
                        })
                        .catch(err => {
                            console.error('Error setting count in db', err);
                            this.emit(':tell', this.t('NOT_POSSIBLE_NOW'));
                        });
                })
                .catch(TypeError, err => {
                    console.log('current value is not set for', date, err);
                    console.log('setting count to', count);
                    db.insert(userId, date, count)
                        .then(result => {
                            console.log('count successfully updated', result);
                            var speechOutput;
                            if (slots.Date.value) {
                                speechOutput = this.t('COUNTER_IS_NOW_FOR')
                                    .replace('{count}', count)
                                    .replace('{date}', date);
                            } else {
                                speechOutput = this.t('COUNTER_IS_NOW')
                                    .replace('{count}', count);
                            }
                            this.emit(':tell', speechOutput);
                        })
                        .catch(err => {
                            console.error('Error setting count in db', err);
                            this.emit(':tell', this.t('NOT_POSSIBLE_NOW'));
                        });
                })
                .catch(err => {
                    console.error('Error getting count from db', err);
                    this.emit(':tell', this.t('NOT_POSSIBLE_NOW'));
                });
        } else {
            console.error('No slot value given for count');
            this.emit(':tell', this.t('NO_VALUE_GIVEN'));
        }
    },
    QueryCounterIntent: function() {
        this.emit('QueryCounter');
    },
    QueryCounter: function() {
        const { userId } = this.event.session.user;
        const { slots } = this.event.request.intent;
        const date = slots.Date.value || db.dateKey(new Date());
        db.find(userId, date)
            .then(result => {
                console.log('current value is', result.count, 'for', date);
                var speechOutput;
                if (slots.Date.value) {
                    speechOutput = this.t('COUNTER_IS_FOR')
                        .replace('{count}', result.count)
                        .replace('{date}', date);
                } else {
                    speechOutput = this.t('COUNTER_IS')
                        .replace('{count}', result.count);
                }
                this.emit(':tell', speechOutput);
            })
            .catch(TypeError, err => {
                console.log('current value is not set for', date, err);
                const speechOutput = this.t('COUNTER_NOT_SET_FOR')
                    .replace('{date}', date);
                this.emit(':tell', speechOutput);
            })
            .catch(err => {
                console.error('Error getting count from db', err);
                this.emit(':tell', this.t('NOT_POSSIBLE_NOW'));
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
