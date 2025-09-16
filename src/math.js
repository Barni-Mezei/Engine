/**
 * Dependencies: None
 */

function test2() {}

/**
 * @param {Number} min Lower bound of the interval
 * @param {Number} max Upper bound of the interval
 * @returns {Number} Returnds an INTEGER, between min and max, both end INCLUSIVE.
 */
function randInt(min, max) {
    return Math.floor( min + Math.random()*(max - min + 1) );
}

/**
 * @param {Number} min Lower bound of the interval
 * @param {Number} max Upper bound of the interval
 * @returns {Number} Returnds a FLOAT, between min and max, both end INCLUSIVE.
 */
function randFloat(min, max) {
    return min + Math.random()*(max - min);
}

/**
 * @attention The weights MUST add up to 1!
 * @param {Dictionary} weightSet {a: weightA, b: weightB, c: weightC}
 * @returns A value from the weightSet's keys.
 */
function weightedRandom(weightSet) {
    let sum = 0;
    let rnd = Math.random();

    for (let value in weightSet) {
        sum += weightSet[value];
        if (rnd <= sum) return parseInt(value);
    }

    return parseInt(Object.keys(weightSet)[0]); //Default to the first value
}

/**
 * Measures the distance between 2 points
 * @param {Number} x1 X Coordinate of the first point
 * @param {Number} y1 Y Coordinate of the first point
 * @param {Number} x2 X Coordinate of the second point
 * @param {Number} y2 Y Coordinate of the second point
 * @returns {Number} The distance between the 2 points
 */
function distance(x1,y1, x2,y2) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    return Math.sqrt(dx*dx + dy*dy);
}

/**
 * Constrins the given number in to a range.
 * @param {Number} value The value to constrain 
 * @param {Number} min Minimum allowed value
 * @param {Number} max Maximum allowed value
 * @returns {Number} The input number (value), but clipped if outside of the given range
 */
function clamp(value, min, max) {
    return Math.min(max, Math.max(value, min));
}

/**
 * Rounds the input number to the given decimal places (default 2, like 0.12)
 * @param {Number} value The number to be rounded
 * @param {Number} precision The precision in decimal places
 * @returns {Number} The input number rounded to given decimal places
 */
function round(value, precision = 2) {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
}

/**
 * Makes a number non-repeating, rounding it to the nearest non-repeating floating point value
 * @param {Number} value The number to be made non-repeating
 * @returns {Number} The input value, but as a non-repeating float
 */
function makeFinite(value) {
    return Math.fround(value);
}

/**
 * This function implements liear interpolation, between 2 numbers
 * @param {Number} baseValue The start value to start from
 * @param {Number} targetValue The target value to reach
 * @param {Number} amount The amount to go towards [targetValue]. This value must be in the range: [0, 1]
 * @returns 
 */
function lerp(baseValue, targetValue, amount = 0.9) {
    return baseValue + (targetValue - baseValue) * amount;
}

/**
 * Calcukates the sine of an angle in degrees
 * @param {Number} angle The angle in DEGREES 
 * @returns {Number} The sine of the angle
 */
function sin(angle) {
    return Math.sin(angle * Math.PI / 180);
}

/**
 * Calcukates the cosine of an angle in degrees
 * @param {Number} angle The angle in DEGREES 
 * @returns {Number} The cosine of the angle
 */
function cos(angle) {
    return Math.cos(angle * Math.PI / 180);
}

/**
 * Converts cartesian to polar coordinates
 * @param {Number} x The X component of a cartesian coordinate
 * @param {Number} y The Y component of a cartesian coordinate
 * @returns {Object} Returns an object with an angle and a length field. The angle is IN DEGREES `{angle: 45, length: 32}`
 */
function pol(x, y) {
    return {angle: Math.atan2(y, x) * (180 / Math.PI), length: distance(0,0, x, y)};
}

/**
 * Converts polar to cartesian coordinates
 * @param {Number} a The angle of the a polar coordinate
 * @param {Number} l The length of the a polar coordinate
 * @returns {Object} Returns an object with an x and a y field.`{x: 16, y: 24}`
 */
function rec(a, l) {
    return {x: cos(a) * l, y: sin(a) * l};
}