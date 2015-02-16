var Frame = require('../Frame'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore');

var BaseConnection = module.exports = function(options) {
    'use strict';

    this.options = _.defaults(options || {}, {
        host: '127.0.0.1',
        port: 6450
    });

    this.host = this.options.host;
    this.port = this.options.port;
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
    }
};

BaseConnection.prototype.handleClose = function(code, reason) {
    'use strict';

    if (!this.connected) return;
    this.disconnect();
    this.startReconnection();
};

BaseConnection.prototype.startReconnection = function() {
    'use strict';

    var connection = this;
    if (!this.reconnectionTimer) {
        (this.reconnectionTimer = setInterval(function() {
            connection.reconnect()
        }, 500));
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

    if (!allowReconnect) this.stopReconnection();
    if (!this.socket) return;
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

    var message, messageEvent, frame, deviceInfo;

    message = JSON.parse(data);

    // Wait for deviceInfo until connected
    if (!this.connected && message.hasOwnProperty('frame')) {
        frame = message['frame'];
        if (frame.hasOwnProperty('deviceInfo')) {
            deviceInfo = frame['deviceInfo'];
            this.emit('deviceInfo', deviceInfo);
            this.connected = true;
            this.emit('connect');
        }
    }

    if (!this.connected) return;

    if (message.hasOwnProperty('frame')) {
        messageEvent = new Frame(message.frame);
        this.emit(messageEvent.type, messageEvent);

        // Emit pose if existing
        if (messageEvent.pose) {
            this.emit('pose', messageEvent.pose);
        }

        // Emit event if existing
        if (messageEvent.event) {
            this.emit('event', messageEvent.event);
        }
    }
};

BaseConnection.prototype.connect = function() {
    'use strict';

    if (this.socket) return;

    this.emit('ready');

    var inNode = (typeof(process) !== 'undefined' && process.versions && process.versions.node),
        connection = this,
        connectionType;

    if (inNode) {
        connectionType = require('ws');
        this.socket = new connectionType(this.getUrl());
    } else {
        this.socket = new WebSocket(this.getUrl());
    }

    this.socket.onopen = function() {
        connection.handleOpen();
    };
    this.socket.onclose = function(data) {
        connection.handleClose(data['code'], data['reason']);
    };
    this.socket.onmessage = function(message) {
        connection.handleData(message.data)
    };
    this.socket.onerror = function(data) {
        connection.handleClose('connectError', data['data'])
    };

    return true;
};

BaseConnection.prototype.send = function(data) {
    'use strict';
    this.socket.send(JSON.stringify(data));
};

_.extend(BaseConnection.prototype, EventEmitter.prototype);
