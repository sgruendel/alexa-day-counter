'use strict';

const expect = require('chai').expect;
const index = require('../src/index');
const util = require('../src/util');

const USER_ID = 'amzn1.ask.account.unit_test';

const event = {
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
        requestId: 'EdwRequestId.66f9e53c-5a44-4c19-92cb-57ed320c66f9',
        intent: {
            name: 'QueryCounterIntent',
            slots: {
                Date: {
                    name: 'Date',
                },
            },
        },
        locale: 'de-DE',
        timestamp: '2018-03-08T14:48:53Z',
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

const TODAY = util.calculateDateKey(event.request.intent.slots);

describe('Testing a session with the QueryCounterIntent (no date given):', () => {
    var speechResponse = null;
    var speechError = null;

    before(function() {
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
            expect(speechResponse.response.outputSpeech.ssml).to.not.contain(TODAY);
        });

        it('should end the alexa session', () => {
            expect(speechResponse.response.shouldEndSession).to.be.true;
        });
    });
});
