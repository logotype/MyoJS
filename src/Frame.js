var Pose = require('./Pose'),
    Quaternion = require('./Quaternion'),
    Vector3 = require('./Vector3');

var Frame = module.exports = function(data) {
    'use strict';
    var self = this;

    if (!data) {
        throw new Error('Missing constructor arguments');
    }
    if (typeof data !== 'object') {
        throw new Error('Constructor parameter needs to be an object');
    }
    if (!data.hasOwnProperty('id') || data.id !== parseInt(data.id, 10)) {
        throw new Error('Frame id needs to be of type integer');
    }
    if (!data.hasOwnProperty('timestamp') || typeof data.timestamp !== 'string') {
        throw new Error('Timestamp needs to be of type string');
    }

    /**
     * A unique ID for this Frame. Consecutive frames processed by the Myo
     * have consecutive increasing values.
     * @member id
     * @memberof Myo.Frame.prototype
     * @type {number}
     */
    self.id = data.id;

    /**
     * The frame capture time in microseconds elapsed since the Myo started.
     * @member timestamp
     * @memberof Myo.Frame.prototype
     * @type {string}
     */
    self.timestamp = data.timestamp;

    if (data.euler) {
        self.euler = data.euler;
    }

    if (data.rssi) {
        self.rssi = data.rssi;
    }

    if (data.event) {
        self.event = data.event;
    }

    /**
     * A change in pose has been detected.
     * @member pose
     * @memberof Myo.Pose.prototype
     * @type {Pose}
     */
    if (data.pose) {
        self.pose = new Pose(data.pose);
    } else {
        self.pose = Pose.invalid();
    }

    /**
     * A change in pose has been detected.
     * @member pose
     * @memberof Myo.Pose.prototype
     * @type {Pose}
     */
    if (data.rotation) {
        self.rotation = new Quaternion(data.rotation);
    } else {
        self.rotation = Quaternion.invalid();
    }

    if (data.accel) {
        self.accel = new Vector3(data.accel);
    } else {
        self.accel = Vector3.invalid();
    }

    if (data.gyro) {
        self.gyro = new Vector3(data.gyro);
    } else {
        self.gyro = Vector3.invalid();
    }

    /**
     * EMG data
     */
    if (data.emg) {
        self.emg = data.emg;
    } else {
        self.emg = [];
    }

    self.data = data;
    self.type = 'frame';
};


/**
 * Returns a string containing this Frame in a human readable format.
 * @return
 *
 */
Frame.prototype.toString = function() {
    'use strict';
    var self = this;

    return '[Frame id:' + self.id + ' timestamp:' + self.timestamp + ' accel:' + self.accel.toString() + ']';
};
