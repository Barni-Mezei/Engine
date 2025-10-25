/**
 * Dependencies: objects, math, vector
 */

/**
 * @abstract
 * Implements a basic collider shape outline
 */
class Collider extends PhysicsObject2D {
    /**
     * @param {Vector} position The origin of this shape
     * @param {Vector} size Width and height of the shape's bounding box
     */
    constructor(position, size) {
        super(position, size);
    }

    /**
     * @abstract
     * @param {Vector} point Point to test for collision with this shape
     * @returns {Boolean} Is the point inside of the shape?
     */
    isColliding(point) {}

    /**
     * @abstract
     * @param {Vector} point Point to test for collision with this shape and calculate resolution vector from
     * @returns {Vector} An ofset, which when applied to the point will result in the point being outside of the shape
     */
    resolutionVector(point) {}

    /**
     * @abstract
     * @param {Vector} point Point to calculate the closest point to
     * @returns {Vector} The point on the edge of the shape, which is closest to the specified point
     */
    closestSurfacePoint(point) {}
}

class ColliderAABB extends Collider {
        /**
     * @param {Vector} position The origin of this shape
     * @param {Vector} size Width and height of the shape's bounding box
     */
    constructor(position, size) {
        super(position, size);
    }
}