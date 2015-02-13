var Quaternion = require('../src/Quaternion'),
    assert = require('chai').assert;

describe('Quaternion', function(){
    describe('#normalized', function(){
        it('should return a Quaternion object with a length of one, pointing in the same direction as this Quaternion object', function(){
            var quaternion = new Quaternion([21, 35, 78, 32]).normalized();
            assert.closeTo(quaternion.x, 0.2241921902, 0.0001);
            assert.closeTo(quaternion.y, 0.3736536503, 0.0001);
            assert.closeTo(quaternion.z, 0.8327138492, 0.0001);
            assert.closeTo(quaternion.w, 0.3416261946, 0.0001);
        });
    });
    describe('#conjugate', function(){
        it('should return a Quaternion object with all components negated, except w', function(){
            var quaternion = new Quaternion([21, 35, 78, 32]).conjugate();
            assert.closeTo(quaternion.x, -21, 0.0001);
            assert.closeTo(quaternion.y, -35, 0.0001);
            assert.closeTo(quaternion.z, -78, 0.0001);
            assert.closeTo(quaternion.w, 32, 0.0001);
        });
    });
});
