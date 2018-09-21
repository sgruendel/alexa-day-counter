'use strict';

var expect = require('chai').expect;
var util = require('../src/util');

describe('util', () => {

    describe('#calculateFromToDateKeys()', () => {
        it('should default to null/null when no slot value given', () => {
            const slots = { Date: { name: 'Date' } };
            const result = util.calculateFromToDateKeys(slots);
            expect(result).to.include({fromDate: null, toDate: null});
        });

        it('should use slot value for past date', () => {
            const value = '2018-04-03';
            const slots = { Date: { name: 'Date', value: value } };
            const result = util.calculateFromToDateKeys(slots);
            expect(result).to.include({ fromDate: value, toDate: value });
        });

        it('should use last week for tomorrow\'s date', () => {
            const slots = { Date: { name: 'Date', value: '2018-08-10' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-09'));
            expect(result).to.include({ fromDate: '2018-08-03', toDate: '2018-08-03' });
        });

        it('should use last week for tomorrow\'s date across years', () => {
            const slots = { Date: { name: 'Date', value: '2019-01-06' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2019-01-01'));
            expect(result).to.include({ fromDate: '2018-12-30', toDate: '2018-12-30' });
        });

        it('should use previous year for future date', () => {
            // Alexa defaults to dates on or after the current date, so if on 2018-04-03 someone specifies
            // yesterday's date, Alexa gives 2019-04-02 as slot value.
            const slots = { Date: { name: 'Date', value: '2019-08-09' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-08-09', toDate: '2018-08-09' });
        });

        it('should work with last weekend', () => {
            const slots = { Date: { name: 'Date', value: '2018-W31-WE' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-08-04', toDate: '2018-08-05' });
        });

        it('should work with this weekend', () => {
            const slots = { Date: { name: 'Date', value: '2018-W32-WE' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-08-04', toDate: '2018-08-05' });
        });

        it('should work with last week', () => {
            const slots = { Date: { name: 'Date', value: '2018-W31' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-07-30', toDate: '2018-08-05' });
        });

        it('should work with this week', () => {
            const slots = { Date: { name: 'Date', value: '2018-W32' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-08-06', toDate: '2018-08-10' });
        });

        it('should work with January', () => {
            const slots = { Date: { name: 'Date', value: '2018-01' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-01-01', toDate: '2018-01-31' });
        });

        it('should work with January next year', () => {
            const slots = { Date: { name: 'Date', value: '2019-01' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-01-01', toDate: '2018-01-31' });
        });

        it('should work with 2018 (English locale)', () => {
            const slots = { Date: { name: 'Date', value: '2018' } };
            const result = util.calculateFromToDateKeys(slots);
            expect(result).to.include({ fromDate: '2018-01-01', toDate: '2018-12-31' });
        });

        it('should work with 2018 (Non-English locale)', () => {
            const slots = { Date: { name: 'Date', value: '2018-XX-XX' } };
            const result = util.calculateFromToDateKeys(slots);
            expect(result).to.include({ fromDate: '2018-01-01', toDate: '2018-12-31' });
        });
    });

    describe('#calculateDateKey()', () => {
        it('should default to today when no slot value given', () => {
            const slots = { Date: { name: 'Date' } };
            const result = util.calculateDateKey(slots);
            const today = util.dateISOString(new Date());
            expect(result).to.equal(today);
        });

        it('should use slot value for past date', () => {
            const value = '2018-04-03';
            const slots = { Date: { name: 'Date', value: value } };
            const result = util.calculateDateKey(slots);
            expect(result).to.equal(value);
        });

        it('should use last week for tomorrow\'s date', () => {
            const slots = { Date: { name: 'Date', value: '2018-08-10' } };
            const result = util.calculateDateKey(slots, new Date('2018-08-09'));
            expect(result).to.equal('2018-08-03');
        });

        it('should use last week for tomorrow\'s date across years', () => {
            const slots = { Date: { name: 'Date', value: '2019-01-06' } };
            const result = util.calculateDateKey(slots, new Date('2019-01-01'));
            expect(result).to.equal('2018-12-30');
        });

        it('should use previous year for future date', () => {
            // Alexa defaults to dates on or after the current date, so if on 2018-04-03 someone specifies
            // yesterday's date, Alexa gives 2019-04-02 as slot value.
            const slots = { Date: { name: 'Date', value: '2019-08-09' } };
            const result = util.calculateDateKey(slots, new Date('2018-08-10'));
            expect(result).to.equal('2018-08-09');
        });

        it('should not accept whole weeks', () => {
            const slots = { Date: { name: 'Date', value: '2018-W14' } };
            const result = util.calculateDateKey(slots);
            expect(result).to.be.null;
        });

        it('should not accept whole months', () => {
            const slots = { Date: { name: 'Date', value: '2018-04' } };
            const result = util.calculateDateKey(slots);
            expect(result).to.be.null;
        });
    });
});
