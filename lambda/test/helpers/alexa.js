import { SKILL_ID } from '../../config.js';

export const USER_ID = 'amzn1.ask.account.unit-test';

let requestId = 0;

function requestEnvelope(request, { sessionNew = true } = {}) {
    requestId += 1;
    const application = { applicationId: SKILL_ID };
    const user = { userId: USER_ID };

    return {
        version: '1.0',
        session: {
            new: sessionNew,
            sessionId: `test-session-${requestId}`,
            application,
            attributes: {},
            user,
        },
        context: {
            System: {
                application,
                user,
                device: {
                    deviceId: 'test-device',
                    supportedInterfaces: {},
                },
                apiEndpoint: 'https://api.amazonalexa.com',
            },
        },
        request: {
            requestId: `test-request-${requestId}`,
            timestamp: new Date().toISOString(),
            locale: 'de-DE',
            ...request,
        },
    };
}

export function launchRequest(options = {}) {
    return requestEnvelope({ type: 'LaunchRequest' }, options);
}

export function intentRequest(name, slots = {}, options = {}) {
    return requestEnvelope(
        {
            type: 'IntentRequest',
            dialogState: 'COMPLETED',
            intent: {
                name,
                confirmationStatus: 'NONE',
                slots,
            },
        },
        options,
    );
}

export function sessionEndedRequest(reason = 'USER_INITIATED', options = {}) {
    const request = {
        type: 'SessionEndedRequest',
        reason,
        ...(reason === 'ERROR' ? { error: { type: 'INVALID_RESPONSE', message: 'Test session error' } } : {}),
    };
    return requestEnvelope(request, { sessionNew: false, ...options });
}

export function slot(name, value) {
    return {
        name,
        confirmationStatus: 'NONE',
        ...(value === undefined ? {} : { value }),
    };
}
