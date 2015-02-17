var Myo = module.exports = function(context) {

    if (!context) {
        throw new Error('Missing context');
    }
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
     * Unlock for a fixed period of time.
     */
    this.UNLOCK_TIMED = 0;

    /**
     * Unlock until explicitly told to re-lock.
     */
    this.UNLOCK_HOLD = 1;

    /**
     * User did a single, discrete action, such as pausing a video.
     */
    this.USER_ACTION_SINGLE = 0;

    /**
     * @private
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
Myo.prototype.requestRssi = function() {
    this.context.send({
        'requestRssi': true
    });
};

/**
 * Engage the Myo's built in vibration motor.
 * @param length
 *
 */
Myo.prototype.vibrate = function(length) {
    switch (length) {
        case this.VIBRATION_SHORT:
            this.context.send({
                'command': 'vibrate',
                'args': [this.VIBRATION_SHORT]
            });
            break;
        case this.VIBRATION_MEDIUM:
            this.context.send({
                'command': 'vibrate',
                'args': [this.VIBRATION_MEDIUM]
            });
            break;
        case this.VIBRATION_LONG:
            this.context.send({
                'command': 'vibrate',
                'args': [this.VIBRATION_LONG]
            });
            break;
        default:
            throw new Error('Valid values are: Myo.VIBRATION_SHORT, Myo.VIBRATION_MEDIUM, Myo.VIBRATION_LONG');
    }
};

/**
 * Unlock the given Myo.
 * Can be called when a Myo is paired.
 *
 */
Myo.prototype.unlock = function(option) {
    switch (option) {
        case this.UNLOCK_TIMED:
            this.context.send({
                'command': 'unlock',
                'args': [this.UNLOCK_TIMED]
            });
            break;
        case this.UNLOCK_HOLD:
            this.context.send({
                'command': 'unlock',
                'args': [this.UNLOCK_HOLD]
            });
            break;
        default:
            throw new Error('Valid values are: Myo.UNLOCK_TIMED, Myo.UNLOCK_HOLD');
    }
};

/**
 * Lock the given Myo immediately.
 * Can be called when a Myo is paired.
 *
 */
Myo.prototype.lock = function() {
    this.context.send({
        'command': 'lock'
    });
};

/**
 * Notify the given Myo that a user action was recognized.
 * Can be called when a Myo is paired. Will cause Myo to vibrate.
 *
 */
Myo.prototype.notifyUserAction = function(action) {
    switch (action) {
        case this.USER_ACTION_SINGLE:
            this.context.send({
                'command': 'notifyUserAction',
                'args': [this.USER_ACTION_SINGLE]
            });
            break;
        default:
            throw new Error('Valid values are: Myo.USER_ACTION_SINGLE');
    }
};
