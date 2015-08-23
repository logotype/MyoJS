import {assert} from 'chai';
import {Vector3} from './../src/Vector3.js';

describe('Vector3', () => {
    describe('Constructor validation', () => {
        it('should return a Vector3 object with correct components', () => {
            let vec = new Vector3([1, 2, 3]);
            assert.strictEqual(vec.x, 1);
            assert.strictEqual(vec.y, 2);
            assert.strictEqual(vec.z, 3);
            assert.strictEqual(vec instanceof Vector3, true);
        });
        it('should throw an error when passing an empty object', () => {
            assert.throws(() => {
                new Vector3({});
            }, Error, 'Components needs to be an array');
        });
        it('should throw an error when having no arguments', () => {
            assert.throws(() => {
                new Vector3();
            }, Error, 'Missing constructor arguments');
        });
        it('should throw an error when passing strings', () => {
            assert.throws(() => {
                new Vector3(['a', 'b', 'c']);
            }, Error, 'Component values needs to be integers or numbers');
        });
        it('should throw an error when passing string as argument', () => {
            assert.throws(() => {
                new Vector3('someString');
            }, Error, 'Constructor parameter needs to be an object');
        });
    });
    describe('#opposite', () => {
        it('should return a Vector3 object with all components negated', () => {
            let vec1 = new Vector3([1, 2, 3]).opposite();
            assert.strictEqual(-1, vec1.x);
            assert.strictEqual(-2, vec1.y);
            assert.strictEqual(-3, vec1.z);
        });
    });
    describe('#plus', () => {
        it('should add vectors component-wise', () => {
            let vec1 = new Vector3([1, 2, 3]).plus(new Vector3([4, 5, 6]));
            assert.strictEqual(vec1.x, 5);
            assert.strictEqual(vec1.y, 7);
            assert.strictEqual(vec1.z, 9);
        });
    });
    describe('#plusAssign', () => {
        it('should add vectors component-wise and assign the value', () => {
            let vec1 = new Vector3([1, 2, 3]);
            vec1.plusAssign(new Vector3([4, 5, 6]));
            assert.strictEqual(vec1.x, 5);
            assert.strictEqual(vec1.y, 7);
            assert.strictEqual(vec1.z, 9);
        });
    });
    describe('#minus', () => {
        it('should return a copy of this vector pointing in the opposite direction', () => {
            let vec1 = new Vector3([4, 5, 6]).minus(new Vector3([1, 2, 3]));
            assert.strictEqual(vec1.x, 3);
            assert.strictEqual(vec1.y, 3);
            assert.strictEqual(vec1.z, 3);
        });
    });
    describe('#minusAssign', () => {
        it('should return a copy of this vector pointing in the opposite direction and assign the value', () => {
            let vec1 = new Vector3([4, 5, 6]).minusAssign(new Vector3([1, 2, 3]));
            assert.strictEqual(vec1.x, 3);
            assert.strictEqual(vec1.y, 3);
            assert.strictEqual(vec1.z, 3);
        });
    });
    describe('#multiply', () => {
        it('should multiply a vector by a scalar', () => {
            let vec1 = new Vector3([5, 10, 15]).multiply(5);
            assert.strictEqual(vec1.x, 25);
            assert.strictEqual(vec1.y, 50);
            assert.strictEqual(vec1.z, 75);
        });
    });
    describe('#multiplyAssign', () => {
        it('should multiply a vector by a scalar and assign the quotient', () => {
            let vec1 = new Vector3([5, 10, 15]).multiplyAssign(5);
            assert.strictEqual(vec1.x, 25);
            assert.strictEqual(vec1.y, 50);
            assert.strictEqual(vec1.z, 75);
        });
    });
    describe('#divide', () => {
        it('should divide a vector by a scalar', () => {
            let vec1 = new Vector3([5, 10, 15]).divide(3);
            assert.strictEqual(vec1.x, 1.6666666666666667);
            assert.strictEqual(vec1.y, 3.3333333333333333);
            assert.strictEqual(vec1.z, 5);
        });
    });
    describe('#divideAssign', () => {
        it('should divide a vector by a scalar and assign the value', () => {
            let vec1 = new Vector3([5, 10, 15]).divideAssign(3);
            assert.closeTo(vec1.x, 1.6666666666666667, 0.0001);
            assert.closeTo(vec1.y, 3.3333333333333333, 0.0001);
            assert.closeTo(vec1.z, 5, 0.0001);
        });
    });
    describe('#isEqual', () => {
        it('should be equal', () => {
            assert.strictEqual(new Vector3([1, 2, 3]).isEqualTo(new Vector3([1, 2, 3])), true);
        });
        it('should not be equal', () => {
            assert.strictEqual(new Vector3([1, 2, 3]).isEqualTo(new Vector3([4, 5, 6])), false);
        });
    });
    describe('#angleTo', () => {
        it('should return the angle between this vector and the specified vector in radians', () => {
            assert.closeTo(new Vector3([1, 2, 3]).angleTo(new Vector3([4, 5, 6])), 0.2257261285527342, 0.0001);
        });
        it('should return 0 when the denominator is less or equal to 0', () => {
            assert.strictEqual(new Vector3([-1, -1, -1]).angleTo(new Vector3([0, 0, 0])), 0);
        });
    });
    describe('#distanceTo', () => {
        it('should return the distance between the point represented by this Vector object and a point represented by the specified Vector object', () => {
            assert.closeTo(new Vector3([-7, -4, 3]).distanceTo(new Vector3([17, 6, 2.5])), 26.004807247892, 0.0001);
        });
    });
    describe('#cross', () => {
        it('should return cross product of this vector and the specified vector', () => {
            let vec1 = new Vector3([2, 14, 32]).cross(new Vector3([46, 11, 98]));
            assert.strictEqual(vec1.x, 1020);
            assert.strictEqual(vec1.y, 1276);
            assert.strictEqual(vec1.z, -622);
        });
    });
    describe('#dot', () => {
        it('should return the dot product of this vector with another vector', () => {
            assert.strictEqual(new Vector3([34, 17, 84]).dot(new Vector3([56, 41, 28])), 4953);
        });
    });
    describe('#isValid', () => {
        it('should be valid', () => { assert.strictEqual(new Vector3([1, 2, 3]).isValid(), true) });
        assert.throws(() => {
            new Vector3(['a', 'b', 'c']);
        }, Error, 'Component values needs to be integers or numbers');
        assert.throws(() => {
            new Vector3([NaN, NaN, NaN]);
        }, Error, 'Component values needs to be integers or numbers');
        assert.throws(() => {
            new Vector3({});
        }, Error, 'Components needs to be an array');
        it('should not be valid', () => { assert.strictEqual(new Vector3({invalid:true}).isValid(), false) });
    });
    describe('#magnitude', () => {
        it('should return the magnitude, or length, of this vector', () => {
            assert.closeTo(new Vector3([42, 77, 29]).magnitude(), 92.379651439, 0.0001);
        });
    });
    describe('#magnitudeSquared', () => {
        it('should return the square of the length of this vector', () => {
            assert.closeTo(new Vector3([42, 77, 29]).magnitudeSquared(), 8534, 0.0001);
        });
    });
    describe('#normalized', () => {
        it('should return a Vector object with a length of one, pointing in the same direction as this Vector object', () => {
            let vec1 = new Vector3([42, 77, 29]).normalized();
            assert.closeTo(vec1.x, 0.4546455778, 0.0001);
            assert.closeTo(vec1.y, 0.8335168927, 0.0001);
            assert.closeTo(vec1.z, 0.3139219466, 0.0001);
        });
        it('should return a zero vector when the denominator is less or equal to 0', () => {
            assert.strictEqual(new Vector3([0, 0, 0]).normalized().x, 0);
            assert.strictEqual(new Vector3([0, 0, 0]).normalized().y, 0);
            assert.strictEqual(new Vector3([0, 0, 0]).normalized().z, 0);
        });
    });
    describe('#pitch', () => {
        it('should return the correct pitch for a given vector', () => {
            assert.closeTo(new Vector3([42, 77, 29]).pitch(), 1.930989471212727, 0.0001);
        });
    });
    describe('#yaw', () => {
        it('should return the correct yaw for a given vector', () => {
            assert.closeTo(new Vector3([42, 77, 29]).yaw(), 2.175101833661126, 0.0001);
        });
    });
    describe('#roll', () => {
        it('should return the correct yaw for a given vector', () => {
            assert.closeTo(new Vector3([42, 77, 29]).roll(), 2.642245931909663, 0.0001);
        });
    });
    describe('#zero', () => {
        it('should return the correct vector', () => {
            let vec1 = Vector3.zero();
            assert.closeTo(vec1.x, 0.0, 0.0001);
            assert.closeTo(vec1.y, 0.0, 0.0001);
            assert.closeTo(vec1.z, 0.0, 0.0001);
        });
    });
    describe('#xAxis', () => {
        it('should return the correct vector', () => {
            let vec1 = Vector3.xAxis();
            assert.closeTo(vec1.x, 1.0, 0.0001);
            assert.closeTo(vec1.y, 0.0, 0.0001);
            assert.closeTo(vec1.z, 0.0, 0.0001);
        });
    });
    describe('#yAxis', () => {
        it('should return the correct vector', () => {
            let vec1 = Vector3.yAxis();
            assert.closeTo(vec1.x, 0.0, 0.0001);
            assert.closeTo(vec1.y, 1.0, 0.0001);
            assert.closeTo(vec1.z, 0.0, 0.0001);
        });
    });
    describe('#zAxis', () => {
        it('should return the correct vector', () => {
            let vec1 = Vector3.zAxis();
            assert.closeTo(vec1.x, 0.0, 0.0001);
            assert.closeTo(vec1.y, 0.0, 0.0001);
            assert.closeTo(vec1.z, 1.0, 0.0001);
        });
    });
    describe('#left', () => {
        it('should return the correct vector', () => {
            let vec1 = Vector3.left();
            assert.closeTo(vec1.x, -1.0, 0.0001);
            assert.closeTo(vec1.y, 0.0, 0.0001);
            assert.closeTo(vec1.z, 0.0, 0.0001);
        });
    });
    describe('#right', () => {
        it('should return the correct vector', () => {
            let vec1 = Vector3.right();
            assert.closeTo(vec1.x, 1.0, 0.0001);
            assert.closeTo(vec1.y, 0.0, 0.0001);
            assert.closeTo(vec1.z, 0.0, 0.0001);
        });
    });
    describe('#down', () => {
        it('should return the correct vector', () => {
            let vec1 = Vector3.down();
            assert.closeTo(vec1.x, 0.0, 0.0001);
            assert.closeTo(vec1.y, -1.0, 0.0001);
            assert.closeTo(vec1.z, 0.0, 0.0001);
        });
    });
    describe('#up', () => {
        it('should return the correct vector', () => {
            let vec1 = Vector3.up();
            assert.closeTo(vec1.x, 0.0, 0.0001);
            assert.closeTo(vec1.y, 1.0, 0.0001);
            assert.closeTo(vec1.z, 0.0, 0.0001);
        });
    });
    describe('#forward', () => {
        it('should return the correct vector', () => {
            let vec1 = Vector3.forward();
            assert.closeTo(vec1.x, 0.0, 0.0001);
            assert.closeTo(vec1.y, 0.0, 0.0001);
            assert.closeTo(vec1.z, -1.0, 0.0001);
        });
    });
    describe('#backward', () => {
        it('should return the correct vector', () => {
            let vec1 = Vector3.backward();
            assert.closeTo(vec1.x, 0.0, 0.0001);
            assert.closeTo(vec1.y, 0.0, 0.0001);
            assert.closeTo(vec1.z, 1.0, 0.0001);
        });
    });
    describe('#toString', () => {
        it('should return a String describing Vector3 invalid', () => {
            assert.strictEqual(Vector3.invalid().toString(), '[Vector3 invalid]');
        });
        it('should return a String describing Vector3 x, y and z', () => {
            assert.strictEqual(new Vector3([42, 77, 29]).toString(), '[Vector3 x:42 y:77 z:29]');
        });
    });
});
