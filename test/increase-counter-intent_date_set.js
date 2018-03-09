'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const index = require('../src/index');
const db = require('../src/db');

const context = require('aws-lambda-mock-context');
const ctx = context();

const USER_ID = 'amzn1.ask.account.unit_test';
const DATE = '2018-03-06';

describe('Testing a session with the IncreaseCounterIntent:', () => {
    var speechResponse = null;
    var speechError = null;

    before(function(done) {
        db.insert(USER_ID, DATE, 8)
            .then(result => {
                index.handler({
                    session: {
                        new: false,
                        sessionId: 'SessionId.e2daeeeb-624f-4587-ab1b-ba0818b160e5',
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
                        requestId: 'EdwRequestId.fdb06d84-ebf1-4bae-b3d4-7b47af6d335b',
                        intent: {
                            name: 'IncreaseCounterIntent',
                            slots: {
                                Count: {
                                    name: 'Count',
                                    value: '1',
                                },
                                Date: {
                                    name: 'Date',
                                    value: DATE,
                                },
                            },
                        },
                        locale: 'de-DE',
                        timestamp: '2018-03-08T11:51:05Z',
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
                }, ctx);

                ctx.Promise
                    .then(resp => { speechResponse = resp; done(); })
                    .catch(err => { speechError = err; done(); });
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
        it('should have a count of 9', () => {
            return expect(db.find(USER_ID, DATE)).to.eventually.have.property('count', 9);
        });
    });
});
