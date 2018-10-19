'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

const db = require('../src/db');

const USER_ID = 'amzn1.ask.account.unit_test';

describe('db', () => {
    before(async function() {
        await db.destroyAll(USER_ID);
        return db.query(USER_ID).should.eventually.have.property('Count', 0);
    });

    describe('#create()', () => {
        it('should create data', () => {
            const model = { userId: USER_ID, date: '2018-10-17', count: 42 };
            return db.create(model).should.eventually.have.deep.property('attrs', model);
        });
    });

    describe('#get()', () => {
        it('should get existing data', () => {
            const date = '2018-10-17';
            return db.get(USER_ID, date).should.eventually.have.deep.property('attrs', { userId: USER_ID, date: date, count: 42 });
        });

        it('should not find non-existing data', () => {
            return db.get(USER_ID, '2018-10-18').should.eventually.be.null;
        });
    });

    describe('#query()', () => {
        it('should find data for existing user', () => {
            return db.query(USER_ID).should.eventually.have.property('Count', 1);
        });

        it('should not find data for non-existing user', () => {
            return db.query(USER_ID + '_non-existing').should.eventually.have.property('Count', 0);
        });
    });

    describe('#queryDateBetween()', () => {
        it('should find existing data', () => {
            return db.queryDateBetween(USER_ID, '2018-10-17', '2018-10-18').should.eventually.have.property('Count', 1);
        });

        it('should not find data for non-existing date range', () => {
            return db.queryDateBetween(USER_ID, '2019-10-17', '2019-10-18').should.eventually.have.property('Count', 0);
        });
    });

    describe('#destroyAll()', () => {
        it('should destroy all data for a user', () => {
            return db.destroyAll(USER_ID).should.be.fulfilled;
        });

        it('should work for non-existing user', () => {
            return db.destroyAll(USER_ID + '_non-existing').should.be.fulfilled;
        });
    });
});
