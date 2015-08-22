var MyoJS = require('../src/Index.js'),
    assert = require('chai').assert;

describe('CircularBuffer', function(){
    describe('#push', function(){
        it('should allow pushing elements', function(){
            var buf = new MyoJS.CircularBuffer(10);
            buf.push(1);
            buf.push(2);
            buf.push(3);
            assert.strictEqual(3, buf.get());
            assert.strictEqual(2, buf.get(1));
            assert.strictEqual(1, buf.get(2));
            assert.strictEqual(undefined, buf.get(3))
        });
    });
    describe('Overflowing', function(){
        it('should return elements after its overflowed', function(){
            var buf = new MyoJS.CircularBuffer(10);
            for (var i = 0; i != 20; i++) {
                buf.push(i);
            }
            assert.strictEqual(19, buf.get());
            assert.strictEqual(18, buf.get(1));
            assert.strictEqual(undefined, buf.get(10));
        });
    });
});
