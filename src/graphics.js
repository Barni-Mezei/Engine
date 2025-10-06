/**
 * Dependencies: objects, vector, camera, resourceManager
 */

class Label2D extends Object2D {
    color = "#dddddd";
    fontFamily = "monospace";
    fontSize = 16;
    #textcontent = "";
    maxWidth = Infinity;

    /**
     * @param {String} text the text the label should display
     */
    set text(text) {
        this.#textcontent = text;
        this.#updateSize();
    }

    /**
     * Creates a new sprite, with a texture and position
     * @param {String} textureId The ID of a loaded resource
     * @param {Vector} position The position of the sprite
     * @param {Vector} size The size of the sprite (a vector, specifying the width and height)
     * @param {String} color The deubg color of the sprite (used when debug rendering or when no texture was provided)
     */
    constructor(text, position, color = "#dddddd") {
        super(position);

        this.text = text;
        this.color = color;
    }

    /**
     * The text of the label
     */
    get text() {
        return this.#textcontent;
    }

    setFont(fontFamily, fontSize = this.fontSize) {
        this.fontFamily = fontFamily;
        this.fontSize = fontSize;

        this.#updateSize();
    }

    setSize(fontSize) {
        this.fontSize = fontSize;

        this.#updateSize();
    }

    #updateSize() {
        // Save font settings
        let oldFontSize = parseInt(ctx.font, 10);
        let oldFontFamily = ctx.font.split(' ').slice(1).join(' ');

        // Calculate text size with the current font settings
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;

        this.size.x = ctx.measureText(this.#textcontent).width;
        this.size.y = this.fontSize;

        // Restore font settings
        ctx.font = `${oldFontSize}px ${oldFontFamily}`;
    }

    render() {
        ctx.font = `${camera.w2csX(this.fontSize)}px ${this.fontFamily}`;
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, ...camera.w2cXY(this.left, this.bottom));


        if (settings.debug?.boxes) {
            ctx.strokeStyle = this.color;
            ctx.beginPath();
            ctx.strokeRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
        }
    }
}

class Point extends Object2D {
    color = "#00dddff";

    constructor(x, y, color = "#00ddff") {
        super(new Vector(x, y), new Vector(1));

        this.color = color;
    }

    render(pos) {
        ctx.fillStyle = this.color;

        ctx.beginPath();
        ctx.arc(...camera.w2c(this.pos).toArray(), 10, 0, Math.PI * 2);
        ctx.fill();
    }
}