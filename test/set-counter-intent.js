'use strict';

var expect = require('chai').expect;
var index = require('../src/index');

const context = require('aws-lambda-mock-context');
const ctx = context();

describe('Testing a session with the SetCounterIntent:', () => {
    var speechResponse = null;
    var speechError = null;

    before(function(done) {
        index.handler({
            session: {
                new: true,
                sessionId: 'SessionId.c85188ac-2e7f-4b41-9d46-f71ba235656e',
                application: {
                    applicationId: 'amzn1.ask.skill.d3ee5865-d4bb-4076-b13d-fbef1f7e0216',
                },
                attributes: {},
                user: {
                    userId: 'amzn1.ask.account.AHDVBE54AMF7LVBF672YHVEKLF3DENJCNDX24244GDR7E3LBFMIRSYIUAMZHXYSWG2VLLNH353RSU4U746D6QJBYVEQUXXEBXA2Z7IVNDB3FIDBQP65RW5SIMUVCQOTQLPDO7YTLL4K6Y23GA36FHM2PU33TQ4SNDAYQFSB4HDR5JUCXPNGOMAQYONUTM3MF36EVEQBRYZC76VI',
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
                            value: '1',
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
                        userId: 'amzn1.ask.account.AHDVBE54AMF7LVBF672YHVEKLF3DENJCNDX24244GDR7E3LBFMIRSYIUAMZHXYSWG2VLLNH353RSU4U746D6QJBYVEQUXXEBXA2Z7IVNDB3FIDBQP65RW5SIMUVCQOTQLPDO7YTLL4K6Y23GA36FHM2PU33TQ4SNDAYQFSB4HDR5JUCXPNGOMAQYONUTM3MF36EVEQBRYZC76VI',
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
});
