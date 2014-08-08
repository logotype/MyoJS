var BaseConnection = require('./connection/BaseConnection').BaseConnection,
    EventEmitter = require('events').EventEmitter,
    CircularBuffer = require("./CircularBuffer"),
    _ = require('underscore');

var Hub = module.exports = function (data, opt) {
    this.connectionType = require('./connection/BaseConnection');
    this.myoType = require('./Myo');
    this.connection = new this.connectionType(opt);
    this.historyType = require('./CircularBuffer');
    this.history = new this.historyType(200);
    this.myos = [];
    this.listeners = [];

    var hub = this;

    // Forward events
    this.connection.on('deviceInfo', function (data) {
        hub.myo = new hub.myoType(data, hub.connection);
    });

    // Forward events
    this.connection.on('frame', function (frame) {
        hub.history.push(frame);
        hub.emit('frame', frame);
    });
    this.connection.on('pose', function (pose) {
        hub.emit('pose', pose);
    });
    this.connection.on('ready', function () {
        hub.emit('ready');
    });
    this.connection.on('connect', function () {
        hub.emit('connect');
    });
    this.connection.on('disconnect', function () {
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
Hub.prototype.frame = function (num) {
    return this.history.get(num) || null;
};

/**
 * Find a nearby Myo and pair with it, or time out after timeoutMilliseconds milliseconds if provided.
 *
 * <p>If timeout_ms is zero, this function blocks until a Myo is found. This function must
 * not be run concurrently with run() or runOnce().</p>
 */
Hub.prototype.waitForMyo = function (timeoutMilliseconds) {
    var myo = this.connection.send({
        "waitForMyo": timeoutMilliseconds
    });
    if (myo) {
        myo.context = this.connection;
        this.myos.push(myo);
        return myo;
    }

    return null;
};

/**
 * Register a listener to be called when device events occur.
 */
Hub.prototype.addListener = function (listener) {
    this.listeners.push(listener);
    this.connection.send({
        "addListener": listener
    });
};

/**
 * Remove a previously registered listener.
 */
Hub.prototype.removeListener = function (listener) {
    var i = 0;
    for (i; i < this.listeners.length; i++) {
        if (this.listeners[i] == listener) {
            this.listeners.splice(i, 1);
            break;
        }
    }
};

/**
 * Run the event loop for the specified duration (in milliseconds).
 */
Hub.prototype.run = function (durationMilliseconds) {
    this.connection.send({
        "run": durationMilliseconds
    });
};

/**
 * Run the event loop until a single event occurs, or the specified
 * duration (in milliseconds) has elapsed.
 */
Hub.prototype.runOnce = function (durationMilliseconds) {
    this.connection.send({
        "runOnce": durationMilliseconds
    });
};

_.extend(Hub.prototype, EventEmitter.prototype);
