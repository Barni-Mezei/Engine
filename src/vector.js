/**
 * Dependencies: math
 */

class Vector {
    x = 0;
    y = 0;

    /**
     * The magnitude of the vector
     * @returns {Number}
     */
    get length() {
        if (this.x == 0 && this.y == 0) return 0;
        return Math.sqrt(this.x**2 + this.y**2);
    }

    /**
     * Returns the angle of the vector in DEGREES
     * @returns {Number}
     */
    get angle() {
        return (Math.atan2(this.y, this.x) * 180) / Math.PI;
    }

    /**
     * If no values present it defaults to (0, 0)
     * If one value is present it will be: (a, a)
     * If two values present then it will be: (a, b)
     * @param {Number} x X length of the vector
     * @param {Number} y Y length of the vector
     */
    constructor(x, y) {
        if (x == undefined) {
            this.x = 0;
            this.y = 0;
        } else {
            this.x = x;
            if (y == undefined) this.y = x;
            else this.y = y;
        }
    }

    /**
     * Creates a NEW VECTOR from an existing, non-Vector object (if the object has 2 keys) 
     * @param {Object} o Any object with an "x" and a "y" key.
     */
    static fromObject(o) {
        return new Vector(o.x, o.y);
    }

    /**
     * Creates a NEW VECTOR from an existing, non-Vector object (an array, 0: x, 1: y) 
     * @param {Array<Number>} a An array with min. 2 items.
     */
    static fromArray(a) {
        return new Vector(a[0], a[1]);
    }

    /**
     * Creates a new unit vector pointing in the specified direction
     * @param {Number} angle Direction of the vector in DEGREES (The 0°-> is to the right, and increases CW)
     * @param {Number} length Length of the vector
     * @returns {Vector}
     */
    static fromAngle(angle, length) {
        return new Vector(cos(angle), sin(angle)).mult(length);
    }

    /**
     * Calculates the dot product of 2 vectors
     * @param {Vector} v1 
     * @param {Vector} v2 
     * @returns {Number} The dot product of the 2 vectors
     */
    static dot(v1, v2) {
        return v1.x*v2.x + v1.y*v2.y;
    }

    /**
     * Calculates the cross product of 2 vectors
     * @param {Vector} v1 
     * @param {Vector} v2 
     * @returns {Number} The cross product of the 2 vectors
     */
    static cross(v1, v2) {
        return v1.x*v2.y - v1.y*v2.x;
    }

    /**
     * Linearly interpolates between v1 and v2
     * @param {Vector} v1 Base vector
     * @param {Vector} v2 Target vector
     * @param {Number} amount The amount to match v2. This value must be in the range: [0, 1]
     * @returns {Vector}
     */
    static lerp(v1, v2, amount = 0.9) {
        return new Vector(lerp(v1.x, v2.x, amount), lerp(v1.y, v2.y, amount));
    }

    /**
     * Converts the vector to an array, with the following form: [x, y]
     * @returns {Array}
     */
    toArray() {
        return [this.x, this.y];
    }

    /**
     * Converts the vector to an object, with the following form: {x, y}
     * @returns {Object}
     */
    toObject() {
        return {x: this.x, y: this.y};
    }

    /**
     * Draws the vector from the given coordinate, with the given scale and color
     * @param {Number} x The X coordinate
     * @param {Number} y The Y coordinate
     * @param {Number} scale Scale of the vector
     * @param {String} color Color of the vector
     */
    render(x, y, scale = 1, color = "#00ffff") {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + this.x*scale, y + this.y*scale);
        ctx.stroke();
    }

    /**
     * Checks if v2's components are equal with this vector
     * @param {Vector|Number} v2 Another vector
     * @param {Number} y When setm the function expects 2 nuumbers as X and Y coordinates
     * @returns {Boolean} Are the component values the same?
     */
    isEqual(v2, y = null) {
        return y == null ? (this.x == v2.x && this.y == v2.y) : (this.x == v2 && this.y == y)
    }

    /**
     * Returns true if at least one of the vector's components are null or NaN or undefined
     * @returns {Boolean} Is this vector null?
     */
    isNull() {
        return this.x === null || this.y === null || this.x === NaN || this.y === NaN || this.x === undefined || this.y === undefined;
    }

    /**
     * Returns a copy of the vector
     * @returns {Vector} Returns a NEW VECTOR
     */
    copy() {
        return new Vector(this.x, this.y);
    }

    /**
     * Makes the vector [n] units long (default is 1)
     * @param {Number} n Scale of the unit vector
     * @returns {Vector} Returns a NEW VECTOR
     */
    unit(n = 1) {
        if (n == 0) return new Vector();
        return new Vector(this.x == 0 ? 0 : (this.x / this.length)*n, this.y == 0 ? 0 : (this.y / this.length)*n);
    }

    /**
     * Gets the normal vector, perpendicular to this vector, and scales it to [n] length
     * @param {Number} n 
     * @returns {Vector} Returns a NEW VECTOR
     */
    normal(n = 1) {
        return new Vector(-this.y, this.x).unit(n);
    }

    /**
     * Multiplies the vector's values by [n] (both, x and y) OR multiplies the x values to gether and the Y values together
     * @param {Number|Vector} n A scalar number or a Vector
     * @returns {Vector} Returns a NEW VECTOR
     */
    mult(n) {
        if (n instanceof Vector) {
            return new Vector(this.x * n.x, this.y * n.y);
        } else {
            return new Vector(this.x * n, this.y * n);
        }
    }

    /**
     * Adds v2 to this vector and returns the result
     * @param {Vector} v2 Another vector 
     * @returns {Vector} Returns a NEW VECTOR
     */
    add(v2) {
        return new Vector(this.x + v2.x, this.y + v2.y);
    }

    /**
     * Subtracts v2 from this vector and returns the result
     * @param {Vector} v2 Another vector 
     * @returns {Vector} Returns a NEW VECTOR
     */
    sub(v2) {
        return new Vector(this.x - v2.x, this.y - v2.y);
    }

    /**
     * Rounds both of the vector's components, and returns a new vector.
     * @param {Number} n The number of decimal places (0: 5, 1: 5.1, 2: 5.12)
     * @returns {Vector} Returns a NEW VECTOR
     */
    round(n = 0) {
        return new Vector(round(this.x, n), round(this.y, n));
    }
}