/**
 * Dependencies: vector, math
 */

class Camera {
    pos = new Vector(); // Target value
    #realPos = new Vector(); // Current value

    zoom = 1; // Target value
    #realZoom = 1; // Current value
    
    /**
     * Camera settings
     */
    settings = {
       /**
        * Is the camera position rounded to the nearest integer
        */
       rounded: false,
       
       /**
        * Is the camera position rounded to the nearest finite floating point number
        */
       finite: false,

       /**
        * Speed, which the camera reaches it's target zoom level (-1 for instant zooming)
        */
       zoomSpeed: -1,

       /**
        * Speed, which the camera reaches it's target  position (-1 for instant motion)
        */
       glideSpeed: -1,

       /**
        * Minimum allowed zoomlevel
        */
       minZoom: 0.1,

       /**
        * Maximum allowed zoom level
        */
       maxZoom: 5,
    }

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
     * @param {Number} zoom The starting zoom level of the camera
     * @param {Object} settings The settings of the camera, in the following format:
     * - rounded: (false) Is the camera's position rounded to the nearest integer?
     * - finite: (false) Is the camera's position rounded to the nearest finite floating point number?
     * - zoomSpeed: (-1) The zoom interpolation speed of the camera (-1 to make it instant)
     * - glideSpeed: (-1) The position interpolation speed of the camera (-1 to make it instant)
     * - minZoom: (0.1) The minimum allowed zoom level for the camera
     * - maxZoom: (5) The maximum allowed zoom level for the camera
     */
    constructor(pos, zoom = 1, settings = {}) {
        this.pos = pos;
        this.#realPos = pos;

        this.zoom = zoom;
        this.#realZoom = zoom;

        // Default settings
        this.settings = {
            rounded: false,
            finite: false,

            zoomSpeed: -1,
            glideSpeed: -1,

            minZoom: 0.1,
            maxZoom: 5,
        }

        for (let key in settings) {
            this.settings[key] = settings[key];
        }
    }

    /**
     * Sets the camera's zoom level to the specified amount
     * @param {Number} zoom The target zoom level
     * @param {Boolean} instant If set to true, the action will be executed instantly, instead of waiting for the next camera update
     */
    setZoom(zoom, instant = false) {
        this.zoom = clamp(zoom, this.settings.minZoom, this.settings.maxZoom);

        if (instant) this.#realZoom = this.zoom;
    }

    /**
     * Places the camera over the specified position, so that the position is in he middle of the screen
     * @param {Vector} pos The position to center the camera on (world space)
     * @param {Boolean} instant If set to true, the action will be executed instantly, instead of waiting for the next camera update
     */
    lookAt(pos, instant = false) {
        let center = new Vector(c.width / this.zoom, c.height / this.zoom).mult(0.5);
        this.pos = pos.sub(center);

        if (instant) this.#realPos = this.pos;
    }

    clampValues() {
        this.#realZoom = clamp(this.#realZoom, this.settings.minZoom, this.settings.maxZoom);
        this.zoom = clamp(this.zoom, this.settings.minZoom, this.settings.maxZoom);
    }

    update() {
        if (this.settings.zoomSpeed == -1) {
            this.#realZoom = this.zoom;
        } else {
            this.#realZoom = lerp(this.#realZoom, this.zoom, this.settings.zoomSpeed);
        }

        if (this.settings.glideSpeed == -1) {
            this.#realPos = this.pos;
        } else {
            this.#realPos = Vector.lerp(this.#realPos, this.pos, this.settings.glideSpeed);
        }

        if (this.settings.finite) {
            this.#realPos = new Vector(makeFinite(this.#realPos.x), makeFinite(this.#realPos.y) );
            this.#realZoom = makeFinite(this.#realZoom);
        }

        if (this.settings.rounded) {
            this.#realPos = this.#realPos.round(this.rounded);
        }

        this.clampValues();
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

    /*
     * Camera transform functions
     */

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

    /* Full */

    /**
     * Translates world space coordinates and sizes to camera (screen) space coordinates and sizes
     * @param {Vector} pos A world space position
     * @param {Vector} size A world space size
     * @returns {Array} An array containing the camera (screen) space values for the passed in values [x, y, width, height]
     */
    w2cf(pos, size) {
        return [...this.w2c(pos).toArray(), ...this.w2cs(size).toArray()];
    }

    /**
     * Translates world space coordinates and sizes to camera (screen) space coordinates and sizes
     * @param {Number} x A world space X coordinate 
     * @param {Number} y A world space Y coordinate 
     * @param {Number} w A world space width 
     * @param {Number} h A world space height 
     * @returns {Array} An array containing the camera (screen) space values for the passed in values [x, y, width, height]
     */
    w2cfXY(x, y, w, h) {
        return [...this.w2cXY(x, y), ...this.w2csXY(w, h)];
    }





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