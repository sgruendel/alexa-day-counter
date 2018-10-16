'use strict';

const AWS = require('aws-sdk');

const IAM_USER_KEY = process.env.AWS_ACCESS_KEY || 'AKIAIY5LSX3HD4CBBXPQ';
const IAM_USER_SECRET = process.env.AWS_SECRET_KEY || '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';
const s3 = new AWS.S3({
    accessKeyId: IAM_USER_KEY,
    secretAccessKey: IAM_USER_SECRET,
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
