'use strict';

var expect = require('chai').expect;
var index = require('../src/index');

const event = {
    session: {
        new: false,
        sessionId: 'SessionId.e2daeeeb-624f-4587-ab1b-ba0818b160e5',
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
        requestId: 'EdwRequestId.66f9e53c-5a44-4c19-92cb-57ed320c66f9',
        intent: {
            name: 'QueryCounterIntent',
            slots: {
                Date: {
                    name: 'Date',
                    value: '2018-03-07',
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
                userId: 'amzn1.ask.account.AHDVBE54AMF7LVBF672YHVEKLF3DENJCNDX24244GDR7E3LBFMIRSYIUAMZHXYSWG2VLLNH353RSU4U746D6QJBYVEQUXXEBXA2Z7IVNDB3FIDBQP65RW5SIMUVCQOTQLPDO7YTLL4K6Y23GA36FHM2PU33TQ4SNDAYQFSB4HDR5JUCXPNGOMAQYONUTM3MF36EVEQBRYZC76VI',
            },
            device: {
                supportedInterfaces: {},
            },
        },
    },
    version: '1.0',
};

describe('Testing a session with the QueryCounterIntent (date given):', () => {
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
        });

        it('should end the alexa session', () => {
            expect(speechResponse.response.shouldEndSession).to.be.true;
        });
    });
});
