'use strict';

var exports = module.exports = {};

function getDateOfISOWeek(week, dayInWeek, year) {
    return exports.dateISOString(new Date(Date.UTC(year, 0, 1 + (week - 1) * 7 + dayInWeek - 1)));
}

function fixFutureDate(dateStr, today) {
    const date = new Date(dateStr);
    // Alexa defaults to dates on or after the current date, so if on 2018-04-03 someone asks for
    // "April 2nd", Alexa gives 2019-04-02 as slot value, but in this skill's context we'll use
    // the year before.
    if (date.getFullYear() === today.getFullYear() + 1) {
        var prevYear = new Date(date);
        prevYear.setFullYear(today.getFullYear());
        const result = exports.dateISOString(prevYear);
        console.log('correcting date by one year from', dateStr, 'to', result);
        return result;
    }

    // Alexa defaults to dates on or after the current date, so if on Thursday someone asks for
    // Wednesday, Alexa gives next week's Wednesday as slot value, but in this skill's context we'll
    // use the week before.
    if (date > today) {
        var oneWeekAgo = new Date(date);
        oneWeekAgo.setDate(date.getDate() - 7);
        const result = exports.dateISOString(oneWeekAgo);
        console.log('correcting date by one week from', dateStr, 'to', result);
        return result;
    }

    return dateStr;
}

exports.dateISOString = function(date) {
    return date.toISOString().split('T')[0];
};

// returns a date range as { fromDate, toDate} tuple for an Amazon Date as defined in
// https://developer.amazon.com/docs/custom-skills/slot-type-reference.html#date
exports.calculateFromToDateKeys = function(slots, today = new Date()) {
    const dateStr = slots.Date.value;

    // Fail if no value was given.
    if (!dateStr) {
        return { fromDate: null, toDate: null };
    }

    // Utterances that map to a specific date (such as “today”, or
    // “november twenty-fifth”) convert to a complete date:
    // 2015-11-25. Note that this defaults to dates on or after the
    // current date (see below for more examples).
    if (dateStr.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}/)) {
        const fixedDateStr = fixFutureDate(dateStr, today);
        return { fromDate: fixedDateStr, toDate: fixedDateStr };
    }

    // Utterances that map to the weekend for a specific week (such as
    // “this weekend”) convert to a date indicating the week number
    // and weekend: 2015-W49-WE.
    if (dateStr.match(/^[0-9]{4}-W[0-9]{2}-WE/)) {
        const re = /([0-9]+)-W([0-9]+)-WE/;
        const result = re.exec(dateStr);
        const saturday = getDateOfISOWeek(result[2], 6, result[1]);
        const sunday = getDateOfISOWeek(result[2], 7, result[1]);
        return { fromDate: saturday, toDate: sunday };
    }

    // Utterances that map to just a specific week (such as “this
    // week” or “next week”), convert a date indicating the week
    // number: 2015-W49.
    if (dateStr.match(/^[0-9]{4}-W[0-9]{2}/)) {
        const re = /([0-9]+)-W([0-9]+)/;
        const result = re.exec(dateStr);
        const monday = getDateOfISOWeek(result[2], 1, result[1]);
        const sunday = getDateOfISOWeek(result[2], 7, result[1]);
        return { fromDate: monday, toDate: sunday };
    }

    // Utterances that map to a month, but not a specific day (such as
    // “next month”, or “december”) convert to a date with just the
    // year and month: 2015-12.
    if (dateStr.match(/^[0-9]{4}-[0-9]{2}/)) {
        const startOfMonth = new Date(dateStr + '-01');
        const startOfNextMonth = new Date(Date.UTC(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1));
        const endOfMonth = new Date(startOfNextMonth);
        endOfMonth.setDate(startOfNextMonth.getDate() - 1);
        return {
            fromDate: fixFutureDate(exports.dateISOString(startOfMonth), today),
            toDate: fixFutureDate(exports.dateISOString(endOfMonth), today),
        };
    }

    // Utterances that map to a year(such as "next year") convert to a date containing just the
    // year. Note that the date format differs between English and other languages:
    // * All English locales use the the format YYYY.For example: 2018.
    // * All other languages(French, German, and Japanese) use the format YYYY - XX - XX.For example: 2018 - XX - XX.
    if (dateStr.match(/^[0-9]{4}(-XX-XX)?$/)) {
        const re = /([0-9]+)(-XX-XX)?/;
        const result = re.exec(dateStr);
        const startOfYear = new Date(result[1] + '-01-01');
        const endOfYear = new Date(result[1] + '-12-31');
        return {
            fromDate: exports.dateISOString(startOfYear),
            toDate: exports.dateISOString(endOfYear),
        };
    }

    return { fromDate: null, toDate: null };
    // TODO not relevant here

    // Utterances that map to a decade convert to a date indicating the
    // decade: 201X.

    // Utterances that map to a season (such as “next winter”) convert to
    // a date with the year and a season indicator: winter: WI, spring:
    // SP, summer: SU, fall: FA)

    // The utterance “now” resolves to the indicator PRESENT_REF rather
    // than a specific date or time.
};

exports.calculateDateKey = function(slots, today = new Date()) {
    const dateStr = slots.Date.value;

    // If no value was given, use today.
    if (!dateStr) {
        return exports.dateISOString(today);
    }

    // filter out anything that doesn't give a specific date, see
    // https://developer.amazon.com/de/docs/custom-skills/slot-type-reference.html#date
    if (!dateStr.match(/[0-9][0-9][0-9][0-9]\-[0-9][0-9]\-[0-9][0-9]/)) {
        return null;
    }

    return fixFutureDate(dateStr, today);
};
