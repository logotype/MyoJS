import {Server as WebSocketServer} from 'ws';
import {BaseConnection} from './../src/connection/BaseConnection.js';
import {assert} from 'chai';

let frameDump = '{ "frame" : { "id" : 43928, "timestamp" : "1423842951", "rssi" : 53, "event" : { "type" : "onConnect" }, "rotation" : [ -0.4093628, -0.1088257, 0.1548462, 0.8925171 ], "euler" : { "roll" : 1.34422, "pitch" : -1.428455, "yaw" : 2.271631 }, "pose" : { "type" : 5 }, "gyro" : [ 2.868652, -2.868652, 2.563476 ], "accel" : [ 0.04736328, -0.7241211, 0.6367188 ], "emg" : [ -6, 0, -1, 0, 40, 1, 2, -2 ] }}';
let frameDumpDeviceInfo = '{ "frame" : { "deviceInfo" : { "connected" : true }}}';
describe('BaseConnection', () => {
    describe('Constructor: Test with valid host and port', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should return a Myo object', (done) => {
            assert.strictEqual(baseConnection.host, '127.0.0.1');
            assert.strictEqual(baseConnection.port, 6450);
            done();
        });
    });
    describe('Constructor: Test with empty object', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection({});
        });
        after((done) => {
            baseConnection = null;
            done();
        });
        it('should return a Myo object with default host and port', (done) => {
            assert.strictEqual(baseConnection.host, '127.0.0.1');
            assert.strictEqual(baseConnection.port, 6450);
            done();
        });
    });
    describe('Constructor: Test with empty host', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection({someProperty:'someString', port:6450});
        });
        after((done) => {
            baseConnection = null;
            done();
        });
        it('should return a Myo object with default host', (done) => {
            assert.strictEqual(baseConnection.host, '127.0.0.1');
            assert.strictEqual(baseConnection.port, 6450);
            done();
        });
    });
    describe('Constructor: Test with host of wrong type', () => {
        let baseConnection;
        after((done) => {
            baseConnection = null;
            done();
        });
        it('should throw an error when host is of wrong type', (done) => {
            assert.throws(() => {
                baseConnection = new BaseConnection({host: 6450});
            }, Error, 'Host needs to be of type string');
            done();
        });
    });
    describe('Constructor: Test with empty port', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection({host:'someString'});
        });
        after((done) => {
            baseConnection = null;
            done();
        });
        it('should return a Myo object with default port', (done) => {
            assert.strictEqual(baseConnection.host, 'someString');
            assert.strictEqual(baseConnection.port, 6450);
            done();
        });
    });
    describe('Constructor: Test with port of wrong type', () => {
        let baseConnection;
        after((done) => {
            baseConnection = null;
            done();
        });
        it('should throw an error when port is of wrong type', (done) => {
            assert.throws(() => {
                baseConnection = new BaseConnection({host:'someString', port:'someOtherString'});
            }, Error, 'Port needs to be of type integer');
            done();
        });
    });
    describe('Constructor: Test with passing a string as an argument', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection('someString');
        });
        after((done) => {
            baseConnection = null;
            done();
        });
        it('should return a Myo object with default host and port', (done) => {
            assert.strictEqual(baseConnection.host, '127.0.0.1');
            assert.strictEqual(baseConnection.port, 6450);
            done();
        });
    });
    describe('#send', () => {
        let baseConnection;
        before(() => {
             baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should throw an error when parameter is invalid', (done) => {
            assert.throws(() => {
                baseConnection.send('abc');
            }, Error, 'Parameter needs to be an object');
            done();
        });
    });
    describe('#getUrl', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should return the correct url', (done) => {
            assert.strictEqual(baseConnection.getUrl(), 'ws://127.0.0.1:6450/');
            done();
        });
    });
    describe('#handleOpen', () => {
        let wss;
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
            wss = new WebSocketServer({port: 6450});
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            wss.close();
            wss = null;
            done();
        });
        it('should call context to requestDeviceInfo', (done) => {
            let didRequestDeviceInfo = false;
            let errTimeout = setTimeout(() => {
                assert.strictEqual(false, '"requestDeviceInfo" never sent');
                clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
                done();
            }, 1000);
            wss.on('connection', (ws) => {
                ws.on('message', (message) => {
                    let data = JSON.parse(message);
                    if(data.hasOwnProperty('command')) {
                        if(data.command === 'requestDeviceInfo') {
                            didRequestDeviceInfo = true;
                            clearTimeout(errTimeout);
                            assert.strictEqual(true, didRequestDeviceInfo);
                            done();
                        }
                    }
                });
            });
            baseConnection.connect();
        });
    });
    describe('#handleOpen: when already connected', () => {
        let wss;
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
            wss = new WebSocketServer({port: 6450});
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            wss.close();
            wss = null;
            done();
        });
        it('should return string "connected"', (done) => {
            baseConnection.connected = true;
            assert.strictEqual('connected', baseConnection.handleOpen());
            done();
        });
    });
    describe('#handleClose: when connected', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should return "disconnecting"', (done) => {
            baseConnection.connected = true;
            assert.strictEqual('disconnecting', baseConnection.handleClose());
            done();
        });
    });
    describe('#handleClose: return "disconnected" if disconnected', () => {
        let wss;
        let baseConnection;
        before(() => {
            wss = new WebSocketServer({port: 6450});
            baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            wss.close();
            wss = null;
            done();
        });
        it('should return "disconnecting" if connected', (done) => {
            let didRequestDeviceInfo = false;
            let errTimeout = setTimeout(() => {
                assert.strictEqual(false, 'failed to connect or receive data');
                clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
                done();
            }, 1000);
            wss.on('connection', (ws) => {
                ws.on('message', (message) => {
                    let data = JSON.parse(message);
                    if(data.hasOwnProperty('command')) {
                        if(data.command === 'requestDeviceInfo') {
                            didRequestDeviceInfo = true;
                            clearTimeout(errTimeout);
                            assert.strictEqual(baseConnection.handleClose(), 'disconnected');
                            done();
                        }
                    }
                });
            });
            baseConnection.connect();
        });
    });
    describe('#reconnect', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should return "stopReconnection" when connected', (done) => {
            baseConnection.connected = true;
            assert.strictEqual(baseConnection.reconnect(), 'stopReconnection');
            clearInterval(baseConnection.reconnectionTimer);
            done();
        });
        it('should return "connect" if not connected', (done) => {
            baseConnection.connected = false;
            assert.strictEqual(baseConnection.reconnect(), 'connect');
            clearInterval(baseConnection.reconnectionTimer);
            done();
        });
    });
    describe('#handleData: errors', () => {
        it('should throw an error when no data is sent', () => {
            assert.throws(() => {
                let baseConnection = new BaseConnection();
                baseConnection.handleData();
            }, Error, 'No data received');
        });
        it('should throw an error when JSON string is invalid', () => {
            assert.throws(() => {
                let baseConnection = new BaseConnection();
                baseConnection.handleData('abc');
            }, Error, 'Invalid JSON');
        });
    });
    describe('#handleData: deviceInfo', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should emit a deviceInfo event', (done) => {
            let didEmitDeviceInfo = false;
            let errTimeout = setTimeout(() => {
                assert.strictEqual(false, 'Event never fired');
                done();
            }, 10);
            baseConnection.on('deviceInfo', () => {
                didEmitDeviceInfo = true;
                clearTimeout(errTimeout);
                assert.strictEqual(true, didEmitDeviceInfo);
                done();
            });
            baseConnection.connected = false;
            baseConnection.handleData(frameDumpDeviceInfo);
        });
    });
    describe('#handleData: connect', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should emit a "connect" event', (done) => {
            let didEmitConnect = false;
            let errTimeout = setTimeout(() => {
                assert.strictEqual(false, '"connect" event never fired');
                done();
            }, 10);
            baseConnection.on('connect', () => {
                didEmitConnect = true;
                clearTimeout(errTimeout);
                assert.strictEqual(true, didEmitConnect);
                done();
            });
            baseConnection.connected = false;
            baseConnection.handleData(frameDumpDeviceInfo);
        });
    });
    describe('#handleData: frame', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should emit a "frame" event', (done) => {
            let didEmitFrame = false;
            baseConnection.connected = true;
            let errTimeout = setTimeout(() => {
                assert.strictEqual(false, '"frame" event never fired');
                done();
            }, 10);
            baseConnection.on('frame', () => {
                didEmitFrame = true;
                clearTimeout(errTimeout);
                assert.strictEqual(true, didEmitFrame);
                done();
            });
            baseConnection.handleData(frameDump);
        });
    });
    describe('#handleData: pose', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should emit a "pose" event', (done) => {
            let didEmitPose = false;
            baseConnection.connected = true;
            let errTimeout = setTimeout(() => {
                assert.strictEqual(false, '"pose" event never fired');
                done();
            }, 10);
            baseConnection.on('pose', () => {
                didEmitPose = true;
                clearTimeout(errTimeout);
                assert.strictEqual(true, didEmitPose);
                done();
            });
            baseConnection.handleData(frameDump);
        });
    });
    describe('#handleData: event', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should emit a "event" event', (done) => {
            let didEmitEvent = false;
            baseConnection.connected = true;
            let errTimeout = setTimeout(() => {
                assert.strictEqual(false, '"event" event never fired');
                done();
            }, 10);
            baseConnection.on('event', () => {
                didEmitEvent = true;
                clearTimeout(errTimeout);
                assert.strictEqual(true, didEmitEvent);
                done();
            });
            baseConnection.handleData(frameDump);
        });
    });
    describe('#startReconnection', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should return "reconnecting" if no reconnectionTimer', (done) => {
            baseConnection.reconnectionTimer = null;
            assert.strictEqual(baseConnection.startReconnection(), 'reconnecting');
            clearInterval(baseConnection.reconnectionTimer);
            done();
        });
    });
    describe('#startReconnection: when already connected', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should return "already reconnecting" if having reconnectionTimer', (done) => {
            baseConnection.reconnectionTimer = 1234;
            assert.strictEqual(baseConnection.startReconnection(), 'already reconnecting');
            done();
        });
    });
    describe('#stopReconnection', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should clear reconnection timer', (done) => {
            baseConnection.reconnectionTimer = setInterval(() => {}, 1000);
            baseConnection.stopReconnection();
            assert.isUndefined(baseConnection.reconnectionTimer);
            done();
        });
    });
    describe('#connect', () => {
        let wss;
        let baseConnection;
        before(() => {
            wss = new WebSocketServer({port: 6450});
            baseConnection = new BaseConnection();
        });
        after((done) => {
            wss.close();
            wss = null;
            baseConnection.socket = null;
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should emit a "connect" event', (done) => {
            let didRequestDeviceInfo = false;
            wss.on('connection', (ws) => {
                ws.on('message', (message) => {
                    let data = JSON.parse(message);
                    if(data.hasOwnProperty('command')) {
                        if(data.command === 'requestDeviceInfo') {
                            didRequestDeviceInfo = true;
                            ws.send(frameDumpDeviceInfo);
                        }
                    }
                });
            });
            let errTimeout = setTimeout(() => {
                assert.strictEqual(false, '"connect" event never fired');
                done();
            }, 1000);
            baseConnection.on('connect', () => {
                clearTimeout(errTimeout);
                assert.strictEqual(true, baseConnection.connected);
                assert.strictEqual(true, didRequestDeviceInfo);
                done();
            });
            baseConnection.connect();
        });
    });
    describe('#connect: when already connected', () => {
        let baseConnection;
        before(() => {
            baseConnection = new BaseConnection();
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should return "socket already created" when already created socket', (done) => {
            baseConnection.socket = {};
            assert.strictEqual(baseConnection.connect(), 'socket already created');
            done();
        });
    });
    describe('#disconnect (connected)', () => {
        let didEmitDisconnect = false;
        let baseConnection;
        let didCloseSocket;
        before(() => {
            baseConnection = new BaseConnection();
            baseConnection.socket = {};
            baseConnection.socket.close = () => {
                didCloseSocket = true;
            };
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });

        it('should emit a "disconnect" event', (done) => {
            didCloseSocket = false;
            baseConnection.connected = true;
            let errTimeout = setTimeout(() => {
                assert.strictEqual(false, '"disconnect" event never fired');
                done();
            }, 10);
            baseConnection.on('disconnect', () => {
                didEmitDisconnect = true;
                clearTimeout(errTimeout);
                assert.strictEqual(true, didEmitDisconnect);
                done();
            });
            baseConnection.disconnect();
            assert.strictEqual(true, didCloseSocket);
        });
    });
    describe('#disconnect (disconnected)', () => {
        let didEmitDisconnect = false;
        let baseConnection;
        let didCloseSocket;
        before(() => {
            baseConnection = new BaseConnection();
            baseConnection.socket = {};
            baseConnection.socket.close = () => {
                didCloseSocket = true;
            };
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });
        it('should not emit a "disconnect" event if disconnected', (done) => {
            didCloseSocket = false;
            let errTimeout = setTimeout(() => {
                assert.strictEqual(false, didEmitDisconnect);
                done();
            }, 10);
            baseConnection.on('disconnect', () => {
                didEmitDisconnect = true;
                clearTimeout(errTimeout);
                assert.strictEqual(true, didEmitDisconnect);
                done();
            });
            baseConnection.disconnect();
            assert.strictEqual(true, didCloseSocket);
        });
    });
    describe('#disconnect (stopReconnection)', () => {
        let baseConnection;
        let didCloseSocket;
        before(() => {
            baseConnection = new BaseConnection();
            baseConnection.socket = {};
            baseConnection.socket.close = () => {
                didCloseSocket = true;
            };
        });
        after((done) => {
            clearInterval(baseConnection.reconnectionTimer);
            baseConnection = null;
            done();
        });

        it('should call "stopReconnection" if not allowing reconnections', (done) => {
            let didStopReconnection = false;
            baseConnection.stopReconnection = () => {
                didStopReconnection = true;
            };
            baseConnection.disconnect(false);
            assert.isUndefined(baseConnection.reconnectionTimer);
            assert.strictEqual(true, didStopReconnection);
            done();
        });
    });
});
