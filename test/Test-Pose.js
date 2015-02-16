var MyoJS = require('../src/Index.js'),
    assert = require('chai').assert;

describe('Pose', function(){
    describe('Constructor validation', function(){
        it('should return a Pose object', function(){
            var pose = new MyoJS.Pose({type:3});
            assert.equal(pose.type, 3);
            assert.equal(pose.type, pose.POSE_WAVE_OUT);
            assert.equal(pose instanceof MyoJS.Pose, true);
        });
        it('should throw an error when passing an empty object', function(){
            assert.throws(function() {
                new MyoJS.Pose({});
            }, Error, 'Pose type needs to be of type integer');
        });
        it('should throw an error when passing string as type', function(){
            assert.throws(function() {
                new MyoJS.Pose({type:'a'});
            }, Error, 'Pose type needs to be of type integer');
        });
        it('should throw an error when passing array', function(){
            assert.throws(function() {
                new MyoJS.Pose(['a', 'b', 'c']);
            }, Error, 'Constructor parameter needs to be an object');
        });
    });
    describe('#isEqual', function(){
        it('should be equal', function(){
            assert.equal(new MyoJS.Pose({type:2}).isEqualTo(new MyoJS.Pose({type:2})), true);
        });
        it('should not be equal', function(){
            assert.equal(new MyoJS.Pose({type:2}).isEqualTo(new MyoJS.Pose({type:3})), false);
        });
    });
});
