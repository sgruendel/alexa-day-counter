'use strict';

const TABLE_NAME = 'DayCounter'; // arn:aws:dynamodb:eu-west-1:467353799488:table/DayCounter

const dynasty = require('dynasty')({ region: 'eu-west-1' });

var exports = module.exports = {};

exports.insert = function(userId, date, count) {
    return dynasty.table(TABLE_NAME).insert({ userId: userId, date: date, count: count });
};

exports.find = function(userId, date) {
    return dynasty.table(TABLE_NAME).find({ hash: userId, range: date });
};

exports.findAll = function(userId) {
    return dynasty.table(TABLE_NAME).findAll(userId);
};

exports.remove = function(userId, date) {
    return dynasty.table(TABLE_NAME).remove({ hash: userId, range: date });
};
