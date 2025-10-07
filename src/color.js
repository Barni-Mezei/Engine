/**
 * Dependencies: math
 */

class Color {
    /**
     * Array values:
     * - Red: 0.0 - 1.0
     * - Green: 0.0 - 1.0
     * - Blue: 0.0 - 1.0
     * - Aalpha: 0.0 - 1.0
     */
    #baseColor = [0, 0, 0, 0];
    #color = [0, 0, 0, 0];

    /**
     * Value of the Red channel (0-255)
     */
    set r(value) {
        this.#baseColor[0] = makeFinite( clamp(value / 255, 0, 1) );
        this.#syncColors();
    }

    get r() {
        return this.#color[0] * 255;
    }

    /**
     * Value of the Green channel (0-255)
     */
    set g(value) {
        this.#baseColor[1] = makeFinite( clamp(value / 255, 0, 1) );
        this.#syncColors();
    }

    get g() {
        return this.#color[1] * 255;
    }

    /**
     * Value of the Blue channel (0-255)
     */
    set b(value) {
        this.#baseColor[2] = makeFinite( clamp(value / 255, 0, 1) );
        this.#syncColors();
    }

    get b() {
        return this.#color[2] * 255;
    }

    /**
     * Value of the Alpha channel (0-255)
     */
    set a(value) {
        this.#baseColor[3] = makeFinite( clamp(value / 255, 0, 1) );
        this.#syncColors();
    }

    get a() {
        return this.#color[3] * 255;
    }

    /**
     * A single value, representing the brightness of the color. 0 for full black and 1 for full white
     */
    get brightness() {
        return (this.#color[0] * 0.2989 + this.#color[1] * 0.5870 + this.#color[2] * 0.1140) * 255;
    }

    set brightness(value) {
        this.#color = [
            this.#baseColor[0] * value,
            this.#baseColor[1] * value,
            this.#baseColor[2] * value,
            this.#baseColor[3] * value,
        ];
    }

    #numToHex(c) {
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    /**
     * The string representation of the current Color object, in a hexadecimal format  
     * Example: `#ff0000ff`  
     * The generated string is ALWAYS 8 characters long, and contains the red, green and alpha channel values
     */
    get hexString() {
        return "#" + this.#numToHex(this.r) + this.#numToHex(this.g) + this.#numToHex(this.b) + this.#numToHex(this.a);
    }

    /**
     * The string representation of the current Color object, in an rgb format  
     * Example: `rgb(0,0,0)`  
     * The generated string is ALWAYS lowercase and never contains spaces
     */
    get rgbString() {
        return "#" + this.#numToHex(this.r) + this.#numToHex(this.g) + this.#numToHex(this.b) + this.#numToHex(this.a);
    }

    /**
     * Creates a new color manipulator object
     * @param {String|Number} color The color in a string format, or theRred channel's value
     * @param {Number|null} g The value of the Green channel
     * @param {Number|null} b The value of the Blue channel
     * @param {Number|null} a The value of the Alpha channel
     */
    constructor(color = "#000000ff", g = null, b = null, a = null) {
        if (g) {
            // Set color directly
            this.#baseColor = [color, g, b, a];
        } else {
            // Convert the color to rgba format (slower)
            let offCanvas = new OffscreenCanvas(1, 1);
            let offCtx = offCanvas.getContext("2d");
    
            offCtx.fillStyle = color;
            offCtx.fillRect(0,0, 1,1);
            let pixelData = offCtx.getImageData(0,0, 1,1).data;
    
            this.#baseColor = [pixelData[0] / 255, pixelData[1] / 255, pixelData[2] / 255, pixelData[3] / 255];
            this.#syncColors();
        }

    }

    #syncColors() {
        this.#color = [...this.#baseColor];
    }

    /**
     * Multiplies each channel by the value of the elpha channel
     */
    multiplyAlpha() {
        this.#baseColor[0] = this.#color[0] * this.#color[3];
        this.#baseColor[1] = this.#color[1] * this.#color[3];
        this.#baseColor[2] = this.#color[2] * this.#color[3];
        this.#baseColor[3] = 1;

        this.#syncColors();
    }

    static addBrightness(color, brightness) {
        let offCanvas = new OffscreenCanvas(1, 1);
        let offCtx = offCanvas.getContext("2d");

        offCtx.fillStyle = color;
        offCtx.fillRect(0,0, 1,1);
        let pixelData = offCtx.getImageData(0,0, 1,1).data;

        return [
            pixelData[0] * brightness,
            pixelData[1] * brightness,
            pixelData[2] * brightness,
            pixelData[3] * brightness
        ]
    }

    /**
     * Adds the 2 colors togetner, and clips the channel values in to a 0 to 255 range
     * @param {Color} color2 The color to add to the current color (channel by channel)
     */
    add(color2) {
        this.r += color2.r;
        this.g += color2.g;
        this.b += color2.b;
        this.a += color2.a;
    }

    /**
     * multiplies the 2 colors togetner, and clips the channel values in to a 0 to 255 range
     * @param {Color} color2 The color to multiply the current color with (channel by channel)
     * The channel values are normalised, before multiplication
     */
    mult(color2) {
        let color2Norm = color2.normalised();

        this.#color[0] = makeFinite(clamp(this.#color[0] * color2Norm[0], 0, 1));
        this.#color[1] = makeFinite(clamp(this.#color[1] * color2Norm[1], 0, 1));
        this.#color[2] = makeFinite(clamp(this.#color[2] * color2Norm[2], 0, 1));
        this.#color[3] = makeFinite(clamp(this.#color[3] * color2Norm[3], 0, 1));
    }

    /**
     * @returns {Array} Returns with an array, containing the channel values in the following format: `[Red, Green, Blue, Alpha]`
     * Where each value is a number between 0 and 1, inclusive.
     */
    normalised() {
        return [
            this.#color[0],
            this.#color[1],
            this.#color[2],
            this.#color[3],
        ];
    }

    /**
     * Sets the channel values for the currect Color object
     * @param {Number} r Red channel value (from 0 to 255, inclusive)
     * @param {Number} g Green channel value (from 0 to 255, inclusive)
     * @param {Number} b Blue channel value (from 0 to 255, inclusive)
     * @param {Number} a Alpha channel value (from 0 to 255, inclusive)
     */
    setRgb(r = 0, g = 0, b = 0, a = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    /**
     * @param {Number} r Red channel value (from 0 to 255, inclusive)
     * @param {Number} g Green channel value (from 0 to 255, inclusive)
     * @param {Number} b Blue channel value (from 0 to 255, inclusive)
     * @returns {Color} Returns a new Color object
     */
    static fromRgb(r = 0, g = 0, b = 0) {
        return new Color(`rgb(${r},${g},${b})`);
    }
    
    /**
     * @param {Number} r Red channel value (from 0 to 255, inclusive)
     * @param {Number} g Green channel value (from 0 to 255, inclusive)
     * @param {Number} b Blue channel value (from 0 to 255, inclusive)
     * @param {Number} a Alpha channel value (from 0 to 255, inclusive)
     * @returns {Color} Returns a new Color object
     */
    static fromRgba(r = 0, g = 0, b = 0, a = 255) {
        return new Color(`rgb(${r},${g},${b},${a / 255})`);
    }

    /**
     * Creates a new Color object from a specified Object
     * @param {Object} object The object, with the following keys: `{r: Red, g: Green, b: Blue, a: Alpha}`
     * Where each key is a single lowercase letter, and each value is a number between 0 and 255, inclusive.
     * @returns {Color} Returns a new Color object
     */
    static fromObject(object) {
        return new Color(`rgba(${object?.r ?? 0},${object?.g ?? 0},${object?.b ?? 0},${(object?.a ?? 255) / 255})`);
    }

    /**
     * Creates a new Color object from a specified array
     * @param {Array} array The array, containing the channel values in the following format: `[Red, Green, Blue, Alpha]`
     * Where each value is a number between 0 and 255, inclusive.
     * @returns {Color} Returns a new Color object
     */
    static fromArray(array) {
        if (!(array instanceof Array)) return new Color();

        let a = [...array, 0, 0, 0, 255];

        return new Color(`rgba(${a[0]},${a[1]},${a[2]},${a[3] / 255})`);
    }

    /**
     * Creates a new Color object from a specified string representation
     * @param {String} string The string, containing the color, in any of the valid CSS color representations
     * @returns {Color} Returns a new Color object
     */
    static fromString(string) {
        if (!(string instanceof String)) return new Color();

        return new Color(string);
    }

    /**
     * @returns {Array} Returns with an array, containing the channel values in the following format: `[Red, Green, Blue, Alpha]`
     * Where each value is a number between 0 and 255, inclusive.
     */
    toArray() {
        return [
            this.#color[0] * 255,
            this.#color[1] * 255,
            this.#color[2] * 255,
            this.#color[3] * 255,
        ];
    }

    /**
     * @returns {Object} Returns with an object, containing the channel vlaues in the following format: `{r: Red, g: Green, b: Blue, a: Alpha}`
     * Where each value is a number between 0 and 255, inclusive.
     */
    toObject() {
        return {
            r: this.#color[0] * 255,
            g: this.#color[1] * 255,
            b: this.#color[2] * 255,
            a: this.#color[3] * 255,
        }
    }
}