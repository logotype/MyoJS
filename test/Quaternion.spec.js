import {assert} from 'chai';
import Quaternion from './../src/Quaternion.js';

describe('Quaternion', () => {
    describe('Constructor validation', () => {
        it('should return a Quaternion object with correct components', () => {
            const quaternion = new Quaternion([1, 2, 3, 4]);
            assert.strictEqual(quaternion.x, 1);
            assert.strictEqual(quaternion.y, 2);
            assert.strictEqual(quaternion.z, 3);
            assert.strictEqual(quaternion.w, 4);
            assert.strictEqual(quaternion instanceof Quaternion, true);
        });
        it('should throw an error when passing an empty object', () => {
            assert.throws(() =>  {
                new Quaternion({});
            }, Error, 'Components needs to be an array');
        });
        it('should throw an error when passing strings', () => {
            assert.throws(() =>  {
                new Quaternion(['a', 'b', 'c', 'd']);
            }, Error, 'Component values needs to be integers or numbers');
        });
    });
    describe('Euler angles', () => {
        describe('#toEuler', () => {
            it('should return a euler object with correct components', () => {
                const euler = new Quaternion([0.235, -0.667, 0.241, 0.665]).toEuler();
                assert.closeTo(euler.heading, -1.5763, 0.0001);
                assert.closeTo(euler.attitude, 0.0070, 0.0001);
                assert.closeTo(euler.bank, 0.6864, 0.0001);
            });
        });
        describe('#roll', () => {
            it('should return a correct roll', () => {
                assert.closeTo(new Quaternion([0.235, -0.667, 0.241, 0.665]).roll(), -1.5763, 0.001);
            });
        });
        describe('#pitch', () => {
            it('should return a correct pitch', () => {
                assert.closeTo(new Quaternion([0.235, -0.667, 0.241, 0.665]).pitch(), 0.6864, 0.001);
            });
        });
        describe('#yaw', () => {
            it('should return a correct yaw', () => {
                assert.closeTo(new Quaternion([0.235, -0.667, 0.241, 0.665]).yaw(), 0.0070, 0.001);
            });
        });
    });
    describe('#normalized', () => {
        it('should return a Quaternion object with a length of one, pointing in the same direction as this Quaternion object', () => {
            const quaternion = new Quaternion([21, 35, 78, 32]).normalized();
            assert.closeTo(quaternion.x, 0.2241921902, 0.0001);
            assert.closeTo(quaternion.y, 0.3736536503, 0.0001);
            assert.closeTo(quaternion.z, 0.8327138492, 0.0001);
            assert.closeTo(quaternion.w, 0.3416261946, 0.0001);
        });
    });
    describe('#conjugate', () => {
        it('should return a Quaternion object with all components negated, except w', () => {
            const quaternion = new Quaternion([21, 35, 78, 32]).conjugate();
            assert.closeTo(quaternion.x, -21, 0.0001);
            assert.closeTo(quaternion.y, -35, 0.0001);
            assert.closeTo(quaternion.z, -78, 0.0001);
            assert.closeTo(quaternion.w, 32, 0.0001);
        });
    });
    describe('#toString', () => {
        it('should return a String describing Quaternion invalid', () => {
            assert.strictEqual(Quaternion.invalid().toString(), '[Quaternion invalid]');
        });
        it('should return a String describing Quaternion x, y, z and w', () => {
            assert.strictEqual(new Quaternion([1, 2, 3, 4]).toString(), '[Quaternion x:1 y:2 z:3 w:4]');
        });
    });
});
