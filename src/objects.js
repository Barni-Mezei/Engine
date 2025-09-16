/**
 * Dependencies: vector
 */

class BaseResource {
    resourceId = "";
    uid = "";

    disabled = false;

    constructor(resourceId) {
        this.resourceId = resourceId;
        this.uid = Resource.generateResourceUID(resourceId);
    }

    update() {}

    render() {}

    destroy() {
        this.disabled = true;
    }
}

class Object2D {
    pos = new Vector();
    size = new Vector();

    disabled = false;

    constructor(position = new Vector(0, 0), size = new Vector(1, 1)) {
        this.pos = position;
        this.size = size;
    }

    /**
     * Sets the position of the object in a way, so the center is at the specified coordinate
     * @param {Vector} position The coordinate of the objects center
     */
    setCenter(position) {
        this.pos = position.sub(this.centerOffset);
    }

    /**
     * Returns with the X coordinate of the left edge of the object
     */
    get left() {
        return Math.min(this.pos.x, this.pos.x + this.size.x);
    }

    /**
     * Returns with the X coordinate of the right edge of the object
     */
    get right() {
        return Math.max(this.pos.x, this.pos.x + this.size.x);
    }

    /**
     * Returns with the Y coordinate of the top edge of the object
     */
    get top() {
        return Math.min(this.pos.y, this.pos.y + this.size.y);
    }

    /**
     * Returns with the Y coordinate of the bottom edge of the object
     */
    get bottom() {
        return Math.max(this.pos.y, this.pos.y + this.size.y);
    }

    /**
     * Returns with the coordinates of the center of the object
     */
    get center() {
        return this.pos.add(this.size.mult(0.5));
    }

    /**
     * Returns with the offset to the cneter from the top left of the object
     */
    get centerOffset() {
        return this.size.mult(0.5);
    }

    update() {}

    render() {}

    destroy() {
        this.disabled = true;
    }
}

class PhysicsObject2D extends Object2D {
    vel = new Vector();

    constructor(position, size) {
        super(position, size);

        this.vel = new Vector(0, 0);
    }

    update() {
        this.pos = this.pos.add(this.vel);

        this.vel = this.vel.mult(0.99);
    }

    render() {}

    destroy() {
        this.disabled = true;
    }
}