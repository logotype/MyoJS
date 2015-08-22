var Frame = require('../Frame'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore');

var BaseConnection = module.exports = function(options) {
    'use strict';
    var self = this;

    if (options) {
        if (typeof options !== 'object') {
            throw new Error('Constructor parameter needs to be an object');
        }
        if (!options.hasOwnProperty('host') || typeof options.host !== 'string') {
            throw new Error('Host needs to be of type string');
        }
        if (!options.hasOwnProperty('port') || options.port !== parseInt(options.port, 10)) {
            throw new Error('Port needs to be of type integer');
        }
    }

    self.options = _.defaults(options || {}, {
        host: '127.0.0.1',
        port: 6450
    });

    self.host = self.options.host;
    self.port = self.options.port;
    self.connected = false;
};

BaseConnection.prototype.getUrl = function() {
    'use strict';
    var self = this;

    return 'ws://' + self.host + ':' + self.port + '/';
};

BaseConnection.prototype.handleOpen = function() {
    'use strict';
    var self = this;

    if (!self.connected) {
        self.send({
            'command': 'requestDeviceInfo'
        });
        return 'connecting';
    } else {
        return 'connected';
    }
};

BaseConnection.prototype.handleClose = function() {
    'use strict';
    var self = this;

    if (self.connected) {
        self.disconnect();
        self.startReconnection();
        return 'disconnecting';
    } else {
        return 'disconnected';
    }
};

BaseConnection.prototype.startReconnection = function() {
    'use strict';
    var self = this,
        connection = this;
    if (!self.reconnectionTimer) {
        self.reconnectionTimer = setInterval(function() {
            connection.reconnect();
        }, 500);
        return 'reconnecting';
    } else {
        return 'already reconnecting';
    }
};

BaseConnection.prototype.stopReconnection = function() {
    'use strict';
    var self = this;

    self.reconnectionTimer = clearInterval(self.reconnectionTimer);
};

// By default, disconnect will prevent auto-reconnection.
// Pass in true to allow the reconnection loop not be interrupted continue
BaseConnection.prototype.disconnect = function(allowReconnect) {
    'use strict';
    var self = this;

    if (!allowReconnect) {
        self.stopReconnection();
    }
    if (!self.socket) {
        return;
    }
    self.socket.close();
    delete self.socket;
    if (self.connected) {
        self.connected = false;
        self.emit('disconnect');
    }
    return true;
};

BaseConnection.prototype.reconnect = function() {
    'use strict';
    var self = this;

    if (self.connected) {
        self.stopReconnection();
        return 'stopReconnection';
    } else {
        self.disconnect(true);
        self.connect();
        return 'connect';
    }
};

BaseConnection.prototype.handleData = function(data) {
    'use strict';
    var self = this,
        message, frameObject, frame, deviceInfo;

    if (!data) {
        throw new Error('No data received');
    }

    // TODO Profile performance of this try/catch block
    try {
        message = JSON.parse(data);
    } catch (exception) {
        throw new Error('Invalid JSON');
    }

    // Wait for deviceInfo until connected
    if (!self.connected && message.hasOwnProperty('frame')) {
        frame = message.frame;
        if (frame.hasOwnProperty('deviceInfo')) {
            deviceInfo = frame.deviceInfo;
            self.emit('deviceInfo', deviceInfo);
            self.connected = true;
            self.emit('connect');
            return;
        }
    }

    if (!self.connected) {
        return;
    }

    if (message.hasOwnProperty('frame')) {
        frameObject = new Frame(message.frame);
        self.emit(frameObject.type, frameObject);

        // Emit pose if existing
        if (frameObject.pose) {
            self.emit('pose', frameObject.pose);
        }

        // Emit event if existing
        if (frameObject.event) {
            self.emit('event', frameObject.event);
        }
    }
};

BaseConnection.prototype.connect = function() {
    'use strict';
    var self = this;

    if (self.socket) {
        return 'socket already created';
    }

    self.emit('ready');

    var inNode = (typeof(process) !== 'undefined' && process.versions && process.versions.node),
        connection = this,
        ConnectionType;

    if (inNode) {
        ConnectionType = require('ws');
        self.socket = new ConnectionType(self.getUrl());
    } else {
        self.socket = new WebSocket(self.getUrl());
    }

    self.socket.onopen = function() {
        connection.handleOpen();
    };
    self.socket.onclose = function(data) {
        connection.handleClose(data.code, data.reason);
    };
    self.socket.onmessage = function(message) {
        connection.handleData(message.data);
    };
    self.socket.onerror = function(data) {
        connection.handleClose('connectError', data.data);
    };

    return true;
};

BaseConnection.prototype.send = function(data) {
    'use strict';
    var self = this;

    if (typeof data !== 'object' || typeof data === 'string') {
        throw new Error('Parameter needs to be an object');
    }
    self.socket.send(JSON.stringify(data));
};

_.extend(BaseConnection.prototype, EventEmitter.prototype);
