var MyoJS = require('../src/Index.js'),
    assert = require('chai').assert;

describe('Quaternion', function(){
    describe('Constructor validation', function(){
        it('should return a Quaternion object with correct components', function(){
            var quaternion = new MyoJS.Quaternion([1, 2, 3, 4]);
            assert.equal(quaternion.x, 1);
            assert.equal(quaternion.y, 2);
            assert.equal(quaternion.z, 3);
            assert.equal(quaternion.w, 4);
            assert.equal(quaternion instanceof MyoJS.Quaternion, true);
        });
        it('should throw an error when passing an empty object', function(){
            assert.throws(function() {
                new MyoJS.Quaternion({});
            }, Error, 'Components needs to be an array');
        });
        it('should throw an error when passing strings', function(){
            assert.throws(function() {
                new MyoJS.Quaternion(['a', 'b', 'c', 'd']);
            }, Error, 'Component values needs to be integers or numbers');
        });
    });
    describe('Euler angles', function(){
        describe('#toEuler', function(){
            it('should return a euler object with correct components', function(){
                var euler = new MyoJS.Quaternion([0.235, -0.667, 0.241, 0.665]).toEuler();
                assert.closeTo(euler.heading, -1.5763, 0.0001);
                assert.closeTo(euler.attitude, 0.0070, 0.0001);
                assert.closeTo(euler.bank, 0.6864, 0.0001);
            });
        });
        describe('#roll', function(){
            it('should return a correct roll', function(){
                assert.closeTo(new MyoJS.Quaternion([0.235, -0.667, 0.241, 0.665]).roll(), -1.5763, 0.001);
            });
        });
        describe('#pitch', function(){
            it('should return a correct pitch', function(){
                assert.closeTo(new MyoJS.Quaternion([0.235, -0.667, 0.241, 0.665]).pitch(), 0.6864, 0.001);
            });
        });
        describe('#yaw', function(){
            it('should return a correct yaw', function(){
                assert.closeTo(new MyoJS.Quaternion([0.235, -0.667, 0.241, 0.665]).yaw(), 0.0070, 0.001);
            });
        });
    });
    describe('#normalized', function(){
        it('should return a Quaternion object with a length of one, pointing in the same direction as this Quaternion object', function(){
            var quaternion = new MyoJS.Quaternion([21, 35, 78, 32]).normalized();
            assert.closeTo(quaternion.x, 0.2241921902, 0.0001);
            assert.closeTo(quaternion.y, 0.3736536503, 0.0001);
            assert.closeTo(quaternion.z, 0.8327138492, 0.0001);
            assert.closeTo(quaternion.w, 0.3416261946, 0.0001);
        });
    });
    describe('#conjugate', function(){
        it('should return a Quaternion object with all components negated, except w', function(){
            var quaternion = new MyoJS.Quaternion([21, 35, 78, 32]).conjugate();
            assert.closeTo(quaternion.x, -21, 0.0001);
            assert.closeTo(quaternion.y, -35, 0.0001);
            assert.closeTo(quaternion.z, -78, 0.0001);
            assert.closeTo(quaternion.w, 32, 0.0001);
        });
    });
});
