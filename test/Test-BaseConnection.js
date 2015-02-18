var EventEmitter = require('events').EventEmitter,
    MyoJS = require('../src/Index.js'),
    assert = require('chai').assert;

var frameDump = '{ "frame" : { "id" : 43928, "timestamp" : 1423842951, "rssi" : 53, "event" : { "type" : "onConnect" }, "rotation" : [ -0.4093628, -0.1088257, 0.1548462, 0.8925171 ], "euler" : { "roll" : 1.34422, "pitch" : -1.428455, "yaw" : 2.271631 }, "pose" : { "type" : 5 }, "gyro" : [ 2.868652, -2.868652, 2.563476 ], "accel" : [ 0.04736328, -0.7241211, 0.6367188 ], "emg" : [ -6, 0, -1, 0, 40, 1, 2, -2 ] }}';
var frameDumpWithDeviceInfo = '{ "frame" : { "deviceInfo" : { "id" : 1 }, "id" : 43928, "timestamp" : 1423842951, "rssi" : 53, "event" : { "type" : "onConnect" }, "rotation" : [ -0.4093628, -0.1088257, 0.1548462, 0.8925171 ], "euler" : { "roll" : 1.34422, "pitch" : -1.428455, "yaw" : 2.271631 }, "pose" : { "type" : 5 }, "gyro" : [ 2.868652, -2.868652, 2.563476 ], "accel" : [ 0.04736328, -0.7241211, 0.6367188 ], "emg" : [ -6, 0, -1, 0, 40, 1, 2, -2 ] }}';

describe('BaseConnection', function(){
    describe('Constructor validation', function(){
        it('should return a Myo object', function(){
            var baseConnection = new MyoJS.BaseConnection();
            assert.equal(baseConnection.host, '127.0.0.1');
            assert.equal(baseConnection.port, 6450);
        });
        it('should throw an error when passing an empty object', function(){
            assert.throws(function() {
                new MyoJS.BaseConnection({});
            }, Error, 'Host needs to be of type string');
        });
        it('should throw an error when host is missing', function(){
            assert.throws(function() {
                new MyoJS.BaseConnection({someProperty:'someString', port:6450});
            }, Error, 'Host needs to be of type string');
        });
        it('should throw an error when host is of wrong type', function(){
            assert.throws(function() {
                new MyoJS.BaseConnection({host: 6450});
            }, Error, 'Host needs to be of type string');
        });
        it('should throw an error when port is missing', function(){
            assert.throws(function() {
                new MyoJS.BaseConnection({host:'someString'});
            }, Error, 'Port needs to be of type integer');
        });
        it('should throw an error when port is of wrong type', function(){
            assert.throws(function() {
                new MyoJS.BaseConnection({host:'someString', port:'someOtherString'});
            }, Error, 'Port needs to be of type integer');
        });
        it('should throw an error when argument is not an object', function(){
            assert.throws(function() {
                new MyoJS.BaseConnection('someString');
            }, Error, 'Constructor parameter needs to be an object');
        });
    });
    describe('#send', function(){
        it('should throw an error when parameter is invalid', function(){
            assert.throws(function() {
                var baseConnection = new MyoJS.BaseConnection();
                baseConnection.send('abc');
            }, Error, 'Parameter needs to be an object');
        });
    });
    describe('#getUrl', function(){
        it('should return the correct url', function(){
            var baseConnection = new MyoJS.BaseConnection();
            assert.equal(baseConnection.getUrl(), 'ws://127.0.0.1:6450/');
        });
    });
    describe('#handleOpen', function(){
        it('should call context to requestDeviceInfo', function(){
            var output = '';
            var baseConnection = new MyoJS.BaseConnection();
            MyoJS.BaseConnection.prototype.send = function(message) { output = JSON.stringify(message) };
            assert.equal(baseConnection.handleOpen(), 'connecting');
            assert.equal(output, '{"command":"requestDeviceInfo"}');
        });
        it('should not call context when connected', function(){
            var output = '';
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.connected = true;
            MyoJS.BaseConnection.prototype.send = function(message) { output = JSON.stringify(message) };
            assert.equal(baseConnection.handleOpen(), 'connected');
            assert.notEqual(output, '{"command":"requestDeviceInfo"}');
        });
    });
    describe('#handleClose', function(){
        it('should return "disconnecting" if connected', function(){
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.connected = true;
            assert.equal(baseConnection.handleClose(), 'disconnecting');
        });
        it('should return "disconnecting" if connected', function(){
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.connected = false;
            assert.equal(baseConnection.handleClose(), 'disconnected');
        });
    });
    describe('#handleData', function(){
        it('should throw an error when no data is sent', function(){
            assert.throws(function() {
                var baseConnection = new MyoJS.BaseConnection();
                baseConnection.handleData();
            }, Error, 'No data received');
        });
        it('should throw an error when JSON string is invalid', function(){
            assert.throws(function() {
                var baseConnection = new MyoJS.BaseConnection();
                baseConnection.handleData('abc');
            }, Error, 'Invalid JSON');
        });
        it('should emit a deviceInfo event', function(done){
            var baseConnection = new MyoJS.BaseConnection();

            var errTimeout = setTimeout(function () {
                assert(false, 'Event never fired');
                done();
            }, 10);

            baseConnection.on('deviceInfo', function(data) {
                clearTimeout(errTimeout);
                assert(true);
                done();
            });

            baseConnection.handleData(frameDumpWithDeviceInfo);
        });
        it('should emit a "connect" event', function(done){
            var baseConnection = new MyoJS.BaseConnection();

            var errTimeout = setTimeout(function () {
                assert(false, '"connect" event never fired');
                done();
            }, 10);

            baseConnection.on('connect', function(data) {
                clearTimeout(errTimeout);
                assert(true);
                done();
            });

            baseConnection.handleData(frameDumpWithDeviceInfo);
        });
        it('should emit a "frame" event', function(done){
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.connected = true;

            var errTimeout = setTimeout(function () {
                assert(false, '"frame" event never fired');
                done();
            }, 10);

            baseConnection.on('frame', function(data) {
                clearTimeout(errTimeout);
                assert(true);
                done();
            });

            baseConnection.handleData(frameDumpWithDeviceInfo);
        });
        it('should emit a "pose" event', function(done){
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.connected = true;

            var errTimeout = setTimeout(function () {
                assert(false, '"pose" event never fired');
                done();
            }, 10);

            baseConnection.on('pose', function(data) {
                clearTimeout(errTimeout);
                assert(true);
                done();
            });

            baseConnection.handleData(frameDumpWithDeviceInfo);
        });
        it('should emit a "event" event', function(done){
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.connected = true;

            var errTimeout = setTimeout(function () {
                assert(false, '"event" event never fired');
                done();
            }, 10);

            baseConnection.on('event', function(data) {
                clearTimeout(errTimeout);
                assert(true);
                done();
            });

            baseConnection.handleData(frameDumpWithDeviceInfo);
        });
    });
    describe('#startReconnection', function(){
        it('should return "reconnecting" if no reconnectionTimer', function(){
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.reconnectionTimer = null;
            assert.equal(baseConnection.startReconnection(), 'reconnecting');
        });
        it('should return "already reconnecting" if having reconnectionTimer', function(){
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.reconnectionTimer = 1234;
            assert.equal(baseConnection.startReconnection(), 'already reconnecting');
        });
    });
    describe('#stopReconnection', function(){
        it('should clear reconnection timer', function(){
            var output = '';
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.reconnectionTimer = setInterval(function() {}, 1000);
            baseConnection.stopReconnection();
            assert.equal(baseConnection.reconnectionTimer, null);
        });
    });
    describe('#connect', function(){
        it('should emit a "ready" event', function(done){
            var baseConnection = new MyoJS.BaseConnection();

            var errTimeout = setTimeout(function () {
                assert(false, '"ready" event never fired');
                done();
            }, 10);

            baseConnection.on('ready', function(data) {
                clearTimeout(errTimeout);
                assert(true);
                done();
            });

            baseConnection.connect();
        });
    });
    describe('#reconnect', function(){
        it('should call "stopReconnection" if connected', function(){
            var didStopReconnection = false;
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.stopReconnection = function() {
                didStopReconnection = true;
            };
            baseConnection.connected = true;

            baseConnection.reconnect();
            assert.equal(didStopReconnection, true);
        });
        it('should call "disconnect(true)" and "connect" if disconnected', function(){
            var didDisconnect = false;
            var didConnect = false;
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.disconnect = function() {
                didDisconnect = true;
            };
            baseConnection.connect = function() {
                didConnect = true;
            };
            baseConnection.connected = false;

            baseConnection.reconnect();
            assert.equal(didDisconnect, true);
            assert.equal(didConnect, true);
        });
    });
    describe('#disconnect', function(){
        it('should emit a "disconnect" event if connected', function(done){
            var didCloseSocket = false;
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.socket = {};
            baseConnection.socket.close = function() {
                didCloseSocket = true;
            };
            baseConnection.connected = true;

            var errTimeout = setTimeout(function () {
                assert(false, '"disconnect" event never fired');
                done();
            }, 10);

            baseConnection.on('disconnect', function(data) {
                clearTimeout(errTimeout);
                assert(true);
                done();
            });

            baseConnection.disconnect();
            assert.equal(didCloseSocket, true);
        });
        it('should not emit a "disconnect" event if disconnected', function(done){
            var didCloseSocket = false;
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.socket = {};
            baseConnection.socket.close = function() {
                didCloseSocket = true;
            };

            var errTimeout = setTimeout(function () {
                assert(true, '"disconnect" event never fired');
                done();
            }, 10);

            baseConnection.on('disconnect', function(data) {
                clearTimeout(errTimeout);
                assert(false);
                done();
            });

            baseConnection.disconnect();
            assert.equal(didCloseSocket, true);
        });
        it('should call "stopReconnection" if not allowing reconnections', function(){
            var didStopReconnection = false;
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.stopReconnection = function() {
                didStopReconnection = true;
            };
            baseConnection.disconnect(false);
            assert.equal(baseConnection.reconnectionTimer, null);
            assert.equal(didStopReconnection, true);
        });
    });
});
