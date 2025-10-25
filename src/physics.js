/**
 * Dependencies: objects, vector, math, camera
 */

/**
 * @abstract
 * Implements a basic collider shape outline
 */
class Collider extends PhysicsObject2D {
    /**
     * Offset from the parent object
     */
    offset = new Vector();

    /**
     * @param {Vector} position The origin of this shape
     * @param {Vector} size Width and height of the shape's bounding box
     * @param {Vector} offset The offset of the shape, from its parent
     */
    constructor(position, size, offset = new Vector()) {
        super(position, size);

        this.offset = offset;
    }

    /**
     * Sets the colliders position, with the applied offset
     * @param {Vector} position The position to set the collider to
     */
    setPos(position) {
        this.pos = position.add(this.offset);
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
    closestPointOnEdge(point) {}

    /**
     * @abstract
     * @param {Vector} point Point to calculate the closest point to
     * @returns {Vector} The point in the shape (the edge is excluded), which is closest to the specified point
     */
    closestPoint(point) {}
}

/**
 * A simple axis aligned bounding box collider shape
 */
class ColliderAABB extends Collider {
    /**
     * @param {Vector} position The origin of this shape
     * @param {Vector} size Width and height of the shape's bounding box
     * @param {Vector} offset The offset of the shape, from its parent
     */
    constructor(position, size, offset) {
        super(position, size, offset);
    }

    /**
     * Checks if the specified point is inside of the shape or not. The edge of the shape is considered as colliding
     * @param {Vector} point Point to test for collision
     * @returns {Boolean} Is the point inside of the shape?
     */
    isColliding(point) {
        return (
            point.x >= this.left &&
            point.x <= this.right &&

            point.y >= this.top &&
            point.y <= this.bottom
        )
    }

    /**
     * Returns with a vector, which when added to the point will result in the point being outside of the shape
     * (The vector needed for resolving the collision)
     * @param {Vector} point Point to calculate the resolution vector from. Must be inside of the shape!
     * @returns {Vector} The vector whic will resolve the collision
     */
    resolutionVector(point) {
        let distances = [
            point.y - this.top,
            this.right - point.x,
            this.bottom - point.y,
            point.x - this.left,
        ];

        let closestSide = distances.indexOf(Math.min(...distances));

        switch (closestSide) {
            default:
            case 0: return new Vector(0, -distances[0]); // Top
            case 1: return new Vector(distances[1], 0); // Right
            case 2: return new Vector(0, distances[2]); // Bottom;
            case 3: return new Vector(-distances[3], 0); // Left
        }
    }

    /**
     * Returns with the coordinate of the closest point on the edge of the shape
     * @param {Vector} point Point to calculate the closest point to
     * @returns {Vector} The point on the edge
     */
    closestPointOnEdge(point) {
        if (this.isColliding(point)) {
            return point.add(this.resolutionVector(point));
        } else {
            return this.closestPoint(point);
        }
    }

    /**
     * Restuns with the coordinate of the closest point inside of the shape (edges included)
     * @param {Vector} point Point to calculate the closest point to
     * @returns {Vector} The closest point in the shape
     */
    closestPoint(point) {
        return new Vector(
            Math.min(Math.max(point.x, this.left), this.right),
            Math.min(Math.max(point.y, this.top), this.bottom),
        );
    }

    render() {
        ctx.strokeStyle = "hsla(189, 88%, 34%, 0.75)";
        ctx.fillStyle = "hsla(189, 88%, 32%, 0.5)";
        ctx.lineWidth = camera.w2csX(2);
        ctx.lineJoin = "box";

        ctx.beginPath();
        ctx.rect(...camera.w2cf(this.pos, this.size));
        ctx.stroke();
        ctx.fill();
    }
}


/**
 * A simple circle collider shape
 */
class ColliderCircle extends Collider {

    #rad = 0;

    get radius() {
        return this.#rad;
    }

    set radius(value) {
        this.#rad = value;
    }

    get left() {
        return this.pos.x - this.#rad;
    }

    get right() {
        return this.pos.x + this.#rad;
    }

    get top() {
        return this.pos.y - this.#rad;
    }

    get bottom() {
        return this.pos.y + this.#rad;
    }

    /**
     * @param {Vector} position The origin of this shape (center of the circle)
     * @param {Number} radius The radius of the circle
     * @param {Vector} offset The offset of the shape, from its parent
     */
    constructor(position, radius, offset) {
        super(position, new Vector(radius * 2), offset);

        this.#rad = radius;
    }

    /**
     * Checks if the specified point is inside of the shape or not. The edge of the shape is considered as colliding
     * @param {Vector} point Point to test for collision
     * @returns {Boolean} Is the point inside of the shape?
     */
    isColliding(point) {
        return distance(this.pos.x, this.pos.y, point.x, point.y) <= this.#rad;
    }

    /**
     * Returns with a vector, which when added to the point will result in the point being outside of the shape
     * (The vector needed for resolving the collision)
     * @param {Vector} point Point to calculate the resolution vector from. Must be inside of the shape!
     * @returns {Vector} The vector whic will resolve the collision
     */
    resolutionVector(point) {
        let diff = point.sub(this.pos);
        return diff.unit(this.#rad - diff.length);
    }

    /**
     * Returns with the coordinate of the closest point on the edge of the shape
     * @param {Vector} point Point to calculate the closest point to
     * @returns {Vector} The point on the edge
     */
    closestPointOnEdge(point) {
        let diff = point.sub(this.pos);
        return this.pos.add(diff.unit(this.#rad));
    }

    /**
     * Restuns with the coordinate of the closest point inside of the shape (edges included)
     * @param {Vector} point Point to calculate the closest point to
     * @returns {Vector} The closest point in the shape
     */
    closestPoint(point) {
        let diff = point.sub(this.pos);
        return this.pos.add(diff.unit(Math.min(this.#rad, diff.length)));
    }

    render() {
        ctx.strokeStyle = "hsla(189, 88%, 34%, 0.75)";
        ctx.fillStyle = "hsla(189, 88%, 32%, 0.5)";
        ctx.lineWidth = camera.w2csX(2);
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.arc(...camera.w2c(this.pos).toArray(), camera.w2csX(this.#rad), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
    }
}