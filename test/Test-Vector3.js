var MyoJS = require('../src'),
    assert = require('chai').assert;

describe('Vector3', function(){
    describe('constructor', function(){
        it('should return a Vector3 object with correct components', function(){
            var vec = new MyoJS.Vector3([1, 2, 3]);
            assert.equal(vec.x, 1);
            assert.equal(vec.y, 2);
            assert.equal(vec.z, 3);
        });
    });
    describe('#opposite', function(){
        it('should return a Vector3 object with all components negated', function(){
            var vec1 = new MyoJS.Vector3([1, 2, 3]);
            var vec2 = vec1.opposite();
            assert.equal(-1, vec2.x);
            assert.equal(-2, vec2.y);
            assert.equal(-3, vec2.z);
        });
    });
    describe('#plus', function(){
        it('should add vectors component-wise', function(){
            var vec1 = new MyoJS.Vector3([1, 2, 3]);
            var vec2 = new MyoJS.Vector3([4, 5, 6]);
            var vec3 = vec1.plus(vec2);
            assert.equal(vec3.x, 5);
            assert.equal(vec3.y, 7);
            assert.equal(vec3.z, 9);
        });
    });
    describe('#plusAssign', function(){
        it('should add vectors component-wise and assign the value', function(){
            var vec1 = new MyoJS.Vector3([1, 2, 3]);
            var vec2 = new MyoJS.Vector3([4, 5, 6]);
            vec1.plusAssign(vec2);
            assert.equal(vec1.x, 5);
            assert.equal(vec1.y, 7);
            assert.equal(vec1.z, 9);
        });
    });
    describe('#minus', function(){
        it('should return a copy of this vector pointing in the opposite direction', function(){
            var vec1 = new MyoJS.Vector3([4, 5, 6]);
            var vec2 = new MyoJS.Vector3([1, 2, 3]);
            var vec3 = vec1.minus(vec2);
            assert.equal(vec3.x, 3);
            assert.equal(vec3.y, 3);
            assert.equal(vec3.z, 3);
        });
    });
    describe('#minusAssign', function(){
        it('should return a copy of this vector pointing in the opposite direction and assign the value', function(){
            var vec1 = new MyoJS.Vector3([4, 5, 6]);
            var vec2 = new MyoJS.Vector3([1, 2, 3]);
            vec1.minusAssign(vec2);
            assert.equal(vec1.x, 3);
            assert.equal(vec1.y, 3);
            assert.equal(vec1.z, 3);
        });
    });
    describe('#multiply', function(){
        it('should multiply a vector by a scalar', function(){
            var vec1 = new MyoJS.Vector3([5, 10, 15]);
            var vec2 = vec1.multiply(5);
            assert.equal(vec2.x, 25);
            assert.equal(vec2.y, 50);
            assert.equal(vec2.z, 75);
        });
    });
    describe('#multiplyAssign', function(){
        it('should multiply a vector by a scalar and assign the quotient', function(){
            var vec1 = new MyoJS.Vector3([5, 10, 15]);
            vec1.multiplyAssign(5);
            assert.equal(vec1.x, 25);
            assert.equal(vec1.y, 50);
            assert.equal(vec1.z, 75);
        });
    });
    describe('#divide', function(){
        it('should divide a vector by a scalar', function(){
            var vec1 = new MyoJS.Vector3([5, 10, 15]);
            var vec2 = vec1.divide(3);
            assert.equal(vec2.x, 1.6666666666666667);
            assert.equal(vec2.y, 3.3333333333333333);
            assert.equal(vec2.z, 5);
        });
    });
    describe('#divideAssign', function(){
        it('should divide a vector by a scalar and assign the value', function(){
            var vec1 = new MyoJS.Vector3([5, 10, 15]);
            vec1.divideAssign(3);
            assert.closeTo(vec1.x, 1.6666666666666667, 0.0001);
            assert.closeTo(vec1.y, 3.3333333333333333, 0.0001);
            assert.closeTo(vec1.z, 5, 0.0001);
        });
    });
    describe('#isEqual', function(){
        it('should be equal', function(){
            assert.equal(new MyoJS.Vector3([1, 2, 3]).isEqualTo(new MyoJS.Vector3([1, 2, 3])), true);
        });
        it('should not be equal', function(){
            assert.equal(new MyoJS.Vector3([1, 2, 3]).isEqualTo(new MyoJS.Vector3([4, 5, 6])), false);
        });
    });
    describe('#angleTo', function(){
        it('should return the angle between this vector and the specified vector in radians', function(){
            assert.closeTo(new MyoJS.Vector3([1, 2, 3]).angleTo(new MyoJS.Vector3([4, 5, 6])), 0.2257261285527342, 0.0001);
        });
    });
    describe('#distanceTo', function(){
        it('should return the distance between the point represented by this Vector object and a point represented by the specified Vector object', function(){
            assert.closeTo(new MyoJS.Vector3([-7, -4, 3]).distanceTo(new MyoJS.Vector3([17, 6, 2.5])), 26.004807247892, 0.0001);
        });
    });
    describe('#cross', function(){
        it('should return cross product of this vector and the specified vector', function(){
            var vec1 = new MyoJS.Vector3([2, 14, 32]);
            var vec2 = new MyoJS.Vector3([46, 11, 98]);
            var vec3 = vec1.cross(vec2);
            assert.equal(vec3.x, 1020);
            assert.equal(vec3.y, 1276);
            assert.equal(vec3.z, -622);
        });
    });
    describe('#dot', function(){
        it('should return the dot product of this vector with another vector', function(){
            var vec1 = new MyoJS.Vector3([34, 17, 84]);
            var vec2 = new MyoJS.Vector3([56, 41, 28]);
            assert.equal(vec1.dot(vec2), 4953);
        });
    });
    describe('#isValid', function(){
        it('should be valid', function(){ assert.equal(new MyoJS.Vector3([1, 2, 3]).isValid(), true) });
        it('should not be valid', function(){ assert.equal(new MyoJS.Vector3(["a", "b", "c"]).isValid(), false) });
        it('should not be valid', function(){ assert.equal(new MyoJS.Vector3([NaN, NaN, NaN]).isValid(), false) });
        it('should not be valid', function(){ assert.equal(new MyoJS.Vector3({}).isValid(), false) });
        it('should not be valid', function(){ assert.equal(new MyoJS.Vector3({invalid:true}).isValid(), false) });
    });
    describe('#magnitude', function(){
        it('should return the magnitude, or length, of this vector', function(){
            assert.closeTo(new MyoJS.Vector3([42, 77, 29]).magnitude(), 92.379651439, 0.0001);
        });
    });
    describe('#magnitudeSquared', function(){
        it('should return the square of the length of this vector', function(){
            assert.closeTo(new MyoJS.Vector3([42, 77, 29]).magnitudeSquared(), 8534, 0.0001);
        });
    });
    describe('#normalized', function(){
        it('should return a Vector object with a length of one, pointing in the same direction as this Vector object', function(){
            var vec1 = new MyoJS.Vector3([42, 77, 29]).normalized();
            assert.closeTo(vec1.x, 0.4546455778, 0.0001);
            assert.closeTo(vec1.y, 0.8335168927, 0.0001);
            assert.closeTo(vec1.z, 0.3139219466, 0.0001);
        });
    });
});
