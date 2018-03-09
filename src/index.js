'use strict';

const Alexa = require('alexa-sdk');

const db = require('./db');

const APP_ID = 'amzn1.ask.skill.d3ee5865-d4bb-4076-b13d-fbef1f7e0216';

const languageStrings = {
    de: {
        translation: {
            CURRENT_WATER_LEVEL_MESSAGE: 'Der Wasserstand bei {station} beträgt {value} {unit}.',
            NO_RESULT_MESSAGE: 'Ich kann diesen Messwert zur Zeit leider nicht bestimmen.',
            UNKNOWN_STATION_MESSAGE: 'Ich kenne diese Messstelle leider nicht.',
            HELP_MESSAGE: 'Du kannst sagen, „Frag Pegel Online nach dem Wasserstand an einer Messstation“, oder du kannst „Beenden“ sagen. Wie kann ich dir helfen?',
            HELP_REPROMPT: 'Wie kann ich dir helfen?',
            STOP_MESSAGE: 'Auf Wiedersehen!',
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
                    this.emit(':tell', 'Der Zähler steht jetzt auf ' + count + ' für ' + date);
                })
                .catch(err => {
                    console.error('Error setting count in db', err);
                    this.emit(':tell', 'Das ist gerade leider nicht möglich.');
                });
        } else {
            console.error('No slot value given for count');
            this.emit(':tell', 'Kein Wert angegeben.');
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
                            this.emit(':tell', 'Der Zähler steht jetzt auf ' + newCount + ' für ' + date);
                        })
                        .catch(err => {
                            console.error('Error setting count in db', err);
                            this.emit(':tell', 'Das ist gerade leider nicht möglich.');
                        });
                })
                .catch(TypeError, err => {
                    console.log('current value is not set for', date, err);
                    console.log('setting count to', count);
                    db.insert(userId, date, count)
                        .then(result => {
                            console.log('count successfully updated', result);
                            this.emit(':tell', 'Der Zähler steht jetzt auf ' + count + ' für ' + date);
                        })
                        .catch(err => {
                            console.error('Error setting count in db', err);
                            this.emit(':tell', 'Das ist gerade leider nicht möglich.');
                        });
                })
                .catch(err => {
                    console.error('Error getting count from db', err);
                    this.emit(':tell', 'Das ist gerade leider nicht möglich.');
                });
        } else {
            console.error('No slot value given for count');
            this.emit(':tell', 'Kein Wert angegeben.');
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
                this.emit(':tell', 'Der Zähler steht auf ' + result.count + ' für ' + date);
            })
            .catch(TypeError, err => {
                console.log('current value is not set for', date, err);
                this.emit(':tell', 'Der Zähler ist nicht gesetzt für ' + date);
            })
            .catch(err => {
                console.error('Error getting count from db', err);
                this.emit(':tell', 'Das ist gerade leider nicht möglich.');
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
