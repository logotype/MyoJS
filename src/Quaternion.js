var Quaternion = module.exports = function(data) {
    'use strict';
    var self = this;

    /**
     * Indicates whether this is a valid Quaternion object.
     */
    self.valid = !data.hasOwnProperty('invalid');

    if (self.valid) {
        if (Object.prototype.toString.call(data) !== '[object Array]') {
            throw new Error('Components needs to be an array');
        }
        if (isNaN(data[0]) || isNaN(data[1]) || isNaN(data[2]) || isNaN(data[3])) {
            throw new Error('Component values needs to be integers or numbers');
        }
        self.x = data[0];
        self.y = data[1];
        self.z = data[2];
        self.w = data[3];
    } else {
        self.x = NaN;
        self.y = NaN;
        self.z = NaN;
        self.w = NaN;
    }
};

/**
 * A normalized copy of this quaternion.
 * A normalized quaternion has the same direction as the original
 * quaternion, but with a length of one.
 * @return {Quaternion} A Quaternion object with a length of one, pointing in the same direction as this Quaternion object.
 *
 */
Quaternion.prototype.normalized = function() {
    'use strict';
    var self = this,
        magnitude = Math.sqrt(self.x * self.x + self.y * self.y + self.z * self.z + self.w * self.w);

    return new Quaternion([
        self.x / magnitude,
        self.y / magnitude,
        self.z / magnitude,
        self.w / magnitude
    ]);
};

/**
 * A copy of this quaternion pointing in the opposite direction.
 *
 */
Quaternion.prototype.conjugate = function() {
    'use strict';
    var self = this;

    return new Quaternion([-self.x, -self.y, -self.z,
        self.w
    ]);
};

/**
 * Convert Quaternion to Euler angles.
 * @see http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToEuler/
 *
 */
Quaternion.prototype.toEuler = function() {
    'use strict';
    var self = this,
        test, heading, attitude, bank, sqx, sqy, sqz, sqw, unit;

    sqw = self.w * self.w;
    sqx = self.x * self.x;
    sqy = self.y * self.y;
    sqz = self.z * self.z;
    unit = sqx + sqy + sqz + sqw; // If normalised is one, otherwise is correction factor
    test = self.x * self.y + self.z * self.w;
    if (test > 0.499 * unit /* Singularity at north pole */ ) {
        heading = 2 * Math.atan2(self.x, self.w);
        attitude = Math.PI / 2;
        bank = 0;
        return;
    } else if (test < -0.499 * unit /* Singularity at south pole */ ) {
        heading = -2 * Math.atan2(self.x, self.w);
        attitude = -Math.PI / 2;
        bank = 0;
        return;
    } else {
        heading = Math.atan2(2 * self.y * self.w - 2 * self.x * self.z, sqx - sqy - sqz + sqw);
        attitude = Math.asin(2 * test / unit);
        bank = Math.atan2(2 * self.x * self.w - 2 * self.y * self.z, -sqx + sqy - sqz + sqw);
    }

    return {
        heading: heading, // Heading = rotation about y axis
        attitude: attitude, // Attitude = rotation about z axis
        bank: bank // Bank = rotation about x axis
    };
};

/**
 * Convert Quaternion to Euler angles (roll).
 *
 */
Quaternion.prototype.roll = function() {
    'use strict';
    var self = this;

    return Math.atan2(2 * self.y * self.w - 2 * self.x * self.z, 1 - 2 * self.y * self.y - 2 * self.z * self.z);
};

/**
 * Convert Quaternion to Euler angles (pitch).
 *
 */
Quaternion.prototype.pitch = function() {
    'use strict';
    var self = this;

    return Math.atan2(2 * self.x * self.w - 2 * self.y * self.z, 1 - 2 * self.x * self.x - 2 * self.z * self.z);
};

/**
 * Convert Quaternion to Euler angles (yaw).
 *
 */
Quaternion.prototype.yaw = function() {
    'use strict';
    var self = this;

    return Math.asin(2 * self.x * self.y + 2 * self.z * self.w);
};

/**
 * An invalid Quaternion object.
 *
 * You can use this Quaternion instance in comparisons testing
 * whether a given Quaternion instance is valid or invalid.
 *
 */
Quaternion.invalid = function() {
    'use strict';
    return new Quaternion({
        invalid: true
    });
};

/**
 * Returns a string containing this quaternion in a human readable format: (x, y, z, w).
 * @return
 *
 */
Quaternion.prototype.toString = function() {
    'use strict';
    var self = this;

    if (!self.valid) {
        return '[Quaternion invalid]';
    }
    return '[Quaternion x:' + self.x + ' y:' + self.y + ' z:' + self.z + ' w:' + self.w + ']';
};
