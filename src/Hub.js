var EventEmitter = require('events').EventEmitter,
    Myo = require('./Myo'),
    _ = require('underscore');

var Hub = module.exports = function(opt) {
    'use strict';
    var self = this;

    self.connectionType = require('./connection/BaseConnection');
    self.connection = new self.connectionType(opt);
    self.historyType = require('./CircularBuffer');
    self.history = new self.historyType(200);
    self.myos = [];

    self.connection.connect();

    var hub = this;

    // Forward events
    self.connection.on('deviceInfo', function() {
        hub.myo = new Myo(hub.connection);
    });
    self.connection.on('frame', function(frame) {
        hub.history.push(frame);
        hub.emit('frame', frame);
    });
    self.connection.on('pose', function(pose) {
        hub.emit('pose', pose);
    });
    self.connection.on('event', function(event) {
        hub.emit(event.type);
    });
    self.connection.on('ready', function() {
        hub.emit('ready');
    });
    self.connection.on('connect', function() {
        hub.emit('connect');
    });
    self.connection.on('disconnect', function() {
        hub.emit('disconnect');
    });
};

/**
 * Returns a frame of tracking data from the Myo.
 *
 * Use the optional history parameter to specify which frame to retrieve.
 * Call frame() or frame(0) to access the most recent frame; call frame(1) to
 * access the previous frame, and so on. If you use a history value greater
 * than the number of stored frames, then the hub returns an invalid frame.
 *
 * @method frame
 * @memberof Myo.hub.prototype
 * @param {number} num The age of the frame to return, counting backwards from
 * the most recent frame (0) into the past and up to the maximum age (59).
 * @returns {Myo.Frame} The specified frame; or, if no history
 * parameter is specified, the newest frame. If a frame is not available at
 * the specified history position, an invalid Frame is returned.
 **/
Hub.prototype.frame = function(num) {
    'use strict';
    var self = this;

    return self.history.get(num) || null;
};

/**
 * Find a nearby Myo and pair with it, or time out after timeoutMilliseconds milliseconds if provided.
 *
 * <p>If timeout_ms is zero, this function blocks until a Myo is found. This function must
 * not be run concurrently with run() or runOnce().</p>
 */
Hub.prototype.waitForMyo = function(timeoutMilliseconds) {
    'use strict';
    var self = this;

    if (!timeoutMilliseconds || timeoutMilliseconds !== parseInt(timeoutMilliseconds, 10)) {
        throw new Error('timeoutMilliseconds needs to be of type integer');
    }
    self.connection.send({
        'waitForMyo': timeoutMilliseconds
    });
};

/**
 * Run the event loop for the specified duration (in milliseconds).
 */
Hub.prototype.run = function(durationMilliseconds) {
    'use strict';
    var self = this;

    if (!durationMilliseconds || durationMilliseconds !== parseInt(durationMilliseconds, 10)) {
        throw new Error('durationMilliseconds needs to be of type integer');
    }
    self.connection.send({
        'run': durationMilliseconds
    });
};

/**
 * Run the event loop until a single event occurs, or the specified
 * duration (in milliseconds) has elapsed.
 */
Hub.prototype.runOnce = function(durationMilliseconds) {
    'use strict';
    var self = this;

    if (!durationMilliseconds || durationMilliseconds !== parseInt(durationMilliseconds, 10)) {
        throw new Error('durationMilliseconds needs to be of type integer');
    }
    self.connection.send({
        'runOnce': durationMilliseconds
    });
};

_.extend(Hub.prototype, EventEmitter.prototype);
