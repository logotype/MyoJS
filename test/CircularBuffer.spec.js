import {assert} from 'chai';
import CircularBuffer from './../src/CircularBuffer.js';

describe('CircularBuffer', () => {
    describe('#push', () => {
        it('should allow pushing elements', () => {
            const buf = new CircularBuffer(10);
            buf.push(1);
            buf.push(2);
            buf.push(3);
            assert.strictEqual(3, buf.get());
            assert.strictEqual(2, buf.get(1));
            assert.strictEqual(1, buf.get(2));
            assert.strictEqual(null, buf.get(3));
        });
    });
    describe('Overflowing', () => {
        it('should return elements after its overflowed', () => {
            const buf = new CircularBuffer(10);
            for (let i = 0; i !== 20; i++) {
                buf.push(i);
            }
            assert.strictEqual(19, buf.get());
            assert.strictEqual(18, buf.get(1));
            assert.strictEqual(null, buf.get(10));
        });
    });
});
