var WebSocketServer = require('ws').Server,
    MyoJS = require('../src/Index.js'),
    assert = require('chai').assert;
var frameDump = '{ "frame" : { "id" : 43928, "timestamp" : 1423842951, "rssi" : 53, "event" : { "type" : "onConnect" }, "rotation" : [ -0.4093628, -0.1088257, 0.1548462, 0.8925171 ], "euler" : { "roll" : 1.34422, "pitch" : -1.428455, "yaw" : 2.271631 }, "pose" : { "type" : 5 }, "gyro" : [ 2.868652, -2.868652, 2.563476 ], "accel" : [ 0.04736328, -0.7241211, 0.6367188 ], "emg" : [ -6, 0, -1, 0, 40, 1, 2, -2 ] }}';
var frameDumpDeviceInfo = '{ "frame" : { "deviceInfo" : { "connected" : true }}}';
describe('BaseConnection', function(){
    describe('Constructor: Test with valid host and port', function(){
        var baseConnection;
        before(function() {
            baseConnection = new MyoJS.BaseConnection();
        });
        after(function(done) {
            baseConnection = null;
            done();
        });
        it('should return a Myo object', function(done){
            assert.equal(baseConnection.host, '127.0.0.1');
            assert.equal(baseConnection.port, 6450);
            done();
        });
    });
    describe('Constructor: Test with empty object', function(){
        var baseConnection;
        after(function(done) {
            baseConnection = null;
            done();
        });
        it('should throw an error when passing an empty object', function(done){
            assert.throws(function() {
                baseConnection = new MyoJS.BaseConnection({});
            }, Error, 'Host needs to be of type string');
            done();
        });
    });
    describe('Constructor: Test with empty host', function(){
        var baseConnection;
        after(function(done) {
            baseConnection = null;
            done();
        });
        it('should throw an error when host is missing', function(done){
            assert.throws(function() {
                baseConnection = new MyoJS.BaseConnection({someProperty:'someString', port:6450});
            }, Error, 'Host needs to be of type string');
            done();
        });
    });
    describe('Constructor: Test with host of wrong type', function(){
        var baseConnection;
        after(function(done) {
            baseConnection = null;
            done();
        });
        it('should throw an error when host is of wrong type', function(done){
            assert.throws(function() {
                baseConnection = new MyoJS.BaseConnection({host: 6450});
            }, Error, 'Host needs to be of type string');
            done();
        });
    });
    describe('Constructor: Test with empty port', function(){
        var baseConnection;
        after(function(done) {
            baseConnection = null;
            done();
        });
        it('should throw an error when port is missing', function(done){
            assert.throws(function() {
                baseConnection = new MyoJS.BaseConnection({host:'someString'});
            }, Error, 'Port needs to be of type integer');
            done();
        });
    });
    describe('Constructor: Test with port of wrong type', function(){
        var baseConnection;
        after(function(done) {
            baseConnection = null;
            done();
        });
        it('should throw an error when port is of wrong type', function(done){
            assert.throws(function() {
                baseConnection = new MyoJS.BaseConnection({host:'someString', port:'someOtherString'});
            }, Error, 'Port needs to be of type integer');
            done();
        });
    });
    describe('Constructor: Test with passing a string as an argument', function(){
        var baseConnection;
        after(function(done) {
            baseConnection = null;
            done();
        });
        it('should throw an error when argument is not an object', function(done){
            assert.throws(function() {
                baseConnection = new MyoJS.BaseConnection('someString');
            }, Error, 'Constructor parameter needs to be an object');
            done();
        });
    });
    describe('#send', function(){
        var baseConnection;
        before(function() {
             baseConnection = new MyoJS.BaseConnection();
        });
        after(function(done) {
            baseConnection = null;
            done();
        });
        it('should throw an error when parameter is invalid', function(done){
            assert.throws(function() {
                baseConnection.send('abc');
            }, Error, 'Parameter needs to be an object');
            done();
        });
    });
    describe('#getUrl', function(){
        var baseConnection;
        before(function() {
            baseConnection = new MyoJS.BaseConnection();
        });
        after(function(done) {
            baseConnection = null;
            done();
        });
        it('should return the correct url', function(done){
            assert.equal(baseConnection.getUrl(), 'ws://127.0.0.1:6450/');
            done();
        });
    });
    describe('#handleOpen', function(){
        var wss;
        var baseConnection;
        before(function() {
            wss = new WebSocketServer({port: 6450});
            baseConnection = new MyoJS.BaseConnection();
        });
        after(function(done) {
            baseConnection = null;
            wss.close();
            wss = null;
            done();
        });
        it('should call context to requestDeviceInfo', function(done){
            var didRequestDeviceInfo = false;
            var errTimeout = setTimeout(function () {
                assert(false, '"requestDeviceInfo" never sent');
                baseConnection = null;
                done();
            }, 1000);
            wss.on('connection', function connection(ws) {
                ws.on('message', function incoming(message) {
                    var data = JSON.parse(message);
                    if(data.hasOwnProperty('command')) {
                        if(data.command === 'requestDeviceInfo') {
                            didRequestDeviceInfo = true;
                            clearTimeout(errTimeout);
                            assert(true, baseConnection.connected);
                            assert(true, didRequestDeviceInfo);
                            done();
                        }
                    }
                });
            });
            baseConnection.connect();
        });
    });
    describe('#handleClose: when connected', function(){
        var wss;
        var baseConnection;
        before(function() {
            wss = new WebSocketServer({port: 6450});
        });
        after(function(done) {
            baseConnection = null;
            wss.close();
            wss = null;
            done();
        });
        it('should return "disconnecting"', function(done){
            var didRequestDeviceInfo = false;
            var errTimeout = setTimeout(function () {
                assert(false, 'failed to connect or receive data');
                baseConnection = null;
                done();
            }, 1000);
            wss.on('connection', function connection(ws) {
                ws.on('message', function incoming(message) {
                    var data = JSON.parse(message);
                    if(data.hasOwnProperty('command')) {
                        if(data.command === 'requestDeviceInfo') {
                            didRequestDeviceInfo = true;
                            ws.send(frameDumpDeviceInfo);
                        }
                    }
                });
            });
            baseConnection = new MyoJS.BaseConnection();
            baseConnection.on('connect', function(data) {
                clearTimeout(errTimeout);
                assert.equal(didRequestDeviceInfo, true);
                assert.equal(baseConnection.connected, true, 'socket connection');
                assert.equal('disconnecting', baseConnection.handleClose());
                done();
            });
            baseConnection.connect();
        });
    });
    describe('#handleClose: return "disconnected" if disconnected', function(){
        var wss;
        var baseConnection;
        before(function() {
            wss = new WebSocketServer({port: 6450});
            baseConnection = new MyoJS.BaseConnection();
        });
        after(function(done) {
            baseConnection = null;
            wss.close();
            wss = null;
            done();
        });
        it('should return "disconnecting" if connected', function(done){
            var didRequestDeviceInfo = false;
            var errTimeout = setTimeout(function () {
                assert(false, 'failed to connect or receive data');
                baseConnection = null;
                done();
            }, 1000);
            wss.on('connection', function connection(ws) {
                ws.on('message', function incoming(message) {
                    var data = JSON.parse(message);
                    if(data.hasOwnProperty('command')) {
                        if(data.command === 'requestDeviceInfo') {
                            didRequestDeviceInfo = true;
                            clearTimeout(errTimeout);
                            assert.equal(baseConnection.handleClose(), 'disconnected');
                            done();
                        }
                    }
                });
            });
            baseConnection.connect();
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
            baseConnection.handleData(frameDumpDeviceInfo);
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
            baseConnection.handleData(frameDumpDeviceInfo);
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
            baseConnection.handleData(frameDump);
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
            baseConnection.handleData(frameDump);
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
            baseConnection.handleData(frameDump);
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
        var wss;
        before(function() {
            wss = new WebSocketServer({port: 6450});
        });
        after(function(done) {
            wss.close();
            wss = null;
            done();
        });
        it('should emit a "connect" event', function(done){
            var didRequestDeviceInfo = false;
            wss.on('connection', function connection(ws) {
                ws.on('message', function incoming(message) {
                    var data = JSON.parse(message);
                    if(data.hasOwnProperty('command')) {
                        if(data.command === 'requestDeviceInfo') {
                            didRequestDeviceInfo = true;
                            ws.send(frameDumpDeviceInfo);
                        }
                    }
                });
            });
            var baseConnection = new MyoJS.BaseConnection();
            var errTimeout = setTimeout(function () {
                assert(false, '"connect" event never fired');
                done();
            }, 1000);
            baseConnection.on('connect', function(data) {
                clearTimeout(errTimeout);
                assert(true, baseConnection.connected);
                assert(true, didRequestDeviceInfo);
                done();
            });
            baseConnection.connect();
        });
    });
    describe('#disconnect (connected)', function(){
        var baseConnection;
        var didCloseSocket;
        before(function() {
            baseConnection = new MyoJS.BaseConnection();
            baseConnection.socket = {};
            baseConnection.socket.close = function() {
                didCloseSocket = true;
            };
        });
        after(function(done) {
            baseConnection = null;
            done();
        });

        it('should emit a "disconnect" event', function(done){
            didCloseSocket = false;
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
            assert.equal(true, didCloseSocket);
        });
    });
    describe('#disconnect (disconnected)', function(){
        var baseConnection;
        var didCloseSocket;
        before(function() {
            baseConnection = new MyoJS.BaseConnection();
            baseConnection.socket = {};
            baseConnection.socket.close = function() {
                didCloseSocket = true;
            };
        });
        after(function(done) {
            baseConnection = null;
            done();
        });

        it('should not emit a "disconnect" event if disconnected', function(done){
            didCloseSocket = false;
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
            assert.equal(true, didCloseSocket);
        });
    });
    describe('#disconnect (stopReconnection)', function(){
        var baseConnection;
        var didCloseSocket;
        before(function() {
            baseConnection = new MyoJS.BaseConnection();
            baseConnection.socket = {};
            baseConnection.socket.close = function() {
                didCloseSocket = true;
            };
        });
        after(function(done) {
            baseConnection = null;
            done();
        });

        it('should call "stopReconnection" if not allowing reconnections', function(done){
            var didStopReconnection = false;
            var baseConnection = new MyoJS.BaseConnection();
            baseConnection.stopReconnection = function() {
                didStopReconnection = true;
            };
            baseConnection.disconnect(false);
            assert.equal(baseConnection.reconnectionTimer, null);
            assert.equal(true, didStopReconnection);
            done();
        });
    });
});
