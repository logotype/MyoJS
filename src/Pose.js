var Pose = module.exports = function(data) {
    'use strict';
    var self = this;

    if (typeof data !== 'object' || Object.prototype.toString.call(data) === '[object Array]') {
        throw new Error('Constructor parameter needs to be an object');
    }

    /**
     * Indicates whether this is a valid Pose object.
     */
    self.valid = !data.hasOwnProperty('invalid');

    if (self.valid) {
        if (!data.hasOwnProperty('type') || data.type !== parseInt(data.type, 10)) {
            throw new Error('Pose type needs to be of type integer');
        }
    }

    /**
     * The pose being recognized.
     */
    self.type = data.type;

    /**
     * Rest pose.
     */
    self.POSE_REST = 0;

    /**
     * User is making a fist.
     */
    self.POSE_FIST = 1;

    /**
     * User has an open palm rotated towards the posterior of their wrist.
     */
    self.POSE_WAVE_IN = 2;

    /**
     * User has an open palm rotated towards the anterior of their wrist.
     */
    self.POSE_WAVE_OUT = 3;

    /**
     * User has an open palm with their fingers spread away from each other.
     */
    self.POSE_FINGERS_SPREAD = 4;

    /**
     * User tapped their thumb and middle finger together twice in succession.
     */
    self.DOUBLE_TAP = 5;
};

Pose.prototype.isEqualTo = function(other) {
    'use strict';
    var self = this;

    return self.type === other.type;
};

/**
 * An invalid Pose object.
 *
 * You can use this Pose instance in comparisons testing
 * whether a given Pose instance is valid or invalid.
 *
 */
Pose.invalid = function() {
    'use strict';
    return new Pose({
        invalid: true
    });
};

/**
 * Return a human-readable string representation of the pose.
 * @return
 *
 */
Pose.prototype.toString = function() {
    'use strict';
    var self = this;

    if (!self.valid) {
        return '[Pose invalid]';
    }
    switch (self.type) {
        case self.POSE_REST:
            return '[Pose type:' + self.type.toString() + ' POSE_REST]';
        case self.POSE_FIST:
            return '[Pose type:' + self.type.toString() + ' POSE_FIST]';
        case self.POSE_WAVE_IN:
            return '[Pose type:' + self.type.toString() + ' POSE_WAVE_IN]';
        case self.POSE_WAVE_OUT:
            return '[Pose type:' + self.type.toString() + ' POSE_WAVE_OUT]';
        case self.POSE_FINGERS_SPREAD:
            return '[Pose type:' + self.type.toString() + ' POSE_FINGERS_SPREAD]';
        case self.DOUBLE_TAP:
            return '[Pose type:' + self.type.toString() + ' DOUBLE_TAP]';
        default:
            return '[Pose type:' + self.type.toString() + ']';
    }
};
