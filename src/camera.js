/**
 * Dependencies: vector, math
 */

class Camera {
    #realPos = new Vector();
    pos = new Vector(); // Target value

    #realZoom = 1;
    zoom = 1; // Target value

    /**
     * Is the camera position rounded to the nearest finite floating point number
     */
    isFinite = false;

    /**
     * Is the camera position rounded to the nearest integer (Set to null to not round)
     */
    rounded = null;

    /**
     * The the true current zoom level of the camera
     */
    get realZoom() {
        return this.#realZoom;
    }

    /**
     * The the true current position of the camera
     */
    get realPos() {
        return this.#realPos;
    }

    /**
     * Creates a new camera
     * @param {Vector} pos The position of the camera
     * @param {Number} zoom The zoom level of the camera, default is 1
     */
    constructor(pos, zoom = 1) {
        this.pos = pos;
        this.#realPos = pos;

        this.zoom = zoom;
        this.#realZoom = zoom;
    }

    /**
     * Sets the camera's zoom level to the specified amount
     * @param {Number} zoom The target zoom level of the camera
     * @param {Boolean} smooth Smoothly change the zoom level, or make the change instantly
     */
    setZoom(zoom, smooth = false) {
        this.zoom = clamp(zoom, settings.camera.minZoom, settings.camera.maxZoom);

        if (!smooth) this.#realZoom = this.zoom;
    }

    /**
     * Places the camera over the specified position, so that is in he middle of the screen
     * @param {Vector} pos The world space position to center the camera on
     * @param {Boolean} smooth Smoothly change the position, or make the change instantly
     */
    lookAt(pos, smooth = false) {
        let center = new Vector(c.width / this.#realZoom, c.height / this.#realZoom).mult(0.5);
        this.pos = pos.sub(center);

        if (!smooth) this.#realPos = this.pos;
    }

    update() {
        this.#realPos = Vector.lerp(this.#realPos, this.pos, settings.camera.slideSpeed);

        this.#realZoom = lerp(this.#realZoom, this.zoom, settings.camera.zoomSpeed);

        if (this.isFinite) {
            this.#realPos = new Vector(makeFinite(this.#realPos.x), makeFinite(this.#realPos.y) );
            this.#realZoom = makeFinite(this.#realZoom);
        }

        if (this.rounded != null) {
            this.#realPos = this.#realPos.round(this.rounded);
        }

        this.#realZoom = clamp(this.#realZoom, settings.camera.minZoom, settings.camera.maxZoom);
    }

    /**
     * Renders the texture, at the given coordinates, with scaling and rotating options, as if you were looking through the camera
     * Uses WORLD space coordinates
     * @param {Number} x World X
     * @param {Number} y World Y
     * @param {Number} width Width of the texture
     * @param {Number} height Height of the texture
     * @param {Number} rotation Angle of rotatin in DEGREES
     * @param {Number} margin Inset from width and height
     */
    renderTexture(textureInstance, x, y, width, height, rotation = 0, margin = 0) {
        textureInstance.render(...this.worldToCamXY(x, y), ...this.worldToCamSizeXY(width, height), rotation = rotation, margin = margin)
    }

    /**
     * Renders a camera debug reactangle, on the canvas, in 1:1 world coordinates (world 0;0 is at the top left of the screen)
     */
    render() {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.rect(... this.#realPos.toArray(), c.width * this.#realZoom, c.height * this.#realZoom);
        ctx.stroke();
    }

    /* Camera transform functions */

    /* World to camera space convertions */

    /* Sizes */

    /**
     * Translates world space sizes to camera (screen) space sizes
     * @param {Vector} v A world space size vector (width, height)
     * @returns {Vector} A camera (screen) space size vector (width, height)
     */
    worldToCamSize(v) {
        return v.mult(this.#realZoom);
    }

    // Aliases
    get worldToScreenSize() { return this.worldToCamSize.bind(this); }
    get w2cs() { return this.worldToCamSize.bind(this); }

    /**
     * Translates world space sizes to camera (screen) space sizes
     * @param {Number} width A world space width
     * @param {Number} height A world space height
     * @returns {Array} A camera (screen) space size array [width, height]
     */
    worldToCamSizeXY(width, height) {
        return [width * this.#realZoom, height * this.#realZoom];
    }

    // Aliases
    get worldToScreenSizeXY() { return this.worldToCamSizeXY.bind(this); }
    get w2csXY() { return this.worldToCamSizeXY.bind(this); }

    /**
     * Translates world space sizes to camera (screen) space sizes
     * @param {Number} width A world space size width
     * @returns {Number} A camera (screen) space width
     */
    worldToCamSizeX(width) {
        return width * this.#realZoom;
    }

    // Aliases
    get worldToScreenSizeX() { return this.worldToCamSizeX.bind(this); }
    get w2csX() { return this.worldToCamSizeX.bind(this); }

    /**
     * Translates world space sizes to camera (screen) space sizes
     * @param {Number} height A world space size height
     * @returns {Number} A camera (screen) space height
     */
    worldToCamSizeY(height) {
        return height * this.#realZoom;
    }

    // Aliases
    get worldToScreenSizeY() { return this.worldToCamSizeY.bind(this); }
    get w2csY() { return this.worldToCamSizeY.bind(this); }


    /* Positions */

    /**
     * Translates world space coordinates to camera (screen) space coordinates
     * @param {Vector} v A world space coordinate 
     * @returns {Vector} A camera (screen) space coordinate
     */
    worldToCam(v) {
        return v.sub(this.#realPos).mult(this.#realZoom);
    }

    // Aliases
    get worldToScreen() { return this.worldToCam.bind(this); }
    get w2c() { return this.worldToCam.bind(this); }

    /**
     * Translates world space coordinates to camera (screen) space coordinates
     * @param {Number} x A world space X coordinate 
     * @param {Number} y A world space Y coordinate 
     * @returns {Array} A camera (screen) space coordinate as an array [x, y]
     */
    worldToCamXY(x, y) {
        return [(x - this.#realPos.x) * this.#realZoom, (y - this.#realPos.y) * this.#realZoom];
    }

    // Aliases
    get worldToScreenXY() { return this.worldToCamXY.bind(this); }
    get w2cXY() { return this.worldToCamXY.bind(this); }

    /**
     * Translates world space coordinates to camera (screen) space coordinates
     * @param {Number} x A world space X coordinate 
     * @returns {Number} A camera (screen) space X coordinate
     */
    worldToCamX(x) {
        return (x - this.#realPos.x) * this.#realZoom;
    }

    // Aliases
    get worldToScreenX() { return this.worldToCamX.bind(this); }
    get w2cX() { return this.worldToCamX.bind(this); }

    /**
     * Translates world space coordinates to camera (screen) space coordinates
     * @param {Number} y A world space Y coordinate 
     * @returns {Number} A camera (screen) space Y coordinate
     */
    worldToCamY(y) {
        return (y - this.#realPos.y) * this.#realZoom;
    }

    // Aliases
    get worldToScreenY() { return this.worldToCamY.bind(this); }
    get w2cY() { return this.worldToCamY.bind(this); }





    /* Camera to world space convertions */

    /* Sizes */

    /**
     * Translates camera (screen) space sizes to world space sizes
     * @param {Vector} v A camera (screen) space size vector (width, height)
     * @returns {Vector} A world space size vector (width, height)
     */
    camToWorldSize(v) {
        return v.mult(1 / this.#realZoom);
    }

    // Aliases
    get screenToWorldSize() { return this.camToWorldSize.bind(this); }
    get c2ws() { return this.camToWorldSize.bind(this); }

    /**
     * Translates camera (screen) space sizes to world space sizes
     * @param {Number} width A camera (screen) space width
     * @param {Number} height A camera (screen) space height
     * @returns {Vector} A world space size array [width, height]
     */
    camToWorldSizeXY(width, height) {
        return [width / this.#realZoom, height / this.#realZoom];
    }

    // Aliases
    get screenToWorldSizeXY() { return this.camToWorldSizeXY.bind(this); }
    get c2wsXY() { return this.camToWorldSizeXY.bind(this); }

    /**
     * Translates camera (screen) space sizes to world space sizes
     * @param {Number} width A camera (screen) space width
     * @returns {Vector} A world space width
     */
    camToWorldSizeX(width) {
        return width / this.#realZoom;
    }

    // Aliases
    get screenToWorldSizeX() { return this.camToWorldSizeX.bind(this); }
    get c2wsX() { return this.camToWorldSizeX.bind(this); }

    /**
     * Translates camera (screen) space sizes to world space sizes
     * @param {Number} height A camera (screen) space height
     * @returns {Vector} A world space height
     */
    camToWorldSizeY(height) {
        return height / this.#realZoom;
    }

    // Aliases
    get screenToWorldSizeY() { return this.camToWorldSizeY.bind(this); }
    get c2wsY() { return this.camToWorldSizeY.bind(this); }

    /* Positions */

    /**
     * Translates the camera space vector to a world space vector
     * @param {Vector} v The vector to be trasformed
     */
    camToWorld(v) {
        return v.add(this.#realPos).mult(1 / this.#realZoom);
    }

    // Aliases
    get screenToWorld() { return this.camToWorld.bind(this); }
    get c2w() { return this.camToWorld.bind(this); }

    /**
     * Translates camera (screen) space coordinates to world space coordinates
     * @param {Number} x A camera (screen) space X coordinate 
     * @param {Number} y A camera (screen) space Y coordinate 
     * @returns {Array} A world space coordinate as an array [x, y]
     */
    camToWorldXY(x, y) {
        return [(x + this.#realPos.x) / this.#realZoom, (y + this.#realPos.y) / this.#realZoom];
    }

    // Aliases
    get screenToWorldXY() { return this.camToWorldXY.bind(this); }
    get c2wXY() { return this.camToWorldXY.bind(this); }

    /**
     * Translates camera (screen) space coordinates to world space coordinates
     * @param {Number} x A camera (screen) space X coordinate 
     * @returns {Number} A world space X coordinate
     */
    camToWorldX(x) {
        return (x + this.#realPos.x) / this.#realZoom;
    }

    // Aliases
    get screenToWorldX() { return this.camToWorldX.bind(this); }
    get c2wX() { return this.camToWorldX.bind(this); }

    /**
     * Translates camera (screen) space coordinates to world space coordinates
     * @param {Number} y A camera (screen) space Y coordinate 
     * @returns {Number} A world space Y coordinate
     */
    camToWorldY(y) {
        return (y + this.#realPos.y) / this.#realZoom;
    }

    // Aliases
    get screenToWorldY() { return this.camToWorldY.bind(this); }
    get c2wY() { return this.camToWorldY.bind(this); }
}