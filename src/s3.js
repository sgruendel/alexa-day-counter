'use strict';

const AWS = require('aws-sdk');

const s3 = new AWS.S3({
    // TODO: Do we need it at all, or is it picked up automatically, see https://stackoverflow.com/questions/51743555/aws-js-sdk-doesnt-loading-credentials-from-environment-variables
    region: process.env.AWS_region,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const BUCKET_NAME = 'alexa-day-counter';

var exports = module.exports = {};

exports.upload = function(key, body) {
    var params = {
        ACL: 'public-read',
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
    };
    s3.upload(params, function(err, data) {
        if (err) {
            console.error('error uploading to S3', err, err.stack); // an error occurred
        } else {
            console.log('uploaded', data); // successful response
        }
    });
};
