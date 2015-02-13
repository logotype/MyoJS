var Quaternion = module.exports = function (data) {
    /**
     * Indicates whether this is a valid Quaternion object.
     */
    this.valid = data.hasOwnProperty("invalid") ? false : true;

    if(this.valid) {
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

Quaternion.prototype.normalized = function () {
    var magnitude = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    return new Quaternion([
        this.x / magnitude,
        this.y / magnitude,
        this.z / magnitude,
        this.w / magnitude
    ]);
};

Quaternion.prototype.conjugate = function () {
    return new Quaternion([
        -this.x,
        -this.y,
        -this.z,
        this.w
    ]);
};

Quaternion.prototype.roll = function (rotation) {
    return Math.atan2(2 * rotation.y * rotation.w - 2 * rotation.x * rotation.z, 1 - 2 * rotation.y * rotation.y - 2 * rotation.z * rotation.z);
};

Quaternion.prototype.pitch = function (rotation) {
    return Math.atan2(2 * rotation.x * rotation.w - 2 * rotation.y * rotation.z, 1 - 2 * rotation.x * rotation.x - 2 * rotation.z * rotation.z);
};

Quaternion.prototype.yaw = function (rotation) {
    return Math.asin(2 * rotation.x * rotation.y + 2 * rotation.z * rotation.w);
};

/**
 * An invalid Quaternion object.
 *
 * You can use this Quaternion instance in comparisons testing
 * whether a given Quaternion instance is valid or invalid.
 *
 */
Quaternion.invalid = function() {
    return new Quaternion({ invalid: true });
};

/**
 * Returns a string containing this quaternion in a human readable format: (x, y, z, w).
 * @return
 *
 */
Quaternion.prototype.toString = function () {
    if(!this.valid) {
        return "[Quaternion invalid]";
    }
    return "[Quaternion x:" + this.x + " y:" + this.y + " z:" + this.z + " w:" + this.w + "]";
};