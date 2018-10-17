'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

const db = require('../src/db');

const USER_ID = 'amzn1.ask.account.unit_test';

describe('db', () => {

    describe('#create()', () => {
        it('should create data', () => {
            const date = '2018-10-17';
            const value = 42;
            return db.create(USER_ID, date, value).should.eventually.not.be.null;

        });
    });

    describe('#get()', () => {
        it('should get existing data', () => {
            const date = '2018-10-17';
            return db.get(USER_ID, date).should.eventually.not.be.null;
        });

        it('should fail for non-existing data', () => {
            const date = '2018-10-18';
            return db.get(USER_ID, date).should.eventually.be.null;
        });
    });

    describe('#findAll()', () => {
        it('should find data', () => {
            return db.findAll(USER_ID, '2018-10-17', '2018-10-18').should.eventually.not.be.null;
        });
    });
});
