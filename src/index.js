'use strict';

const Alexa = require('alexa-sdk');

const dynasty = require('dynasty')({});
/*
const localUrl = 'http://localhost:4000';
const localCredentials = {
    region: 'us-east-1',
    accessKeyId: 'fake',
    secretAccessKey: 'fake'
};
const localDynasty = require('dynasty')(localCredentials, localUrl);
const dynasty = localDynasty;
*/

const APP_ID = 'amzn1.ask.skill.d3ee5865-d4bb-4076-b13d-fbef1f7e0216';

const TABLE_NAME = 'dayCounter'; // arn:aws:dynamodb:eu-west-1:467353799488:table/' + TABLE_NAME


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

function dbInsertCount(date, count) {
    return dynasty.table(TABLE_NAME).insert({ date: date, count: count });
}

function dbFindCount(date) {
    return dynasty.table(TABLE_NAME).find(date);
}

function dateToDbKey(date) {
    return date.toISOString().split('T')[0];
}

const handlers = {
    LaunchRequest: function() {
        this.emit('AMAZON.HelpIntent');
    },
    SetCounterIntent: function() {
        this.emit('SetCounter');
    },
    SetCounter: function() {
        const countSlot = this.event.request.intent.slots.Count;
        if (countSlot && countSlot.value) {
            const count = parseInt(countSlot.value, 10);
            const date = dateToDbKey(new Date());
            console.log('setting count to', count, 'for', date);
            dbInsertCount(date, count)
                .then(result => {
                    console.log('count successfully updated', result);
                    this.emit(':tell', 'Der Zähler steht jetzt auf ' + count + '.');
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
        const countSlot = this.event.request.intent.slots.Count;
        if (countSlot && countSlot.value) {
            const count = parseInt(countSlot.value, 10);
            const date = dateToDbKey(new Date());
            console.log('increasing count by', count, 'for', date);

            dbFindCount(date)
                .then(result => {
                    const current = parseInt(result.count, 10);
                    console.log('current value is', current);
                    const newCount = current + count;
                    console.log('setting count to', newCount);
                    dbInsertCount(date, newCount)
                        .then(result => {
                            console.log('count successfully updated', result);
                            this.emit(':tell', 'Der Zähler steht jetzt auf ' + newCount + '.');
                        })
                        .catch(err => {
                            console.error('Error setting count in db', err);
                            this.emit(':tell', 'Das ist gerade leider nicht möglich.');
                        });
                })
                .catch(TypeError, err => {
                    console.log('current value is not set for', date, err);
                    console.log('setting count to', count);
                    dbInsertCount(date, count)
                        .then(result => {
                            console.log('count successfully updated', result);
                            this.emit(':tell', 'Der Zähler steht jetzt auf ' + count + '.');
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
        const date = dateToDbKey(new Date());
        dbFindCount(date)
            .then(result => {
                const current = parseInt(result.count, 10);
                console.log('current value is', current, 'for', date);
                this.emit(':tell', 'Der Zähler steht auf ' + current + '.');
            })
            .catch(TypeError, err => {
                console.log('current value is not set for', date, err);
                this.emit(':tell', 'Der Zähler ist nicht gesetzt.');
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
