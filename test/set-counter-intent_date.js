'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const index = require('../src/index');
const db = require('../src/db');

const USER_ID = 'amzn1.ask.account.unit_test';
const DATE = '2018-03-07';

const event = {
    session: {
        new: true,
        sessionId: 'SessionId.c85188ac-2e7f-4b41-9d46-f71ba235656e',
        application: {
            applicationId: 'amzn1.ask.skill.d3ee5865-d4bb-4076-b13d-fbef1f7e0216',
        },
        attributes: {},
        user: {
            userId: USER_ID,
        },
    },
    request: {
        type: 'IntentRequest',
        requestId: 'EdwRequestId.6d24279b-78b0-4312-9ddb-4f5e6ac2afca',
        intent: {
            name: 'SetCounterIntent',
            slots: {
                Count: {
                    name: 'Count',
                    value: '4',
                },
                Date: {
                    name: 'Date',
                    value: DATE,
                },
            },
        },
        locale: 'de-DE',
        timestamp: '2018-03-08T09:53:05Z',
    },
    context: {
        AudioPlayer: {
            playerActivity: 'IDLE',
        },
        System: {
            application: {
                applicationId: 'amzn1.ask.skill.d3ee5865-d4bb-4076-b13d-fbef1f7e0216',
            },
            user: {
                userId: USER_ID,
            },
            device: {
                supportedInterfaces: {},
            },
        },
    },
    version: '1.0',
};

describe('Testing a session with the SetCounterIntent (date given):', () => {
    var speechResponse = null;
    var speechError = null;

    before(function() {
        return db.insert(USER_ID, DATE, 0)
            .then(() => {
                return new Promise((resolve, reject) => {
                    index.handler(event,
                        null,
                        (err, resp) => {
                            if (err) {
                                speechError = err;
                                reject(err);
                            } else {
                                speechResponse = resp;
                                resolve(speechResponse);
                            }
                        });
                });
            });
    });

    describe('The response', () => {
        it('should not have errored', () => {
            expect(speechError).to.be.null;
        });

        it('should have a version', () => {
            expect(speechResponse.version).to.exist;
        });

        it('should have a speechlet response', () => {
            expect(speechResponse.response).to.exist;
        });

        it('should have a spoken response', () => {
            expect(speechResponse.response.outputSpeech).to.exist;
        });

        it('should end the alexa session', () => {
            expect(speechResponse.response.shouldEndSession).to.be.true;
        });
    });

    describe('The db', () => {
        it('should have a count of 4', () => {
            return expect(db.find(USER_ID, DATE)).to.eventually.have.property('count', 4);
        });
    });
});
