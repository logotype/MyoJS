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
        it('should return a Pose type POSE_REST', function(){
            var pose = new MyoJS.Pose({type:0});
            assert.equal(pose.type, pose.POSE_REST);
            assert.equal(pose instanceof MyoJS.Pose, true);
        });
        it('should return a Pose type POSE_FIST', function(){
            var pose = new MyoJS.Pose({type:1});
            assert.equal(pose.type, pose.POSE_FIST);
            assert.equal(pose instanceof MyoJS.Pose, true);
        });
        it('should return a Pose type POSE_WAVE_IN', function(){
            var pose = new MyoJS.Pose({type:2});
            assert.equal(pose.type, pose.POSE_WAVE_IN);
            assert.equal(pose instanceof MyoJS.Pose, true);
        });
        it('should return a Pose type POSE_WAVE_OUT', function(){
            var pose = new MyoJS.Pose({type:3});
            assert.equal(pose.type, pose.POSE_WAVE_OUT);
            assert.equal(pose instanceof MyoJS.Pose, true);
        });
        it('should return a Pose type POSE_FINGERS_SPREAD', function(){
            var pose = new MyoJS.Pose({type:4});
            assert.equal(pose.type, pose.POSE_FINGERS_SPREAD);
            assert.equal(pose instanceof MyoJS.Pose, true);
        });
        it('should return a Pose type DOUBLE_TAP', function(){
            var pose = new MyoJS.Pose({type:5});
            assert.equal(pose.type, pose.DOUBLE_TAP);
            assert.equal(pose instanceof MyoJS.Pose, true);
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
    describe('#toString', function(){
        it('should return a String describing Pose type invalid', function(){
            assert.equal(MyoJS.Pose.invalid().toString(), '[Pose invalid]');
        });
        it('should return a String describing Pose type POSE_REST', function(){
            assert.equal(new MyoJS.Pose({type:0}).toString(), '[Pose type:0 POSE_REST]');
        });
        it('should return a String describing Pose type POSE_FIST', function(){
            assert.equal(new MyoJS.Pose({type:1}).toString(), '[Pose type:1 POSE_FIST]');
        });
        it('should return a String describing Pose type POSE_WAVE_IN', function(){
            assert.equal(new MyoJS.Pose({type:2}).toString(), '[Pose type:2 POSE_WAVE_IN]');
        });
        it('should return a String describing Pose type POSE_WAVE_OUT', function(){
            assert.equal(new MyoJS.Pose({type:3}).toString(), '[Pose type:3 POSE_WAVE_OUT]');
        });
        it('should return a String describing Pose type POSE_FINGERS_SPREAD', function(){
            assert.equal(new MyoJS.Pose({type:4}).toString(), '[Pose type:4 POSE_FINGERS_SPREAD]');
        });
        it('should return a String describing Pose type DOUBLE_TAP', function(){
            assert.equal(new MyoJS.Pose({type:5}).toString(), '[Pose type:5 DOUBLE_TAP]');
        });
        it('should return a String describing Pose type unknown', function(){
            assert.equal(new MyoJS.Pose({type:6}).toString(), '[Pose type:6]');
        });
    });
});
