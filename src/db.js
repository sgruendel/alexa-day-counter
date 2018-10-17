'use strict';

const TABLE_NAME = 'DayCounter'; // arn:aws:dynamodb:eu-west-1:467353799488:table/DayCounter

const dynamo = require('dynamodb');
dynamo.AWS.config.update({ region: 'eu-west-1' });
const Joi = require('joi');

var DayCounter = dynamo.define(TABLE_NAME, {
    hashKey: 'userId',
    rangeKey: 'date',
    schema: {
        userId: Joi.string(),
        date: Joi.string(),
        count: Joi.number(),
    },
});
DayCounter.config({ tableName: TABLE_NAME }); // table name uses pluralized model name, so we need to set the table name here

var exports = module.exports = {};

exports.create = function(userId, date, count) {
    return new Promise((resolve, reject) => {
        DayCounter.create({ userId: userId, date: date, count: count },
            (err, data) => {
                if (err) reject(err);
                resolve(data);
            }
        );
    });
};

exports.get = function(userId, date) {
    return new Promise((resolve, reject) => {
        DayCounter.get({ userId: userId, date: date },
            (err, data) => {
                if (err) reject(err);
                resolve(data);
            }
        );
    });
};

exports.findAll = function(userId, fromDate, toDate) {
    return new Promise((resolve, reject) => {
        DayCounter
            .query(userId)
            .where('date')
            .between(fromDate, toDate)
            .loadAll()
            .exec((err, data) => {
                if (err) reject(err);
                resolve(data);
            });
    });
};

/*
exports.remove = function(userId, date) {
    return dynasty.table(TABLE_NAME).remove({ hash: userId, range: date });
};

exports.removeAll = function(userId) {
    return exports.findAll(userId)
        .then(result => {
            return Promise.all(
                result.map(row => {
                    return exports.remove(userId, row.date);
                }));
        });
};
*/
