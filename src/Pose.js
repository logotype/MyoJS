var Pose = module.exports = function (data) {
    /**
     * Indicates whether this is a valid Pose object.
     */
    this.valid = data.hasOwnProperty("invalid") ? false : true;

    /**
     * The pose being recognized.
     */
    this.type = data.type;

    /**
     * Rest pose.
     */
    this.POSE_REST = 0;

    /**
     * User is making a fist.
     */
    this.POSE_FIST = 1;

    /**
     * User has an open palm rotated towards the posterior of their wrist.
     */
    this.POSE_WAVE_IN = 2;

    /**
     * User has an open palm rotated towards the anterior of their wrist.
     */
    this.POSE_WAVE_OUT = 3;

    /**
     * User has an open palm with their fingers spread away from each other.
     */
    this.POSE_FINGERS_SPREAD = 4;

    /**
     * User tapped their thumb and middle finger together twice in succession.
     */
    this.DOUBLE_TAP = 5;
};

Pose.prototype.isEqualTo = function (other) {
    return this.type == other.type;
};

/**
 * An invalid Pose object.
 *
 * You can use this Pose instance in comparisons testing
 * whether a given Pose instance is valid or invalid.
 *
 */
Pose.invalid = function() {
    return new Pose({ invalid: true, type: 65536 });
};

/**
 * Return a human-readable string representation of the pose.
 * @return
 *
 */
Pose.prototype.toString = function () {
    if(!this.valid) {
        return "[Pose invalid]";
    }
    switch (this.type) {
        case this.POSE_REST:
            return "[Pose type:" + this.type.toString() + " POSE_REST]";
            break;
        case this.POSE_FIST:
            return "[Pose type:" + this.type.toString() + " POSE_FIST]";
            break;
        case this.POSE_WAVE_IN:
            return "[Pose type:" + this.type.toString() + " POSE_WAVE_IN]";
            break;
        case this.POSE_WAVE_OUT:
            return "[Pose type:" + this.type.toString() + " POSE_WAVE_OUT]";
            break;
        case this.POSE_FINGERS_SPREAD:
            return "[Pose type:" + this.type.toString() + " POSE_FINGERS_SPREAD]";
            break;
        case this.DOUBLE_TAP:
            return "[Pose type:" + this.type.toString() + " DOUBLE_TAP]";
            break;
        default:
            break;
    }
    return "[Pose type:" + this.type.toString() + "]";
};