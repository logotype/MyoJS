import {EventEmitter} from 'events';
import {Frame} from './../Frame.js';

export class BaseConnection extends EventEmitter {
    constructor({host = '127.0.0.1', port = 6450} = {}) {
        super();

        if (typeof host !== 'string') {
            throw new Error('Host needs to be of type string');
        }
        if (port !== parseInt(port, 10)) {
            throw new Error('Port needs to be of type integer');
        }

        this.host = host;
        this.port = port;
        this.connected = false;
    }

    getUrl() {
        return 'ws://' + this.host + ':' + this.port + '/';
    }

    handleOpen() {
        var returnValue;

        if (!this.connected) {
            this.send({
                'command': 'requestDeviceInfo'
            });
            returnValue = 'connecting';
        } else {
            returnValue = 'connected';
        }
        return returnValue;
    }

    handleClose() {
        var returnValue;

        if (this.connected) {
            this.disconnect();
            this.startReconnection();
            returnValue = 'disconnecting';
        } else {
            returnValue = 'disconnected';
        }
        return returnValue;
    }

    startReconnection() {
        var returnValue;

        if (!this.reconnectionTimer) {
            this.reconnectionTimer = setInterval(() => {
                this.reconnect();
            }, 500);
            returnValue = 'reconnecting';
        } else {
            returnValue = 'already reconnecting';
        }
        return returnValue;
    }

    stopReconnection() {
        this.reconnectionTimer = clearInterval(this.reconnectionTimer);
    }

    disconnect(allowReconnect) {
        if (!allowReconnect) {
            this.stopReconnection();
        }
        if (!this.socket) {
            return;
        }
        this.socket.close();
        delete this.socket;
        if (this.connected) {
            this.connected = false;
            this.emit('disconnect');
        }
        return true;
    }

    reconnect() {
        var returnValue;

        if (this.connected) {
            this.stopReconnection();
            returnValue = 'stopReconnection';
        } else {
            this.disconnect(true);
            this.connect();
            returnValue = 'connect';
        }
        return returnValue;
    }

    handleData(data) {
        var message,
            frameObject,
            frame,
            deviceInfo;

        if (!data) {
            throw new Error('No data received');
        }

        // TODO: Profile performance of this try/catch block
        try {
            message = JSON.parse(data);
        } catch (exception) {
            throw new Error('Invalid JSON');
        }

        // Wait for deviceInfo until connected
        if (!this.connected && message.hasOwnProperty('frame')) {
            frame = message.frame;
            if (frame.hasOwnProperty('deviceInfo')) {
                deviceInfo = frame.deviceInfo;
                this.emit('deviceInfo', deviceInfo);
                this.connected = true;
                this.emit('connect');
                return;
            }
        }

        if (!this.connected) {
            return;
        }

        if (message.hasOwnProperty('frame')) {
            frameObject = new Frame(message.frame);
            this.emit(frameObject.type, frameObject);

            // Emit pose if existing
            if (frameObject.pose) {
                this.emit('pose', frameObject.pose);
            }

            // Emit event if existing
            if (frameObject.event) {
                this.emit('event', frameObject.event);
            }
        }
    }

    connect() {
        var inBrowser = typeof window !== 'undefined';

        if (this.socket) {
            return 'socket already created';
        }

        this.emit('ready');

        if (inBrowser) {
            this.socket = new WebSocket(this.getUrl());
        } else {
            const ConnectionType = require('ws');
            this.socket = new ConnectionType(this.getUrl());
        }

        this.socket.onopen = () => {
            this.handleOpen();
        };
        this.socket.onclose = (data) => {
            this.handleClose(data.code, data.reason);
        };
        this.socket.onmessage = (message) => {
            this.handleData(message.data);
        };
        this.socket.onerror = (data) => {
            this.handleClose('connectError', data.data);
        };

        return true;
    }

    send(data) {
        if (typeof data !== 'object' || typeof data === 'string') {
            throw new Error('Parameter needs to be an object');
        }
        this.socket.send(JSON.stringify(data));
    }
}