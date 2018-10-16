'use strict';

var expect = require('chai').expect;
var s3 = require('../src/s3');

describe('s3', () => {

    describe('#upload()', () => {
        it('should upload', () => {
            const result = s3.upload('key', 'body');
            console.log('result', result);
            expect(result).to.not.be.null;
        });
    });
});
