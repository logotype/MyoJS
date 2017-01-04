import {assert} from 'chai';
import {EventEmitter} from 'events';
import Hub from './../src/Hub.js';
import Frame from './../src/Frame.js';

describe('Hub', () => {
    describe('Constructor validation', () => {
        it('should return a Hub object with host 0.0.0.0', () => {
            const hub = new Hub({host: '0.0.0.0', port: 0});
            assert.strictEqual(hub.connection.host, '0.0.0.0');
            assert.strictEqual(hub.connection.port, 0);
            assert.strictEqual(hub instanceof Hub, true);
        });
        it('should return a Hub object with default host', () => {
            const hub = new Hub();
            assert.strictEqual(hub.connection.host, '127.0.0.1');
            assert.strictEqual(hub.connection.port, 6450);
            assert.strictEqual(hub instanceof Hub, true);
        });
        it('should throw an error when host is of wrong type', () => {
            assert.throws(() =>  {
                new Hub({host: 6450});
            }, Error, 'Host needs to be of type string');
        });
        it('should throw an error when port is of wrong type', () => {
            assert.throws(() =>  {
                new Hub({host:'someString', port:'someOtherString'});
            }, Error, 'Port needs to be of type integer');
        });
    });
    describe('#addListener', () => {
        it('should add a listener', () => {
            const hub = new Hub();
            const frameListener = () => {};
            hub.addListener('frame', frameListener);
            assert.strictEqual(EventEmitter.listenerCount(hub, 'frame'), 1);
        });
        it('should add 5 listeners', () => {
            const hub = new Hub();
            const frameListener1 = () => {};
            const frameListener2 = () => {};
            const frameListener3 = () => {};
            const frameListener4 = () => {};
            const frameListener5 = () => {};
            hub.addListener('frame', frameListener1);
            hub.addListener('frame', frameListener2);
            hub.addListener('frame', frameListener3);
            hub.addListener('frame', frameListener4);
            hub.addListener('frame', frameListener5);
            assert.strictEqual(EventEmitter.listenerCount(hub, 'frame'), 5);
        });
        it('should throw an error when not passing a function', () => {
            assert.throws(() =>  {
                const hub = new Hub();
                hub.addListener('frame', {});
            }, Error, 'argument must be a function');
        });
    });
    describe('#removeListener', () => {
        it('should remove a listener', () => {
            const hub = new Hub();
            const frameListener = () => {};
            hub.addListener('frame', frameListener);
            assert.strictEqual(EventEmitter.listenerCount(hub, 'frame'), 1);
            hub.removeListener('frame', frameListener);
            assert.strictEqual(EventEmitter.listenerCount(hub, 'frame'), 0);
        });
        it('should remove 5 listeners', () => {
            const hub = new Hub();
            const frameListener1 = () => {};
            const frameListener2 = () => {};
            const frameListener3 = () => {};
            const frameListener4 = () => {};
            const frameListener5 = () => {};
            hub.addListener('frame', frameListener1);
            hub.addListener('frame', frameListener2);
            hub.addListener('frame', frameListener3);
            hub.addListener('frame', frameListener4);
            hub.addListener('frame', frameListener5);
            assert.strictEqual(EventEmitter.listenerCount(hub, 'frame'), 5);
            hub.removeListener('frame', frameListener1);
            hub.removeListener('frame', frameListener2);
            hub.removeListener('frame', frameListener3);
            hub.removeListener('frame', frameListener4);
            hub.removeListener('frame', frameListener5);
            assert.strictEqual(EventEmitter.listenerCount(hub, 'frame'), 0);
        });
        it('should throw an error when not passing a function', () => {
            assert.throws(() =>  {
                const hub = new Hub();
                hub.removeListener('frame', {});
            }, Error, 'argument must be a function');
        });
    });
    describe('#frame', () => {
        const frameDump = '{ "frame" : { "id" : 43928, "timestamp" : "1423842951", "rssi" : 53, "event" : { "type" : "onConnect" }, "rotation" : [ -0.4093628, -0.1088257, 0.1548462, 0.8925171 ], "euler" : { "roll" : 1.34422, "pitch" : -1.428455, "yaw" : 2.271631 }, "pose" : { "type" : 5 }, "gyro" : [ 2.868652, -2.868652, 2.563476 ], "accel" : [ 0.04736328, -0.7241211, 0.6367188 ], "emg" : [ -6, 0, -1, 0, 40, 1, 2, -2 ] }}';
        it('should return a frame', () => {
            const hub = new Hub();
            const frame = new Frame(JSON.parse(frameDump).frame);
            hub.history.push(frame);
            assert.strictEqual(hub.frame(0), frame);
        });
        it('should return a frame at correct index', () => {
            const hub = new Hub();
            const frame = new Frame(JSON.parse(frameDump).frame);
            hub.history.push(frame);
            hub.history.push(frame);
            hub.history.push(frame);
            assert.strictEqual(hub.frame(2), frame);
        });
        it('should not return a frame when overflowing index', () => {
            const hub = new Hub();
            const frame = new Frame(JSON.parse(frameDump).frame);
            hub.history.push(frame);
            assert.notEqual(hub.frame(10), frame);
        });
    });
    describe('#waitForMyo', () => {
        it('should call context', () => {
            let output = '';
            const context = {};
            context.send = (message) => { output = JSON.stringify(message); };
            const hub = new Hub();
            hub.connection = context;
            hub.waitForMyo(100);
            assert.strictEqual(output, '{"waitForMyo":100}');
        });
        it('should throw an error when parameter is not integer', () => {
            assert.throws(() =>  {
                const context = {};
                context.send = () =>  {};
                const hub = new Hub();
                hub.connection = context;
                hub.waitForMyo('someString');
            }, Error, 'timeoutMilliseconds needs to be of type integer');
        });
    });
    describe('#run', () => {
        it('should call context', () => {
            let output = '';
            const context = {};
            context.send = (message) => { output = JSON.stringify(message); };
            const hub = new Hub();
            hub.connection = context;
            hub.run(100);
            assert.strictEqual(output, '{"run":100}');
        });
        it('should throw an error when parameter is not integer', () => {
            assert.throws(() =>  {
                const context = {};
                context.send = () =>  {};
                const hub = new Hub();
                hub.connection = context;
                hub.run('someString');
            }, Error, 'durationMilliseconds needs to be of type integer');
        });
    });
    describe('#runOnce', () => {
        it('should call context', () => {
            let output = '';
            const context = {};
            context.send = (message) => { output = JSON.stringify(message); };
            const hub = new Hub();
            hub.connection = context;
            hub.runOnce(100);
            assert.strictEqual(output, '{"runOnce":100}');
        });
        it('should throw an error when parameter is not integer', () => {
            assert.throws(() =>  {
                const context = {};
                context.send = () =>  {};
                const hub = new Hub();
                hub.connection = context;
                hub.runOnce('someString');
            }, Error, 'durationMilliseconds needs to be of type integer');
        });
    });
});
