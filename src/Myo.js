var EventEmitter = require('events').EventEmitter;

var Myo = module.exports = function (data, context) {
    /**
     * A vibration lasting a small amount of time (VibrationLengthShort)
     */
    this.VIBRATION_SHORT = 0;

    /**
     * A vibration lasting a moderate amount of time (VibrationLengthMedium)
     */
    this.VIBRATION_MEDIUM = 1;

    /**
     * A vibration lasting a long amount of time (VibrationLengthLong)
     */
    this.VIBRATION_LONG = 2;

    /**
     * @private
     * Native Extension context object.
     *
     */
    this.context = context;
};

/**
 * Request the RSSI of the Myo.
 *
 * <p>An onRssi event will likely be generated with the value of the RSSI.</p>
 *
 */
Myo.prototype.requestRssi = function () {
    this.context.send({
        "requestRssi": true
    });
};

/**
 * Engage the Myo's built in vibration motor.
 * @param length
 *
 */
Myo.prototype.vibrate = function (length) {
    switch (length) {
        case this.VIBRATION_SHORT:
            this.context.send({"command":"vibrate", "args" : [this.VIBRATION_SHORT]});
            break;
        case this.VIBRATION_MEDIUM:
            this.context.send({"command":"vibrate", "args" : [this.VIBRATION_MEDIUM]});
            break;
        case this.VIBRATION_LONG:
            this.context.send({"command":"vibrate", "args" : [this.VIBRATION_LONG]});
            break;
        default:
            throw new Error("Valid values are: Myo.VIBRATION_SHORT, Myo.VIBRATION_MEDIUM, Myo.VIBRATION_LONG");
            break;
    }
};