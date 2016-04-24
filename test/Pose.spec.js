import {assert} from 'chai';
import Pose from './../src/Pose.js';

describe('Pose', () => {
    describe('Constructor validation', () => {
        it('should return a Pose object', () => {
            const pose = new Pose({type:3});
            assert.strictEqual(pose.type, 3);
            assert.strictEqual(pose.type, Pose.POSE_WAVE_OUT);
            assert.strictEqual(pose instanceof Pose, true);
        });
        it('should throw an error when passing an empty object', () => {
            assert.throws(() => {
                new Pose({});
            }, Error, 'Pose type needs to be of type integer');
        });
        it('should throw an error when passing string as type', () => {
            assert.throws(() => {
                new Pose({type:'a'});
            }, Error, 'Pose type needs to be of type integer');
        });
        it('should throw an error when passing array', () => {
            assert.throws(() => {
                new Pose(['a', 'b', 'c']);
            }, Error, 'Constructor parameter needs to be an object');
        });
        it('should return a Pose type POSE_REST', () => {
            const pose = new Pose({type:0});
            assert.strictEqual(pose.type, Pose.POSE_REST);
            assert.strictEqual(pose instanceof Pose, true);
        });
        it('should return a Pose type POSE_FIST', () => {
            const pose = new Pose({type:1});
            assert.strictEqual(pose.type, Pose.POSE_FIST);
            assert.strictEqual(pose instanceof Pose, true);
        });
        it('should return a Pose type POSE_WAVE_IN', () => {
            const pose = new Pose({type:2});
            assert.strictEqual(pose.type, Pose.POSE_WAVE_IN);
            assert.strictEqual(pose instanceof Pose, true);
        });
        it('should return a Pose type POSE_WAVE_OUT', () => {
            const pose = new Pose({type:3});
            assert.strictEqual(pose.type, Pose.POSE_WAVE_OUT);
            assert.strictEqual(pose instanceof Pose, true);
        });
        it('should return a Pose type POSE_FINGERS_SPREAD', () => {
            const pose = new Pose({type:4});
            assert.strictEqual(pose.type, Pose.POSE_FINGERS_SPREAD);
            assert.strictEqual(pose instanceof Pose, true);
        });
        it('should return a Pose type DOUBLE_TAP', () => {
            const pose = new Pose({type:5});
            assert.strictEqual(pose.type, Pose.POSE_DOUBLE_TAP);
            assert.strictEqual(pose instanceof Pose, true);
        });
    });
    describe('#isEqual', () => {
        it('should be equal', () => {
            assert.strictEqual(new Pose({type:2}).isEqualTo(new Pose({type:2})), true);
        });
        it('should not be equal', () => {
            assert.strictEqual(new Pose({type:2}).isEqualTo(new Pose({type:3})), false);
        });
    });
    describe('#toString', () => {
        it('should return a String describing Pose type invalid', () => {
            assert.strictEqual(Pose.invalid().toString(), '[Pose invalid]');
        });
        it('should return a String describing Pose type POSE_REST', () => {
            assert.strictEqual(new Pose({type:0}).toString(), '[Pose type:0 POSE_REST]');
        });
        it('should return a String describing Pose type POSE_FIST', () => {
            assert.strictEqual(new Pose({type:1}).toString(), '[Pose type:1 POSE_FIST]');
        });
        it('should return a String describing Pose type POSE_WAVE_IN', () => {
            assert.strictEqual(new Pose({type:2}).toString(), '[Pose type:2 POSE_WAVE_IN]');
        });
        it('should return a String describing Pose type POSE_WAVE_OUT', () => {
            assert.strictEqual(new Pose({type:3}).toString(), '[Pose type:3 POSE_WAVE_OUT]');
        });
        it('should return a String describing Pose type POSE_FINGERS_SPREAD', () => {
            assert.strictEqual(new Pose({type:4}).toString(), '[Pose type:4 POSE_FINGERS_SPREAD]');
        });
        it('should return a String describing Pose type POSE_DOUBLE_TAP', () => {
            assert.strictEqual(new Pose({type:5}).toString(), '[Pose type:5 POSE_DOUBLE_TAP]');
        });
        it('should return a String describing Pose type unknown', () => {
            assert.strictEqual(new Pose({type:6}).toString(), '[Pose type:6]');
        });
    });
});
