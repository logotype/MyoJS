var Vector3 = module.exports = function (data) {

    if(!data) {
        throw new Error("Missing constructor arguments");
    }
    if(typeof data !== "object") {
        throw new Error("Constructor parameter needs to be an object");
    }

    /**
     * Indicates whether this is a valid Vector3 object.
     */
    this.valid = data.hasOwnProperty("invalid") ? false : true;

    if(this.valid) {
        if(!data || Object.prototype.toString.call(data) !== '[object Array]') {
            throw new Error("Components needs to be an array");
        }
        if(isNaN(data[0]) || isNaN(data[1]) || isNaN(data[2])) {
            throw new Error("Component values needs to be integers or numbers");
        }
        this.x = data[0];
        this.y = data[1];
        this.z = data[2];
    } else {
        this.x = NaN;
        this.y = NaN;
        this.z = NaN;
    }
};

/**
 * A copy of this vector pointing in the opposite direction.
 * @return A Vector3 object with all components negated.
 *
 */
Vector3.prototype.opposite = function () {
    return new Vector3([
        -this.x,
        -this.y,
        -this.z
    ]);
};

/**
 * Add vectors component-wise.
 * @param other
 * @return
 *
 */
Vector3.prototype.plus = function (other) {
    return new Vector3([
        this.x + other.x,
        this.y + other.y,
        this.z + other.z
    ]);
};

/**
 * Add vectors component-wise and assign the value.
 * @param other
 * @return This Vector3.
 *
 */
Vector3.prototype.plusAssign = function (other) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;
    return this;
};

/**
 * A copy of this vector pointing in the opposite direction (conjugate).
 * @param other
 * @return
 *
 */
Vector3.prototype.minus = function (other) {
    return new Vector3([
        this.x - other.x,
        this.y - other.y,
        this.z - other.z
    ]);
};

/**
 * A copy of this vector pointing in the opposite direction and assign the value.
 * @param other
 * @return This Vector3.
 *
 */
Vector3.prototype.minusAssign = function (other) {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;
    return this;
};

/**
 * Multiply vector by a scalar.
 * @param scalar
 * @return
 *
 */
Vector3.prototype.multiply = function (scalar) {
    return new Vector3([
        this.x * scalar,
        this.y * scalar,
        this.z * scalar
    ]);
};

/**
 * Multiply vector by a scalar and assign the quotient.
 * @param scalar
 * @return This Vector3.
 *
 */
Vector3.prototype.multiplyAssign = function (scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
};

/**
 * Divide vector by a scalar.
 * @param scalar
 * @return
 *
 */
Vector3.prototype.divide = function (scalar) {
    return new Vector3([
        this.x / scalar,
        this.y / scalar,
        this.z / scalar
    ]);
};

/**
 * Divide vector by a scalar and assign the value.
 * @param scalar
 * @return This Vector3.
 *
 */
Vector3.prototype.divideAssign = function (scalar) {
    this.x /= scalar;
    this.y /= scalar;
    this.z /= scalar;
    return this;
};

/**
 * Compare Vector equality/inequality component-wise.
 * @param other The Vector3 to compare with.
 * @return True; if equal, False otherwise.
 *
 */
Vector3.prototype.isEqualTo = function (other) {
    if (this.x != other.x || this.y != other.y || this.z != other.z)
        return false;
    else
        return true;
};

/**
 * The angle between this vector and the specified vector in radians.
 *
 * <p>The angle is measured in the plane formed by the two vectors.
 * The angle returned is always the smaller of the two conjugate angles.
 * Thus <code>A.angleTo(B) == B.angleTo(A)</code> and is always a positive value less
 * than or equal to pi radians (180 degrees).</p>
 *
 * <p>If either vector has zero length, then this function returns zero.</p>
 *
 * @param other A Vector object.
 * @return The angle between this vector and the specified vector in radians.
 *
 */
Vector3.prototype.angleTo = function (other) {
    var denom = this.magnitudeSquared() * other.magnitudeSquared();
    if (denom <= 0)
        return 0;

    return Math.acos(this.dot(other) / Math.sqrt(denom));
};

/**
 * The cross product of this vector and the specified vector.
 *
 * The cross product is a vector orthogonal to both original vectors.
 * It has a magnitude equal to the area of a parallelogram having the
 * two vectors as sides. The direction of the returned vector is
 * determined by the right-hand rule. Thus <code>A.cross(B) == -B.cross(A)</code>.
 *
 * @param other A Vector object.
 * @return The cross product of this vector and the specified vector.
 *
 */
Vector3.prototype.cross = function (other) {
    return new Vector3([
        (this.y * other.z) - (this.z * other.y),
        (this.z * other.x) - (this.x * other.z),
        (this.x * other.y) - (this.y * other.x)
    ]);
};

/**
 * The distance between the point represented by this Vector
 * object and a point represented by the specified Vector object.
 *
 * @param other A Vector object.
 * @return The distance from this point to the specified point.
 *
 */
Vector3.prototype.distanceTo = function (other) {
    return Math.sqrt((this.x - other.x) * (this.x - other.x) + (this.y - other.y) * (this.y - other.y) + (this.z - other.z) * (this.z - other.z));
};

/**
 * The dot product of this vector with another vector.
 * The dot product is the magnitude of the projection of this vector
 * onto the specified vector.
 *
 * @param other A Vector object.
 * @return The dot product of this vector and the specified vector.
 *
 */
Vector3.prototype.dot = function (other) {
    return (this.x * other.x) + (this.y * other.y) + (this.z * other.z);
};

/**
 * Returns true if all of the vector's components are finite.
 * @return If any component is NaN or infinite, then this returns false.
 *
 */
Vector3.prototype.isValid = function () {
    return (this.x <= Number.MAX_VALUE && this.x >= -Number.MAX_VALUE) && (this.y <= Number.MAX_VALUE && this.y >= -Number.MAX_VALUE) && (this.z <= Number.MAX_VALUE && this.z >= -Number.MAX_VALUE);
};

/**
 * The magnitude, or length, of this vector.
 * The magnitude is the L2 norm, or Euclidean distance between the
 * origin and the point represented by the (x, y, z) components
 * of this Vector object.
 *
 * @return The length of this vector.
 *
 */
Vector3.prototype.magnitude = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

/**
 * The square of the magnitude, or length, of this vector.
 * @return The square of the length of this vector.
 *
 */
Vector3.prototype.magnitudeSquared = function () {
    return this.x * this.x + this.y * this.y + this.z * this.z;
};

/**
 * A normalized copy of this vector.
 * A normalized vector has the same direction as the original
 * vector, but with a length of one.
 * @return A Vector object with a length of one, pointing in the same direction as this Vector object.
 *
 */
Vector3.prototype.normalized = function () {
    var denom = this.magnitudeSquared();
    if (denom <= 0)
        return new Vector3([
            0,
            0,
            0
        ]);

    denom = 1 / Math.sqrt(denom);
    return new Vector3([
        this.x * denom,
        this.y * denom,
        this.z * denom
    ]);
};

/**
 * The pitch angle in radians.
 * Pitch is the angle between the negative z-axis and the projection
 * of the vector onto the y-z plane. In other words, pitch represents
 * rotation around the x-axis. If the vector points upward, the
 * returned angle is between 0 and pi radians (180 degrees); if it
 * points downward, the angle is between 0 and -pi radians.
 *
 * @return The angle of this vector above or below the horizon (x-z plane).
 *
 */
Vector3.prototype.pitch = function () {
    return Math.atan2(this.y, -this.z);
};

/**
 * The yaw angle in radians.
 * Yaw is the angle between the negative z-axis and the projection
 * of the vector onto the x-z plane. In other words, yaw represents
 * rotation around the y-axis. If the vector points to the right of
 * the negative z-axis, then the returned angle is between 0 and pi
 * radians (180 degrees); if it points to the left, the angle is
 * between 0 and -pi radians.
 *
 * @return The angle of this vector to the right or left of the negative z-axis.
 *
 */
Vector3.prototype.yaw = function () {
    return Math.atan2(this.x, -this.z);
};

/**
 * The roll angle in radians.
 * Roll is the angle between the y-axis and the projection of the vector
 * onto the x-y plane. In other words, roll represents rotation around
 * the z-axis. If the vector points to the left of the y-axis, then the
 * returned angle is between 0 and pi radians (180 degrees); if it
 * points to the right, the angle is between 0 and -pi radians.
 *
 * Use this function to get roll angle of the plane to which this vector
 * is a normal. For example, if this vector represents the normal to
 * the palm, then this function returns the tilt or roll of the palm
 * plane compared to the horizontal (x-z) plane.
 *
 * @return The angle of this vector to the right or left of the y-axis.
 *
 */
Vector3.prototype.roll = function () {
    return Math.atan2(this.x, -this.y);
};

/**
 * The zero vector: (0, 0, 0)
 * @return
 *
 */
Vector3.prototype.zero = function () {
    return new Vector3([
        0,
        0,
        0
    ]);
};

/**
 * The x-axis unit vector: (1, 0, 0)
 * @return
 *
 */
Vector3.prototype.xAxis = function () {
    return new Vector3([
        1,
        0,
        0
    ]);
};

/**
 * The y-axis unit vector: (0, 1, 0)
 * @return
 *
 */
Vector3.prototype.yAxis = function () {
    return new Vector3([
        0,
        1,
        0
    ]);
};

/**
 * The z-axis unit vector: (0, 0, 1)
 * @return
 *
 */
Vector3.prototype.zAxis = function () {
    return new Vector3([
        0,
        0,
        1
    ]);
};

/**
 * The unit vector pointing left along the negative x-axis: (-1, 0, 0)
 * @return
 *
 */
Vector3.prototype.left = function () {
    return new Vector3([
        -1,
        0,
        0
    ]);
};

/**
 * The unit vector pointing right along the positive x-axis: (1, 0, 0)
 * @return
 *
 */
Vector3.prototype.right = function () {
    return this.xAxis();
};

/**
 * The unit vector pointing down along the negative y-axis: (0, -1, 0)
 * @return
 *
 */
Vector3.prototype.down = function () {
    return new Vector3([
        0,
        -1,
        0
    ]);
};

/**
 * The unit vector pointing up along the positive x-axis: (0, 1, 0)
 * @return
 *
 */
Vector3.prototype.up = function () {
    return this.yAxis();
};

/**
 * The unit vector pointing forward along the negative z-axis: (0, 0, -1)
 * @return
 *
 */
Vector3.prototype.forward = function () {
    return new Vector3([
        0,
        0,
        -1
    ]);
};

/**
 * The unit vector pointing backward along the positive z-axis: (0, 0, 1)
 * @return
 *
 */
Vector3.prototype.backward = function () {
    return this.zAxis();
};

/**
 * An invalid Vector3 object.
 *
 * You can use this Vector3 instance in comparisons testing
 * whether a given Vector3 instance is valid or invalid.
 *
 */
Vector3.invalid = function() {
    return new Vector3({ invalid: true });
};

/**
 * Returns a string containing this vector in a human readable format: (x, y, z).
 * @return
 *
 */
Vector3.prototype.toString = function () {
    if(!this.valid) {
        return "[Vector3 invalid]";
    }
    return "[Vector3 x:" + this.x + " y:" + this.y + " z:" + this.z + "]";
};