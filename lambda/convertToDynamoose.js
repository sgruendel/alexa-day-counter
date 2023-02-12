'use strict';

const dynamoose = require('dynamoose');
dynamoose.aws.sdk.config.update({ region: 'eu-west-1' });

const Count = dynamoose.model('Count',
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
        createdAt: Date,
        updatedAt: Date,
    }),
    {
        create: true,
        prefix: 'dayCounter-',
        waitForActive: false,
    });

const CountOld = dynamoose.model('DayCounter',
    new dynamoose.Schema({
        userId: String,
        date: String,
        count: Number,
        createdAt: Number,
    }),
    {
        create: false,
        waitForActive: false,
    });

async function convert(results) {
    for (let i = 0; i < results.count; i++) {
        const countOld = results[i];
        if (countOld.count >= 0) {
            const count = new Count(countOld);
            const now = new Date().getTime();
            count.createdAt = countOld.createdAt ? new Date(countOld.createdAt).getTime() : now;
            count.updatedAt = now;
            try {
                await count.save();
            } catch (error) {
                console.error(error);
            }
        }
    }
};

(async() => {
    let lastKey;
    do {
        const results = await CountOld.scan().startAt(lastKey).limit(100).exec();
        console.log('converting ' + results.count);
        await convert(results);
        lastKey = results.lastKey;
    } while (lastKey);
})();
