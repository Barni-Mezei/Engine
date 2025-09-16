/**
 * Dependencies: vector
 */


/**
 * An object containing ALL of the unique PID instances.
 */
const _pidData = {};

/**
 * Clears the pid cache. **DELETES ALL OF THE DATA!**
 */
function resetPid() {
    _pidData = {};
}

function clearPid(id = "0000") {
    if (id in _pidData) delete _pidData[id];
}

/**
 * A PID controller.
 * @param {String} id The measurement id. (must be unique in every call!)
 * @param {Number} target The target value to be reached
 * @param {Number} current The current value
 * @param {Number} P (0-1) Proportional (responsiveness)
 * @param {Number} I Integral (error correction over time)
 * @param {Number} D Derivative (damping)
 * @returns {Number} The new velocity
 */
function pid(id = "0000", target, current, P, I, D) {
    if (!(id in _pidData)) {
        _pidData[id] = {
            error: 0,
            errorSum: 0,
            errorRate: 0,
            lastError: 0,
        };
    }

    _pidData[id].error = target - current;
    _pidData[id].errorSum += _pidData[id].error;
    _pidData[id].errorRate = _pidData[id].error - _pidData[id].lastError;
    _pidData[id].lastError = _pidData[id].error;

    return P*_pidData[id].error + I*_pidData[id].errorSum + D*_pidData[id].errorRate;
}

/**
 * Applies the pid() function to both X and Y coordinates of a point separately, but with the same settings.
 * @param {String} id The measurement id. (must be unique in every call!)
 * @param {Vector} targetPoint The target coordinate value to be reached
 * @param {Vector} currentPoint The point's current coordinate
 * @param {Number} P (0-1) Proportional (responsiveness)
 * @param {Number} I Integral (error correction over time)
 * @param {Number} D Derivative (damping)
 * @returns {Vector} The new velocity
 */
function pidPoint(id, targetPoint, currentPoint, P,I,D) {
    return new Vector(
        pid(id+"px", targetPoint.x, currentPoint.x, P,I,D),
        pid(id+"py", targetPoint.y, currentPoint.y, P,I,D),
    );
}