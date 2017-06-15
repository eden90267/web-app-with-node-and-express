/**
 * Created by eden90267 on 2017/6/3.
 */
var fortune = require('../lib/fortune');
var expect = require('chai').expect;

suite('Fortune cookie tests', function () {

    test('getFortune() should return a fortune', function () {
        expect(typeof fortune.getFortune() === 'string');
    });

});