'use strict';

var exports = module.exports = {};

exports.calculateDateKey = function(slots) {
    const date = slots.Date.value;

    // If no value was given, use today.
    if (!date) {
        return new Date().toISOString().split('T')[0];
    }

    // filter out anything that doesn't give a specific date, see
    // https://developer.amazon.com/de/docs/custom-skills/slot-type-reference.html#date
    if (!date.match(/[0-9][0-9][0-9][0-9]\-[0-9][0-9]\-[0-9][0-9]/)) {
        return null;
    }

    // Alexa defaults to dates on or after the current date, so if on 2018-04-03 someone specifies
    // yesterday's date, Alexa gives 2019-04-02 as slot value, but in this skills context we'll use
    // the year before.
    const thisYear = new Date().getFullYear();
    const nextYearAsString = (thisYear + 1).toString();
    if (date.startsWith(nextYearAsString)) {
        return thisYear + date.substr(nextYearAsString.length);
    }

    return date;
};
