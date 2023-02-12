'use strict';

const expect = require('chai').expect;
const moment = require('moment-timezone');
const util = require('../utils');

describe('utils', () => {

    describe('#calculateFromToDateKeys()', () => {
        it('should default to null/null when no slot value given', () => {
            const slots = { date: { name: 'date' } };
            const result = util.calculateFromToDateKeys(slots);
            expect(result).to.include({ fromDate: null, toDate: null });
        });

        it('should use slot value for past date', () => {
            const value = '2018-04-03';
            const slots = { date: { name: 'date', value: value } };
            const result = util.calculateFromToDateKeys(slots);
            expect(result).to.include({ fromDate: value, toDate: value });
        });

        it('should use last week for tomorrow\'s date', () => {
            const slots = { date: { name: 'date', value: '2018-08-10' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-09'));
            expect(result).to.include({ fromDate: '2018-08-03', toDate: '2018-08-03' });
        });

        it('should use last week for tomorrow\'s date across years', () => {
            const slots = { date: { name: 'date', value: '2019-01-06' } };
            const result = util.calculateFromToDateKeys(slots, moment('2019-01-01'));
            expect(result).to.include({ fromDate: '2018-12-30', toDate: '2018-12-30' });
        });

        it('should use previous year for future date', () => {
            // Alexa defaults to dates on or after the current date, so if on 2018-04-03 someone specifies
            // yesterday's date, Alexa gives 2019-04-02 as slot value.
            const slots = { date: { name: 'date', value: '2019-08-09' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-08-09', toDate: '2018-08-09' });
        });

        it('should work with last weekend', () => {
            const slots = { date: { name: 'date', value: '2018-W31-WE' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-08-04', toDate: '2018-08-05' });
        });

        it('should work with this weekend on Saturday', () => {
            const slots = { date: { name: 'date', value: '2018-W31-WE' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-04'));
            expect(result).to.include({ fromDate: '2018-08-04', toDate: '2018-08-05' });
        });

        it('should work with this weekend on Sunday', () => {
            const slots = { date: { name: 'date', value: '2018-W31-WE' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-05'));
            expect(result).to.include({ fromDate: '2018-08-04', toDate: '2018-08-05' });
        });

        it('should work with this weekend on Friday', () => {
            const slots = { date: { name: 'date', value: '2018-W32-WE' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-08-11', toDate: '2018-08-12' });
        });

        it('should work with 1st weekend of year', () => {
            const slots = { date: { name: 'date', value: '2019-W1-WE' } };
            const result = util.calculateFromToDateKeys(slots, moment('2019-01-09'));
            expect(result).to.include({ fromDate: '2019-01-05', toDate: '2019-01-06' });
        });

        it('should work with last week', () => {
            const slots = { date: { name: 'date', value: '2018-W31' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-07-30', toDate: '2018-08-05' });
        });

        it('should work with this week', () => {
            const slots = { date: { name: 'date', value: '2018-W32' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-08-06', toDate: '2018-08-12' });
        });

        it('should work with next week', () => {
            const slots = { date: { name: 'date', value: '2018-W33' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-08-13', toDate: '2018-08-19' });
        });

        it('should work with 1st week of year', () => {
            const slots = { date: { name: 'date', value: '2019-W1' } };
            const result = util.calculateFromToDateKeys(slots, moment('2019-01-08'));
            expect(result).to.include({ fromDate: '2018-12-31', toDate: '2019-01-06' });
        });

        it('should work with January', () => {
            const slots = { date: { name: 'date', value: '2018-01' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-01-01', toDate: '2018-01-31' });
        });

        it('should work with February', () => {
            const slots = { date: { name: 'date', value: '2018-02' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-02-01', toDate: '2018-02-28' });
        });

        it('should work with March', () => {
            const slots = { date: { name: 'date', value: '2018-03' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-03-01', toDate: '2018-03-31' });
        });

        it('should work with April', () => {
            const slots = { date: { name: 'date', value: '2018-04' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-04-01', toDate: '2018-04-30' });
        });

        it('should work with January next year', () => {
            const slots = { date: { name: 'date', value: '2019-01' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-01-01', toDate: '2018-01-31' });
        });

        it('should work with February next year', () => {
            const slots = { date: { name: 'date', value: '2019-02' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-02-01', toDate: '2018-02-28' });
        });

        it('should work with March next year', () => {
            const slots = { date: { name: 'date', value: '2019-03' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-03-01', toDate: '2018-03-31' });
        });

        it('should work with April next year', () => {
            const slots = { date: { name: 'date', value: '2019-04' } };
            const result = util.calculateFromToDateKeys(slots, moment('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-04-01', toDate: '2018-04-30' });
        });

        it('should work with 2018 (English locale)', () => {
            const slots = { date: { name: 'date', value: '2018' } };
            const result = util.calculateFromToDateKeys(slots);
            expect(result).to.include({ fromDate: '2018-01-01', toDate: '2018-12-31' });
        });

        it('should work with 2018 (Non-English locale)', () => {
            const slots = { date: { name: 'date', value: '2018-XX-XX' } };
            const result = util.calculateFromToDateKeys(slots);
            expect(result).to.include({ fromDate: '2018-01-01', toDate: '2018-12-31' });
        });

        it('should work with 2019-W52 in 2019', () => {
            const slots = { date: { name: 'date', value: '2019-W52' } };
            const result = util.calculateFromToDateKeys(slots, moment('2019-12-30'));
            expect(result).to.include({ fromDate: '2019-12-23', toDate: '2019-12-29' });
        });

        it('should work with 2019-W52 in 2020', () => {
            const slots = { date: { name: 'date', value: '2019-W52' } };
            const result = util.calculateFromToDateKeys(slots, moment('2020-01-03'));
            expect(result).to.include({ fromDate: '2019-12-23', toDate: '2019-12-29' });
        });

        it('should work with 2020-W1 in 2019', () => {
            const slots = { date: { name: 'date', value: '2020-W1' } };
            const result = util.calculateFromToDateKeys(slots, moment('2019-12-31'));
            expect(result).to.include({ fromDate: '2019-12-30', toDate: '2020-01-05' });
        });

        it('should work with 2020-W1 in 2020', () => {
            const slots = { date: { name: 'date', value: '2020-W1' } };
            const result = util.calculateFromToDateKeys(slots, moment('2020-01-04'));
            expect(result).to.include({ fromDate: '2019-12-30', toDate: '2020-01-05' });
        });

        it('should work with 2020-W53 in 2020', () => {
            const slots = { date: { name: 'date', value: '2020-W53' } };
            const result = util.calculateFromToDateKeys(slots, moment('2020-12-30'));
            expect(result).to.include({ fromDate: '2020-12-28', toDate: '2021-01-03' });
        });

        it('should work with 2020-W53 in 2021', () => {
            const slots = { date: { name: 'date', value: '2020-W53' } };
            const result = util.calculateFromToDateKeys(slots, moment('2021-01-08'));
            expect(result).to.include({ fromDate: '2020-12-28', toDate: '2021-01-03' });
        });

        it('should work with 2021-W1', () => {
            const slots = { date: { name: 'date', value: '2021-W1' } };
            const result = util.calculateFromToDateKeys(slots, moment('2021-01-08'));
            expect(result).to.include({ fromDate: '2021-01-04', toDate: '2021-01-10' });
        });

        it('should work with 2021-W2', () => {
            const slots = { date: { name: 'date', value: '2021-W2' } };
            const result = util.calculateFromToDateKeys(slots, moment('2021-01-15'));
            expect(result).to.include({ fromDate: '2021-01-11', toDate: '2021-01-17' });
        });

        it('should not work with a decade', () => {
            const slots = { date: { name: 'date', value: '200X' } };
            const result = util.calculateFromToDateKeys(slots);
            expect(result).to.include({ fromDate: null, toDate: null });
        });

        it('should not work with Spring', () => {
            const slots = { date: { name: 'date', value: '2018-SP' } };
            const result = util.calculateFromToDateKeys(slots);
            expect(result).to.include({ fromDate: null, toDate: null });
        });

        it('should not work with Summer', () => {
            const slots = { date: { name: 'date', value: '2018-SU' } };
            const result = util.calculateFromToDateKeys(slots);
            expect(result).to.include({ fromDate: null, toDate: null });
        });

        it('should not work with Fall', () => {
            const slots = { date: { name: 'date', value: '2018-FA' } };
            const result = util.calculateFromToDateKeys(slots);
            expect(result).to.include({ fromDate: null, toDate: null });
        });

        it('should not work with Winter', () => {
            const slots = { date: { name: 'date', value: '2018-WI' } };
            const result = util.calculateFromToDateKeys(slots);
            expect(result).to.include({ fromDate: null, toDate: null });
        });
    });

    describe('#calculateDateKey()', () => {
        it('should default to today when no slot value given', () => {
            const slots = { date: { name: 'date' } };
            const result = util.calculateDateKey(slots);
            const today = moment().format('YYYY-MM-DD');
            expect(result).to.equal(today);
        });

        it('should give different results for today across timezones', () => {
            const slots = { date: { name: 'date' } };
            const resultTZMinus12 = util.calculateDateKey(slots, moment().tz('Etc/GMT+12')); // Sign is intentionally inverted. See https://en.wikipedia.org/wiki/Tz_database#Area
            const resultTZPlus12 = util.calculateDateKey(slots, moment().tz('Etc/GMT-12')); // Sign is intentionally inverted. See https://en.wikipedia.org/wiki/Tz_database#Area
            expect(resultTZMinus12).to.not.equal(resultTZPlus12);
        });

        it('should use slot value for past date', () => {
            const value = '2018-04-03';
            const slots = { date: { name: 'date', value: value } };
            const result = util.calculateDateKey(slots);
            expect(result).to.equal(value);
        });

        it('should use last week for tomorrow\'s date', () => {
            const slots = { date: { name: 'date', value: '2018-08-10' } };
            const result = util.calculateDateKey(slots, moment('2018-08-09'));
            expect(result).to.equal('2018-08-03');
        });

        it('should use last week for tomorrow\'s date across years', () => {
            const slots = { date: { name: 'date', value: '2019-01-06' } };
            const result = util.calculateDateKey(slots, moment('2019-01-01'));
            expect(result).to.equal('2018-12-30');
        });

        it('should use previous year for future date', () => {
            // Alexa defaults to dates on or after the current date, so if on 2018-04-03 someone specifies
            // yesterday's date, Alexa gives 2019-04-02 as slot value.
            const slots = { date: { name: 'date', value: '2019-08-09' } };
            const result = util.calculateDateKey(slots, moment('2018-08-10'));
            expect(result).to.equal('2018-08-09');
        });

        it('should not accept whole weeks', () => {
            const slots = { date: { name: 'date', value: '2018-W14' } };
            const result = util.calculateDateKey(slots);
            expect(result).to.be.null;
        });

        it('should not accept whole months', () => {
            const slots = { date: { name: 'date', value: '2018-04' } };
            const result = util.calculateDateKey(slots);
            expect(result).to.be.null;
        });
    });
});
