'use strict';

var expect = require('chai').expect;
var util = require('../src/util');

function dateISOString(date) {
    return date.toISOString().slice(0, 10);
}

describe('util', () => {

    describe('#calculateDateKey()', () => {
        it('should default to today when no slot value given', () => {
            const slots = { Date: { name: 'Date' } };
            const result = util.calculateDateKey(slots);
            const today = dateISOString(new Date());
            expect(result).to.equal(today);
        });

        it('should use slot value for past date', () => {
            const value = '2018-04-03';
            const slots = { Date: { name: 'Date', value: value } };
            const result = util.calculateDateKey(slots);
            expect(result).to.equal(value);
        });

        it('should use previous year for future date', () => {
            // Alexa defaults to dates on or after the current date, so if on 2018-04-03 someone specifies
            // yesterday's date, Alexa gives 2019-04-02 as slot value.
            var yesterdayThisYear = new Date();
            yesterdayThisYear.setDate(yesterdayThisYear.getDate() - 1);

            var yesterdayNextYear = new Date();
            yesterdayNextYear.setFullYear(yesterdayNextYear.getFullYear() + 1);
            yesterdayNextYear.setDate(yesterdayNextYear.getDate() - 1);

            const slots = { Date: { name: 'Date', value: dateISOString(yesterdayNextYear) } };
            const result = util.calculateDateKey(slots);
            expect(result).to.equal(dateISOString(yesterdayThisYear));
        });

        it('should use not accept whole weeks', () => {
            const slots = { Date: { name: 'Date', value: '2018-W14' } };
            const result = util.calculateDateKey(slots);
            expect(result).to.be.null;
        });

        it('should use not accept whole months', () => {
            const slots = { Date: { name: 'Date', value: '2018-04' } };
            const result = util.calculateDateKey(slots);
            expect(result).to.be.null;
        });
    });
});
