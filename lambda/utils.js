import moment from 'moment-timezone';
import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
    exitOnError: false,
});

const YYYY_MM_DD = 'YYYY-MM-DD';

function getDateOfISOWeek(year, week, dayOfWeek) {
    return moment().year(year).isoWeek(week).isoWeekday(dayOfWeek).format(YYYY_MM_DD);
}

function fixFutureDate(dateStr, now) {
    const date = new Date(dateStr);
    // Alexa defaults to dates on or after the current date, so if on 2018-04-03 someone asks for
    // "April 2nd", Alexa gives 2019-04-02 as slot value, but in this skill's context we'll use
    // the year before.
    if (date.getFullYear() === now.year() + 1) {
        const result = moment(date).year(now.year()).format(YYYY_MM_DD);
        logger.debug('correcting date by one year from ' + dateStr + ' to ' + result);
        return result;
    }

    // Alexa defaults to dates on or after the current date, so if on Thursday someone asks for
    // Wednesday, Alexa gives next week's Wednesday as slot value, but in this skill's context we'll
    // use the week before.
    if (now.isBefore(date)) {
        const result = moment(date).subtract(7, 'days').format(YYYY_MM_DD);
        logger.debug('correcting date by one week from ' + dateStr + ' to ' + result);
        return result;
    }

    return dateStr;
}

// returns a date range as { fromDate, toDate} tuple for an Amazon Date as defined in
// https://developer.amazon.com/docs/custom-skills/slot-type-reference.html#date
export function calculateFromToDateKeys(slots, now = moment()) {
    const dateStr = slots.date.value;

    // Fail if no value was given.
    if (!dateStr) {
        return { fromDate: null, toDate: null };
    }

    // Utterances that map to a specific date (such as “today”, or
    // “november twenty-fifth”) convert to a complete date:
    // 2015-11-25. Note that this defaults to dates on or after the
    // current date (see below for more examples).
    if (dateStr.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}/)) {
        const fixedDateStr = fixFutureDate(dateStr, now);
        return { fromDate: fixedDateStr, toDate: fixedDateStr };
    }

    // Utterances that map to the weekend for a specific week (such as
    // “this weekend”) convert to a date indicating the week number
    // and weekend: 2015-W49-WE.
    if (dateStr.match(/^[0-9]{4}-W[0-9]{1,2}-WE/)) {
        const re = /([0-9]+)-W([0-9]+)-WE/;
        const result = re.exec(dateStr);
        const saturday = getDateOfISOWeek(result[1], result[2], 6);
        const sunday = getDateOfISOWeek(result[1], result[2], 7);
        return { fromDate: saturday, toDate: sunday };
    }

    // Utterances that map to just a specific week (such as “this
    // week” or “next week”), convert a date indicating the week
    // number: 2015-W49.
    if (dateStr.match(/^[0-9]{4}-W[0-9]{1,2}/)) {
        const re = /([0-9]+)-W([0-9]+)/;
        const result = re.exec(dateStr);
        const monday = getDateOfISOWeek(result[1], result[2], 1);
        const sunday = getDateOfISOWeek(result[1], result[2], 7);
        return { fromDate: monday, toDate: sunday };
    }

    // Utterances that map to a month, but not a specific day (such as
    // “next month”, or “december”) convert to a date with just the
    // year and month: 2015-12.
    if (dateStr.match(/^[0-9]{4}-[0-9]{2}/)) {
        const startOfMonth = dateStr + '-01';
        const endOfMonth = moment(startOfMonth).add(1, 'month').subtract(1, 'day').format(YYYY_MM_DD);
        return {
            fromDate: fixFutureDate(startOfMonth, now),
            toDate: fixFutureDate(endOfMonth, now),
        };
    }

    // Utterances that map to a year(such as "next year") convert to a date containing just the
    // year. Note that the date format differs between English and other languages:
    // * All English locales use the the format YYYY.For example: 2018.
    // * All other languages(French, German, and Japanese) use the format YYYY-XX-XX.For example: 2018-XX-XX.
    if (dateStr.match(/^[0-9]{4}(-XX-XX)?$/)) {
        const re = /([0-9]+)(-XX-XX)?/;
        const year = re.exec(dateStr)[1];
        return {
            fromDate: year + '-01-01',
            toDate: year + '-12-31',
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
}

export function calculateDateKey(slots, now = moment()) {
    const dateStr = slots.date.value;

    // If no value was given, use today.
    if (!dateStr) {
        return now.format(YYYY_MM_DD);
    }

    // filter out anything that doesn't give a specific date, see
    // https://developer.amazon.com/de/docs/custom-skills/slot-type-reference.html#date
    if (!dateStr.match(/[0-9][0-9][0-9][0-9]\-[0-9][0-9]\-[0-9][0-9]/)) {
        return null;
    }

    return fixFutureDate(dateStr, now);
}
