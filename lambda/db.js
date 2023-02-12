'use strict';

const dynamoose = require('dynamoose');
dynamoose.aws.sdk.config.update({ region: 'eu-west-1' });

var exports = module.exports = {};

exports.Count = dynamoose.model('Count',
    new dynamoose.Schema({
        userId: {
            type: String,
            validate: (userId) => userId.length > 0,
            required: true,
        },
        date: {
            type: String,
            validate: (date) => date.length > 0,
            required: true,
            rangeKey: true,
        },
        count: {
            type: Number,
            validate: (count) => count >= 0,
            required: true,
        },
    }, {
        timestamps: true,
    }),
    {
        create: false,
        prefix: 'dayCounter-',
        waitForActive: false,
    });
