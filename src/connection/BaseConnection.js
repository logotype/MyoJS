var Frame = require('../Frame'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore');

var BaseConnection = module.exports = function(options) {
    'use strict';

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

    this.options = _.defaults(options || {}, {
        host: '127.0.0.1',
        port: 6450
    });

    this.host = this.options.host;
    this.port = this.options.port;
    this.connected = false;
};

BaseConnection.prototype.getUrl = function() {
    'use strict';

    return 'ws://' + this.host + ':' + this.port + '/';
};

BaseConnection.prototype.handleOpen = function() {
    'use strict';

    if (!this.connected) {
        this.send({
            'command': 'requestDeviceInfo'
        });
        return 'connecting';
    } else {
        return 'connected';
    }
};

BaseConnection.prototype.handleClose = function() {
    'use strict';

    if (this.connected) {
        this.disconnect();
        this.startReconnection();
        return 'disconnecting';
    } else {
        return 'disconnected';
    }
};

BaseConnection.prototype.startReconnection = function() {
    'use strict';

    var connection = this;
    if (!this.reconnectionTimer) {
        this.reconnectionTimer = setInterval(function() {
            connection.reconnect();
        }, 500);
        return 'reconnecting';
    } else {
        return 'already reconnecting';
    }
};

BaseConnection.prototype.stopReconnection = function() {
    'use strict';

    this.reconnectionTimer = clearInterval(this.reconnectionTimer);
};

// By default, disconnect will prevent auto-reconnection.
// Pass in true to allow the reconnection loop not be interrupted continue
BaseConnection.prototype.disconnect = function(allowReconnect) {
    'use strict';

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
};

BaseConnection.prototype.reconnect = function() {
    'use strict';

    if (this.connected) {
        this.stopReconnection();
    } else {
        this.disconnect(true);
        this.connect();
    }
};

BaseConnection.prototype.handleData = function(data) {
    'use strict';

    var message, frameObject, frame, deviceInfo;

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
};

BaseConnection.prototype.connect = function() {
    'use strict';

    if (this.socket) {
        return;
    }

    this.emit('ready');

    var inNode = (typeof(process) !== 'undefined' && process.versions && process.versions.node),
        connection = this,
        ConnectionType;

    if (inNode) {
        ConnectionType = require('ws');
        this.socket = new ConnectionType(this.getUrl());
    } else {
        this.socket = new WebSocket(this.getUrl());
    }

    this.socket.onopen = function() {
        connection.handleOpen();
    };
    this.socket.onclose = function(data) {
        connection.handleClose(data.code, data.reason);
    };
    this.socket.onmessage = function(message) {
        connection.handleData(message.data);
    };
    this.socket.onerror = function(data) {
        connection.handleClose('connectError', data.data);
    };

    return true;
};

BaseConnection.prototype.send = function(data) {
    'use strict';

    if (typeof data !== 'object' || typeof data === 'string') {
        throw new Error('Parameter needs to be an object');
    }
    this.socket.send(JSON.stringify(data));
};

_.extend(BaseConnection.prototype, EventEmitter.prototype);
