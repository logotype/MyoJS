import {assert} from 'chai';
import {Frame} from './../src/Frame.js';
import {Pose} from './../src/Pose.js';
import {Vector3} from './../src/Vector3.js';
import {Quaternion} from './../src/Quaternion.js';

let frameDump = '{ "frame" : { "id" : 43928, "timestamp" : "1423842951", "rssi" : 53, "event" : { "type" : "onConnect" }, "rotation" : [ -0.4093628, -0.1088257, 0.1548462, 0.8925171 ], "euler" : { "roll" : 1.34422, "pitch" : -1.428455, "yaw" : 2.271631 }, "pose" : { "type" : 5 }, "gyro" : [ 2.868652, -2.868652, 2.563476 ], "accel" : [ 0.04736328, -0.7241211, 0.6367188 ], "emg" : [ -6, 0, -1, 0, 40, 1, 2, -2 ] }}';

describe('Frame', () => {
    describe('Constructor validation', () => {
        it('should throw an error when having no arguments', () => {
            assert.throws(() => {
                new Frame();
            }, Error, 'Missing constructor arguments');
        });
        it('should throw an error when having no frame id', () => {
            assert.throws(() => {
                let invalidFrame = JSON.parse(frameDump);
                delete invalidFrame.frame.id;
                new Frame(invalidFrame.frame);
            }, Error, 'Frame id needs to be of type integer');
        });
        it('should throw an error when having no frame timestamp', () => {
            assert.throws(() => {
                let invalidFrame = JSON.parse(frameDump);
                delete invalidFrame.frame.timestamp;
                new Frame(invalidFrame.frame);
            }, Error, 'Timestamp needs to be of type string');
        });
        it('should throw an error when passing string as argument', () => {
            assert.throws(() => {
                new Frame('frame');
            }, Error, 'Constructor parameter needs to be an object');
        });
    });
    describe('End to End', () => {
        let frame = new Frame(JSON.parse(frameDump).frame);
        it('should make a instance of Frame', () => { assert.strictEqual(frame instanceof Frame, true) });
        it('should have id', () => { assert.strictEqual(frame.id, 43928, 'id found') });
        it('should have timestamp', () => { assert.strictEqual(frame.timestamp, '1423842951', 'timestamp found') });
        it('should have rssi', () => { assert.strictEqual(frame.rssi, 53, 'rssi found') });
        it('should make a valid frame type', () => { assert.strictEqual(frame.type, 'frame', 'frame type is matching') });
        it('should make a onConnect event', () => { assert.strictEqual(frame.event.type, 'onConnect', 'event type is matching') });
        describe('frame.euler', () => {
            it('should have euler roll', () => { assert.strictEqual(frame.euler.roll, 1.34422, 'roll is matching') });
            it('should have euler pitch', () => { assert.strictEqual(frame.euler.pitch, -1.428455, 'pitch is matching') });
            it('should have euler yaw', () => { assert.strictEqual(frame.euler.yaw, 2.271631, 'yaw is matching') });
        });
        describe('frame.accel (Vector3)', () => {
            it('should make a instance of Vector3', () => { assert.strictEqual(frame.accel instanceof Vector3, true) });
            it('should make a valid Vector3', () => { assert.strictEqual(frame.accel.valid, true) });
            it('should have x', () => { assert.strictEqual(frame.accel.x, 0.04736328, 'x is matching') });
            it('should have y', () => { assert.strictEqual(frame.accel.y, -0.7241211, 'y is matching') });
            it('should have z', () => { assert.strictEqual(frame.accel.z, 0.6367188, 'z is matching') });
        });
        describe('frame.gyro (Vector3)', () => {
            it('should make a instance of Vector3', () => { assert.strictEqual(frame.gyro instanceof Vector3, true) });
            it('should make a valid Vector3', () => { assert.strictEqual(frame.gyro.valid, true) });
            it('should have x', () => { assert.strictEqual(frame.gyro.x, 2.868652, 'x is matching') });
            it('should have y', () => { assert.strictEqual(frame.gyro.y, -2.868652, 'y is matching') });
            it('should have z', () => { assert.strictEqual(frame.gyro.z, 2.563476, 'z is matching') });
        });
        describe('frame.emg', () => {
            it('should have matching EMG sensor 1 data', () => { assert.strictEqual(frame.emg[0], -6) });
            it('should have matching EMG sensor 2 data', () => { assert.strictEqual(frame.emg[1], 0) });
            it('should have matching EMG sensor 3 data', () => { assert.strictEqual(frame.emg[2], -1) });
            it('should have matching EMG sensor 4 data', () => { assert.strictEqual(frame.emg[3], 0) });
            it('should have matching EMG sensor 5 data', () => { assert.strictEqual(frame.emg[4], 40) });
            it('should have matching EMG sensor 6 data', () => { assert.strictEqual(frame.emg[5], 1) });
            it('should have matching EMG sensor 7 data', () => { assert.strictEqual(frame.emg[6], 2) });
            it('should have matching EMG sensor 8 data', () => { assert.strictEqual(frame.emg[7], -2) });
        });
        describe('frame.rotation (Quaternion)', () => {
            it('should make a instance of Quaternion', () => { assert.strictEqual(frame.rotation instanceof Quaternion, true) });
            it('should make a valid Quaternion', () => { assert.strictEqual(frame.rotation.valid, true) });
            it('should have x', () => { assert.strictEqual(frame.rotation.x, -0.4093628, 'x is matching') });
            it('should have y', () => { assert.strictEqual(frame.rotation.y, -0.1088257, 'y is matching') });
            it('should have z', () => { assert.strictEqual(frame.rotation.z, 0.1548462, 'z is matching') });
            it('should have w', () => { assert.strictEqual(frame.rotation.w, 0.8925171, 'w is matching') });
        });
        describe('vector comparison', () => {
            it('gyro should be equal to gyro', () => { assert.strictEqual(frame.gyro.isEqualTo(frame.gyro), true) });
            it('gyro should not be equal to accel', () => { assert.strictEqual(frame.gyro.isEqualTo(frame.accel), false) });
        });
        it('should make a pose of type POSE_DOUBLE_TAP', () => {
            assert.strictEqual(frame.pose.type, Pose.POSE_DOUBLE_TAP, 'Pose is POSE.POSE_DOUBLE_TAP');
        });
        it('should make a instance of Pose', () => { assert.strictEqual(frame.pose instanceof Pose, true) });
        describe('#toString', () => {
            it('should return a String describing Frame properties', () => {
                assert.strictEqual(frame.toString(), '[Frame id:43928 timestamp:1423842951 accel:[Vector3 x:0.04736328 y:-0.7241211 z:0.6367188]]');
            });
        });
    });
    describe('Frame variations', () => {
        describe('Missing Pose', () => {
            let frameData = JSON.parse(frameDump).frame;
            delete frameData.pose;
            let frame = new Frame(frameData);
            it('should make a instance of Frame', () => { assert.strictEqual(frame instanceof Frame, true) });
            it('should make a invalid Pose', () => { assert.strictEqual(frame.pose.valid, false) });
        });
        describe('Missing Quaternion', () => {
            let frameData = JSON.parse(frameDump).frame;
            delete frameData.rotation;
            let frame = new Frame(frameData);
            it('should make a instance of Frame', () => { assert.strictEqual(frame instanceof Frame, true) });
            it('should make a invalid Quaternion', () => { assert.strictEqual(frame.rotation.valid, false) });
        });
        describe('Missing Accelerometer', () => {
            let frameData = JSON.parse(frameDump).frame;
            delete frameData.accel;
            let frame = new Frame(frameData);
            it('should make a instance of Frame', () => { assert.strictEqual(frame instanceof Frame, true) });
            it('should make a invalid Vector3', () => { assert.strictEqual(frame.accel.valid, false) });
        });
        describe('Missing Gyroscope', () => {
            let frameData = JSON.parse(frameDump).frame;
            delete frameData.gyro;
            let frame = new Frame(frameData);
            it('should make a instance of Frame', () => { assert.strictEqual(frame instanceof Frame, true) });
            it('should make a invalid Vector3', () => { assert.strictEqual(frame.gyro.valid, false) });
        });
        describe('Missing EMG sensor data', () => {
            let frameData = JSON.parse(frameDump).frame;
            delete frameData.emg;
            let frame = new Frame(frameData);
            it('should make a instance of Frame', () => { assert.strictEqual(frame instanceof Frame, true) });
            it('should make a empty array', () => { assert.strictEqual(frame.emg.length, 0) });
        });
    });
});
