import dynamoose from 'dynamoose';
const ddb = new dynamoose.aws.ddb.DynamoDB({ region: 'eu-west-1' });
dynamoose.aws.ddb.set(ddb);

export const Count = dynamoose.model('Count',
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
