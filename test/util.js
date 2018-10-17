'use strict';

const expect = require('chai').expect;
const util = require('../src/util');

describe('util', () => {

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
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-09'));
            expect(result).to.include({ fromDate: '2018-08-03', toDate: '2018-08-03' });
        });

        it('should use last week for tomorrow\'s date across years', () => {
            const slots = { date: { name: 'date', value: '2019-01-06' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2019-01-01'));
            expect(result).to.include({ fromDate: '2018-12-30', toDate: '2018-12-30' });
        });

        it('should use previous year for future date', () => {
            // Alexa defaults to dates on or after the current date, so if on 2018-04-03 someone specifies
            // yesterday's date, Alexa gives 2019-04-02 as slot value.
            const slots = { date: { name: 'date', value: '2019-08-09' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-08-09', toDate: '2018-08-09' });
        });

        it('should work with last weekend', () => {
            const slots = { date: { name: 'date', value: '2018-W31-WE' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-08-04', toDate: '2018-08-05' });
        });

        it('should work with this weekend on Saturday', () => {
            const slots = { date: { name: 'date', value: '2018-W31-WE' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-04'));
            expect(result).to.include({ fromDate: '2018-08-04', toDate: '2018-08-05' });
        });

        it('should work with this weekend on Sunday', () => {
            const slots = { date: { name: 'date', value: '2018-W31-WE' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-05'));
            expect(result).to.include({ fromDate: '2018-08-04', toDate: '2018-08-05' });
        });

        it('should work with this weekend on Friday', () => {
            const slots = { date: { name: 'date', value: '2018-W32-WE' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-08-11', toDate: '2018-08-12' });
        });

        it('should work with last week', () => {
            const slots = { date: { name: 'date', value: '2018-W31' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-07-30', toDate: '2018-08-05' });
        });

        it('should work with this week', () => {
            const slots = { date: { name: 'date', value: '2018-W32' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-08-06', toDate: '2018-08-12' });
        });

        it('should work with next week', () => {
            const slots = { date: { name: 'date', value: '2018-W33' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-08-13', toDate: '2018-08-19' });
        });

        it('should work with January', () => {
            const slots = { date: { name: 'date', value: '2018-01' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-01-01', toDate: '2018-01-31' });
        });

        it('should work with January next year', () => {
            const slots = { date: { name: 'date', value: '2019-01' } };
            const result = util.calculateFromToDateKeys(slots, new Date('2018-08-10'));
            expect(result).to.include({ fromDate: '2018-01-01', toDate: '2018-01-31' });
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
            const today = util.dateISOString(new Date());
            expect(result).to.equal(today);
        });

        it('should use slot value for past date', () => {
            const value = '2018-04-03';
            const slots = { date: { name: 'date', value: value } };
            const result = util.calculateDateKey(slots);
            expect(result).to.equal(value);
        });

        it('should use last week for tomorrow\'s date', () => {
            const slots = { date: { name: 'date', value: '2018-08-10' } };
            const result = util.calculateDateKey(slots, new Date('2018-08-09'));
            expect(result).to.equal('2018-08-03');
        });

        it('should use last week for tomorrow\'s date across years', () => {
            const slots = { date: { name: 'date', value: '2019-01-06' } };
            const result = util.calculateDateKey(slots, new Date('2019-01-01'));
            expect(result).to.equal('2018-12-30');
        });

        it('should use previous year for future date', () => {
            // Alexa defaults to dates on or after the current date, so if on 2018-04-03 someone specifies
            // yesterday's date, Alexa gives 2019-04-02 as slot value.
            const slots = { date: { name: 'date', value: '2019-08-09' } };
            const result = util.calculateDateKey(slots, new Date('2018-08-10'));
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
