'use strict';

const Alexa = require('alexa-sdk');
const ChartjsNode = require('chartjs-node');

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
            const { fromDate, toDate } = util.calculateFromToDateKeys(slots);
            if (fromDate && toDate) {
                return this.emit('QuerySum');
            }
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
    QuerySumIntent: function() {
        this.emit('QuerySum');
    },
    QuerySum: function() {
        const slots = this.event.request.intent.slots;
        const { fromDate, toDate } = util.calculateFromToDateKeys(slots);
        if (!fromDate || !toDate) {
            console.error('invalid date', slots.Date.value);
            return this.emit(':tell', this.t('NO_SPECIFIC_RANGE_GIVEN_QUERY'));
        }

        var chartNode = new ChartjsNode(600, 600);
        console.log('chartNode', chartNode);
        chartNode.on('beforeDraw', function(Chartjs) {
            console.log('beforeDraw', Chartjs.defaults.defaultFontFamily);
            //Chartjs.defaults
            //Chartjs.pluginService
            //Chartjs.scaleService
            //Chartjs.layoutService
            //Chartjs.helpers
            //Chartjs.controllers
            //etc
        });
        var chartJsOptions = {
            type: 'bar',
            data: [20, 10],
            options: {
                scales: {
                    xAxes: [{
                        stacked: true,
                    }],
                    yAxes: [{
                        stacked: true,
                    }],
                },
            },
        };
        var img = chartNode.drawChart(chartJsOptions)
            .then(() => {
                // chart is created

                // get image as png buffer
                console.log('chart created');
                return chartNode.getImageBuffer('image/png');
            })
            .then(buffer => {
                Array.isArray(buffer); // => true
                // as a stream
                console.log('chart as a stream');
                return chartNode.getImageStream('image/png');
            })
            .then(streamResult => {
                // using the length property you can do things like
                // directly upload the image to s3 by using the
                // stream and length properties
                streamResult.stream; // => Stream object
                streamResult.length; // => Integer length of stream
                // write to a file
                console.log('chart ready');
                //return chartNode.writeImageToFile('image/png', './testimage.png');
            })
            .then(() => {
                // chart is now written to the file path
                // ./testimage.png
                //console.log('image file ready');
            })
            .finally(() => {
                console.log('destroying chart');
                chartNode.destroy();
                console.log('chart destroyed');
            });
        console.log('img', img);

        const userId = this.event.session.user.userId;
        db.findAll(userId)
            .then(result => {
                console.log('found', result.length, 'results');
                const count =
                    result
                        .filter(row => (row.date >= fromDate && row.date <= toDate))
                        .reduce((sum, row) => sum + row.count, 0);
                console.log('sum is', count, 'from', fromDate, 'to', toDate);
                const speechOutput = this.t('SUM_IS', { count: count, fromDate: fromDate, toDate: toDate });

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
