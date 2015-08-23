export class Pose {
    constructor(data) {

        if (typeof data !== 'object' || Object.prototype.toString.call(data) === '[object Array]') {
            throw new Error('Constructor parameter needs to be an object');
        }

        /**
         * The pose being recognized.
         */
        this.type = data.type;

        /**
         * Indicates whether this is a valid Pose object.
         */
        this.valid = !data.hasOwnProperty('invalid');

        if (this.valid) {
            if (!data.hasOwnProperty('type') || data.type !== parseInt(data.type, 10)) {
                throw new Error('Pose type needs to be of type integer');
            }
        }
    }

    isEqualTo(other) {
        return this.type === other.type;
    }

    /**
     * An invalid Pose object.
     *
     * You can use this Pose instance in comparisons testing
     * whether a given Pose instance is valid or invalid.
     *
     */
    static invalid() {
        return new Pose({
            invalid: true
        });
    }

    /**
     * Return a human-readable string representation of the pose.
     * @return
     *
     */
    toString() {
        if (!this.valid) {
            return '[Pose invalid]';
        }
        switch (this.type) {
            case Pose.POSE_REST:
                return '[Pose type:' + this.type.toString() + ' POSE_REST]';
            case Pose.POSE_FIST:
                return '[Pose type:' + this.type.toString() + ' POSE_FIST]';
            case Pose.POSE_WAVE_IN:
                return '[Pose type:' + this.type.toString() + ' POSE_WAVE_IN]';
            case Pose.POSE_WAVE_OUT:
                return '[Pose type:' + this.type.toString() + ' POSE_WAVE_OUT]';
            case Pose.POSE_FINGERS_SPREAD:
                return '[Pose type:' + this.type.toString() + ' POSE_FINGERS_SPREAD]';
            case Pose.POSE_DOUBLE_TAP:
                return '[Pose type:' + this.type.toString() + ' POSE_DOUBLE_TAP]';
            default:
                return '[Pose type:' + this.type.toString() + ']';
        }
    }
}

/**
 * Rest pose.
 */
Pose.POSE_REST = 0;

/**
 * User is making a fist.
 */
Pose.POSE_FIST = 1;

/**
 * User has an open palm rotated towards the posterior of their wrist.
 */
Pose.POSE_WAVE_IN = 2;

/**
 * User has an open palm rotated towards the anterior of their wrist.
 */
Pose.POSE_WAVE_OUT = 3;

/**
 * User has an open palm with their fingers spread away from each other.
 */
Pose.POSE_FINGERS_SPREAD = 4;

/**
 * User tapped their thumb and middle finger together twice in succession.
 */
Pose.POSE_DOUBLE_TAP = 5;