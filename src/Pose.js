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
     * Default pose type when no pose is being made (PoseTypeNone)
     */
    this.POSE_REST = 0;

    /**
     * Clenching fingers together to make a fist (PoseTypeFist)
     */
    this.POSE_FIST = 1;

    /**
     * Turning your palm towards yourself (PoseTypeWaveIn)
     */
    this.POSE_WAVE_IN = 2;

    /**
     * Turning your palm away from yourself (PoseTypeWaveOut)
     */
    this.POSE_WAVE_OUT = 3;

    /**
     * Spreading your fingers and extending your palm (PoseTypeFingersSpread)
     */
    this.POSE_FINGERS_SPREAD = 4;

    /**
     * Thumb to pinky (unlock)
     */
    this.POSE_RESERVED_1 = 5;

    /**
     * Thumb to pinky (unlock)
     */
    this.POSE_THUMB_TO_PINKY = 6;
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
            return "[Pose type:" + this.type.toString() + " POSE_NONE]";
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
        case this.POSE_RESERVED_1:
            return "[Pose type:" + this.type.toString() + " POSE_RESERVED_1]";
            break;
        case this.POSE_THUMB_TO_PINKY:
            return "[Pose type:" + this.type.toString() + " POSE_THUMB_TO_PINKY]";
            break;
        default:
            break;
    }
    return "[Pose type:" + this.type.toString() + "]";
};