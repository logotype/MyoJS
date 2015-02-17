var EventEmitter = require('events').EventEmitter,
    Myo = require('./Myo'),
    _ = require('underscore');

var Hub = module.exports = function(opt) {

    this.connectionType = require('./connection/BaseConnection');
    this.myoType = require('./Myo');
    this.connection = new this.connectionType(opt);
    this.historyType = require('./CircularBuffer');
    this.history = new this.historyType(200);
    this.myos = [];

    this.connection.connect();

    var hub = this;

    // Forward events
    this.connection.on('deviceInfo', function() {
        hub.myo = new Myo(hub.connection);
    });
    this.connection.on('frame', function(frame) {
        hub.history.push(frame);
        hub.emit('frame', frame);
    });
    this.connection.on('pose', function(pose) {
        hub.emit('pose', pose);
    });
    this.connection.on('event', function(event) {
        hub.emit(event.type);
    });
    this.connection.on('ready', function() {
        hub.emit('ready');
    });
    this.connection.on('connect', function() {
        hub.emit('connect');
    });
    this.connection.on('disconnect', function() {
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
    return this.history.get(num) || null;
};

/**
 * Find a nearby Myo and pair with it, or time out after timeoutMilliseconds milliseconds if provided.
 *
 * <p>If timeout_ms is zero, this function blocks until a Myo is found. This function must
 * not be run concurrently with run() or runOnce().</p>
 */
Hub.prototype.waitForMyo = function(timeoutMilliseconds) {
    if (!timeoutMilliseconds || timeoutMilliseconds !== parseInt(timeoutMilliseconds, 10)) {
        throw new Error('timeoutMilliseconds needs to be of type integer');
    }
    this.connection.send({
        'waitForMyo': timeoutMilliseconds
    });
};

/**
 * Run the event loop for the specified duration (in milliseconds).
 */
Hub.prototype.run = function(durationMilliseconds) {
    if (!durationMilliseconds || durationMilliseconds !== parseInt(durationMilliseconds, 10)) {
        throw new Error('durationMilliseconds needs to be of type integer');
    }
    this.connection.send({
        'run': durationMilliseconds
    });
};

/**
 * Run the event loop until a single event occurs, or the specified
 * duration (in milliseconds) has elapsed.
 */
Hub.prototype.runOnce = function(durationMilliseconds) {
    if (!durationMilliseconds || durationMilliseconds !== parseInt(durationMilliseconds, 10)) {
        throw new Error('durationMilliseconds needs to be of type integer');
    }
    this.connection.send({
        'runOnce': durationMilliseconds
    });
};

_.extend(Hub.prototype, EventEmitter.prototype);
