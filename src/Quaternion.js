var Quaternion = module.exports = function(data) {
    /**
     * Indicates whether this is a valid Quaternion object.
     */
    this.valid = data.hasOwnProperty("invalid") ? false : true;

    if (this.valid) {
        this.x = data[0];
        this.y = data[1];
        this.z = data[2];
        this.w = data[3];
    } else {
        this.x = NaN;
        this.y = NaN;
        this.z = NaN;
        this.w = NaN;
    }
};

/**
 * A normalized copy of this quaternion.
 * A normalized quaternion has the same direction as the original
 * quaternion, but with a length of one.
 * @return A Quaternion object with a length of one, pointing in the same direction as this Quaternion object.
 *
 */
Quaternion.prototype.normalized = function() {
    var magnitude = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    return new Quaternion([
        this.x / magnitude,
        this.y / magnitude,
        this.z / magnitude,
        this.w / magnitude
    ]);
};

/**
 * A copy of this quaternion pointing in the opposite direction.
 *
 */
Quaternion.prototype.conjugate = function() {
    return new Quaternion([-this.x, -this.y, -this.z,
        this.w
    ]);
};

/**
 * Convert Quaternion to Euler angles.
 * @see http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToEuler/
 *
 */
Quaternion.prototype.toEuler = function() {
    var test, heading, attitude, bank, sqx, sqy, sqz, sqw, unit;

    sqw = this.w * this.w;
    sqx = this.x * this.x;
    sqy = this.y * this.y;
    sqz = this.z * this.z;
    unit = sqx + sqy + sqz + sqw; // if normalised is one, otherwise is correction factor
    test = this.x * this.y + this.z * this.w;
    if (test > 0.499 * unit) { // singularity at north pole
        heading = 2 * Math.atan2(this.x, this.w);
        attitude = Math.PI / 2;
        bank = 0;
        return;
    }
    if (test < -0.499 * unit) { // singularity at south pole
        heading = -2 * Math.atan2(this.x, this.w);
        attitude = -Math.PI / 2;
        bank = 0;
        return;
    }
    heading = Math.atan2(2 * this.y * this.w - 2 * this.x * this.z, sqx - sqy - sqz + sqw);
    attitude = Math.asin(2 * test / unit);
    bank = Math.atan2(2 * this.x * this.w - 2 * this.y * this.z, -sqx + sqy - sqz + sqw);

    /*
     * Heading = rotation about y axis
     * Attitude = rotation about z axis
     * Bank = rotation about x axis
     */
    return {
        heading: heading,
        attitude: attitude,
        bank: bank
    }
};

/**
 * Convert Quaternion to Euler angles (roll).
 *
 */
Quaternion.prototype.roll = function() {
    return Math.atan2(2 * this.y * this.w - 2 * this.x * this.z, 1 - 2 * this.y * this.y - 2 * this.z * this.z);
};

/**
 * Convert Quaternion to Euler angles (pitch).
 *
 */
Quaternion.prototype.pitch = function() {
    return Math.atan2(2 * this.x * this.w - 2 * this.y * this.z, 1 - 2 * this.x * this.x - 2 * this.z * this.z);
};

/**
 * Convert Quaternion to Euler angles (yaw).
 *
 */
Quaternion.prototype.yaw = function() {
    return Math.asin(2 * this.x * this.y + 2 * this.z * this.w);
};

/**
 * An invalid Quaternion object.
 *
 * You can use this Quaternion instance in comparisons testing
 * whether a given Quaternion instance is valid or invalid.
 *
 */
Quaternion.invalid = function() {
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
    if (!this.valid) {
        return "[Quaternion invalid]";
    }
    return "[Quaternion x:" + this.x + " y:" + this.y + " z:" + this.z + " w:" + this.w + "]";
};