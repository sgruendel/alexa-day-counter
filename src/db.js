'use strict';

const TABLE_NAME = 'DayCounter'; // arn:aws:dynamodb:eu-west-1:467353799488:table/DayCounter

const dynamo = require('dynamodb');
dynamo.AWS.config.update({ region: 'eu-west-1' });
const Joi = require('joi');
const util = require('util');

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

exports.create = util.promisify(DayCounter.create);

exports.get = util.promisify(DayCounter.get);

exports.query = function(userId) {
    return new Promise((resolve, reject) => {
        DayCounter
            .query(userId)
            .loadAll()
            .exec((err, data) => {
                if (err) reject(err);
                resolve(data);
            });
    });
};

exports.queryDateBetween = function(userId, fromDate, toDate) {
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

exports.destroyAll = util.promisify((userId, callback) => {
    DayCounter
        .query(userId)
        .loadAll()
        .exec((err, rows) => {
            if (err) callback(err);
            callback(null,
                Promise.all(rows.Items.map(row => {
                    return new Promise((resolve, reject) => {
                        DayCounter.destroy(userId, row.get('date'), (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                    });
                }))
            );
        });
});
