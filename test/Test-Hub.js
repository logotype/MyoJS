var EventEmitter = require('events').EventEmitter,
    MyoJS = require('../src/Index.js'),
    assert = require('chai').assert;

describe('Hub', function(){
    describe('Constructor validation', function(){
        it('should return a Hub object with host 0.0.0.0', function(){
            var hub = new MyoJS.Hub({host: '0.0.0.0', port: 0});
            assert.equal(hub.connection.host, '0.0.0.0');
            assert.equal(hub.connection.port, 0);
            assert.equal(hub instanceof MyoJS.Hub, true);
        });
        it('should return a Hub object with default host', function(){
            var hub = new MyoJS.Hub();
            assert.equal(hub.connection.host, '127.0.0.1');
            assert.equal(hub.connection.port, 6450);
            assert.equal(hub instanceof MyoJS.Hub, true);
        });
        it('should throw an error when passing an empty object', function(){
            assert.throws(function() {
                new MyoJS.Hub({});
            }, Error, 'Host needs to be of type string');
        });
        it('should throw an error when host is missing', function(){
            assert.throws(function() {
                new MyoJS.Hub({someProperty:'someString', port:6450});
            }, Error, 'Host needs to be of type string');
        });
        it('should throw an error when host is of wrong type', function(){
            assert.throws(function() {
                new MyoJS.Hub({host: 6450});
            }, Error, 'Host needs to be of type string');
        });
        it('should throw an error when port is missing', function(){
            assert.throws(function() {
                new MyoJS.Hub({host:'someString'});
            }, Error, 'Port needs to be of type integer');
        });
        it('should throw an error when port is of wrong type', function(){
            assert.throws(function() {
                new MyoJS.Hub({host:'someString', port:'someOtherString'});
            }, Error, 'Port needs to be of type integer');
        });
        it('should throw an error when argument is not an object', function(){
            assert.throws(function() {
                new MyoJS.Hub('someString');
            }, Error, 'Constructor parameter needs to be an object');
        });
    });
    describe('#addListener', function(){
        it('should add a listener', function(){
            var hub = new MyoJS.Hub();
            var frameListener = function(event) {};
            hub.addListener('frame', frameListener);
            assert.equal(EventEmitter.listenerCount(hub, 'frame'), 1);
        });
        it('should add 5 listeners', function(){
            var hub = new MyoJS.Hub();
            var frameListener1 = function(event) {};
            var frameListener2 = function(event) {};
            var frameListener3 = function(event) {};
            var frameListener4 = function(event) {};
            var frameListener5 = function(event) {};
            hub.addListener('frame', frameListener1);
            hub.addListener('frame', frameListener2);
            hub.addListener('frame', frameListener3);
            hub.addListener('frame', frameListener4);
            hub.addListener('frame', frameListener5);
            assert.equal(EventEmitter.listenerCount(hub, 'frame'), 5);
        });
        it('should throw an error when not passing a function', function(){
            assert.throws(function() {
                var hub = new MyoJS.Hub();
                hub.addListener('frame', {});
            }, Error, 'listener must be a function');
        });
    });
    describe('#removeListener', function(){
        it('should remove a listener', function(){
            var hub = new MyoJS.Hub();
            var frameListener = function(event) {};
            hub.addListener('frame', frameListener);
            assert.equal(EventEmitter.listenerCount(hub, 'frame'), 1);
            hub.removeListener('frame', frameListener);
            assert.equal(EventEmitter.listenerCount(hub, 'frame'), 0);
        });
        it('should remove 5 listeners', function(){
            var hub = new MyoJS.Hub();
            var frameListener1 = function(event) {};
            var frameListener2 = function(event) {};
            var frameListener3 = function(event) {};
            var frameListener4 = function(event) {};
            var frameListener5 = function(event) {};
            hub.addListener('frame', frameListener1);
            hub.addListener('frame', frameListener2);
            hub.addListener('frame', frameListener3);
            hub.addListener('frame', frameListener4);
            hub.addListener('frame', frameListener5);
            assert.equal(EventEmitter.listenerCount(hub, 'frame'), 5);
            hub.removeListener('frame', frameListener1);
            hub.removeListener('frame', frameListener2);
            hub.removeListener('frame', frameListener3);
            hub.removeListener('frame', frameListener4);
            hub.removeListener('frame', frameListener5);
            assert.equal(EventEmitter.listenerCount(hub, 'frame'), 0);
        });
        it('should throw an error when not passing a function', function(){
            assert.throws(function() {
                var hub = new MyoJS.Hub();
                hub.removeListener('frame', {});
            }, Error, 'listener must be a function');
        });
    });
    describe('#frame', function(){
        var frameDump = '{ "frame" : { "id" : 43928, "timestamp" : "1423842951", "rssi" : 53, "event" : { "type" : "onConnect" }, "rotation" : [ -0.4093628, -0.1088257, 0.1548462, 0.8925171 ], "euler" : { "roll" : 1.34422, "pitch" : -1.428455, "yaw" : 2.271631 }, "pose" : { "type" : 5 }, "gyro" : [ 2.868652, -2.868652, 2.563476 ], "accel" : [ 0.04736328, -0.7241211, 0.6367188 ], "emg" : [ -6, 0, -1, 0, 40, 1, 2, -2 ] }}';
        it('should return a frame', function(){
            var hub = new MyoJS.Hub();
            var frame = new MyoJS.Frame(JSON.parse(frameDump).frame);
            hub.history.push(frame);
            assert.equal(hub.frame(0), frame);
        });
        it('should return a frame at correct index', function(){
            var hub = new MyoJS.Hub();
            var frame = new MyoJS.Frame(JSON.parse(frameDump).frame);
            hub.history.push(frame);
            hub.history.push(frame);
            hub.history.push(frame);
            assert.equal(hub.frame(2), frame);
        });
        it('should not return a frame when overflowing index', function(){
            var hub = new MyoJS.Hub();
            var frame = new MyoJS.Frame(JSON.parse(frameDump).frame);
            hub.history.push(frame);
            assert.notEqual(hub.frame(10), frame);
        });
    });
    describe('#waitForMyo', function(){
        it('should call context', function(){
            var output = '';
            var context = {};
            context.send = function(message) { output = JSON.stringify(message) };
            var hub = new MyoJS.Hub();
            hub.connection = context;
            hub.waitForMyo(100);
            assert.equal(output, '{"waitForMyo":100}');
        });
        it('should throw an error when parameter is not integer', function(){
            assert.throws(function() {
                var context = {};
                context.send = function() {};
                var hub = new MyoJS.Hub();
                hub.connection = context;
                hub.waitForMyo('someString');
            }, Error, 'timeoutMilliseconds needs to be of type integer');
        });
    });
    describe('#run', function(){
        it('should call context', function(){
            var output = '';
            var context = {};
            context.send = function(message) { output = JSON.stringify(message) };
            var hub = new MyoJS.Hub();
            hub.connection = context;
            hub.run(100);
            assert.equal(output, '{"run":100}');
        });
        it('should throw an error when parameter is not integer', function(){
            assert.throws(function() {
                var context = {};
                context.send = function() {};
                var hub = new MyoJS.Hub();
                hub.connection = context;
                hub.run('someString');
            }, Error, 'durationMilliseconds needs to be of type integer');
        });
    });
    describe('#runOnce', function(){
        it('should call context', function(){
            var output = '';
            var context = {};
            context.send = function(message) { output = JSON.stringify(message) };
            var hub = new MyoJS.Hub();
            hub.connection = context;
            hub.runOnce(100);
            assert.equal(output, '{"runOnce":100}');
        });
        it('should throw an error when parameter is not integer', function(){
            assert.throws(function() {
                var context = {};
                context.send = function() {};
                var hub = new MyoJS.Hub();
                hub.connection = context;
                hub.runOnce('someString');
            }, Error, 'durationMilliseconds needs to be of type integer');
        });
    });
});
