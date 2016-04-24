export default class Myo {
    constructor(context) {

        if (!context) {
            throw new Error('Missing context');
        }

        /**
         * @private
         *
         */
        this.context = context;
    }


    /**
     * Request the RSSI of the Myo.
     *
     * <p>An onRssi event will likely be generated with the value of the RSSI.</p>
     *
     */
    requestRssi() {
        this.context.send({
            'requestRssi': true
        });
    }

    /**
     * Engage the Myo's built in vibration motor.
     * @param length
     *
     */
    vibrate(length) {
        switch (length) {
            case Myo.VIBRATION_SHORT:
                this.context.send({
                    'command': 'vibrate',
                    'args': [Myo.VIBRATION_SHORT]
                });
                break;
            case Myo.VIBRATION_MEDIUM:
                this.context.send({
                    'command': 'vibrate',
                    'args': [Myo.VIBRATION_MEDIUM]
                });
                break;
            case Myo.VIBRATION_LONG:
                this.context.send({
                    'command': 'vibrate',
                    'args': [Myo.VIBRATION_LONG]
                });
                break;
            default:
                throw new Error('Valid values are: Myo.VIBRATION_SHORT, Myo.VIBRATION_MEDIUM, Myo.VIBRATION_LONG');
        }
    }

    /**
     * Unlock the given Myo.
     * Can be called when a Myo is paired.
     *
     */
    unlock(option) {
        switch (option) {
            case Myo.UNLOCK_TIMED:
                this.context.send({
                    'command': 'unlock',
                    'args': [Myo.UNLOCK_TIMED]
                });
                break;
            case Myo.UNLOCK_HOLD:
                this.context.send({
                    'command': 'unlock',
                    'args': [Myo.UNLOCK_HOLD]
                });
                break;
            default:
                throw new Error('Valid values are: Myo.UNLOCK_TIMED, Myo.UNLOCK_HOLD');
        }
    }

    /**
     * Lock the given Myo immediately.
     * Can be called when a Myo is paired.
     *
     */
    lock() {
        this.context.send({
            'command': 'lock'
        });
    }

    /**
     * Notify the given Myo that a user action was recognized.
     * Can be called when a Myo is paired. Will cause Myo to vibrate.
     *
     */
    notifyUserAction(action) {
        switch (action) {
            case Myo.USER_ACTION_SINGLE:
                this.context.send({
                    'command': 'notifyUserAction',
                    'args': [Myo.USER_ACTION_SINGLE]
                });
                break;
            default:
                throw new Error('Valid values are: Myo.USER_ACTION_SINGLE');
        }
    }
}

/**
 * A vibration lasting a small amount of time (VibrationLengthShort)
 */
Myo.VIBRATION_SHORT = 0;

/**
 * A vibration lasting a moderate amount of time (VibrationLengthMedium)
 */
Myo.VIBRATION_MEDIUM = 1;

/**
 * A vibration lasting a long amount of time (VibrationLengthLong)
 */
Myo.VIBRATION_LONG = 2;

/**
 * Unlock for a fixed period of time.
 */
Myo.UNLOCK_TIMED = 0;

/**
 * Unlock until explicitly told to re-lock.
 */
Myo.UNLOCK_HOLD = 1;

/**
 * User did a single, discrete action, such as pausing a video.
 */
Myo.USER_ACTION_SINGLE = 0;