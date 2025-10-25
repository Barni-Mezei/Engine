/**
 * Dependencies: objects, vector, resources
 */

class SimpleSprite extends Object2D {
    color = "#dd00dd";
    texture = null;

    /**
     * Creates a new sprite, with a texture and position
     * @param {String} textureId The ID of a loaded resource
     * @param {Vector} position The position of the sprite
     * @param {Vector} size The size of the sprite (a vector, specifying the width and height)
     * @param {String} color The deubg color of the sprite (used when debug rendering or when no texture was provided)
     */
    constructor(textureId, position, size = new Vector(32), color = "#dd00dd") {
        super(position, size);

        if (textureId != null) this.texture = new Texture(textureId);

        this.color = color;
    }

    /**
     * Returns with the X coordinate of the left edge of the sprite
     */
    /*get left() {
        return Math.min(this.pos.x, this.pos.x + this.size.x);
    }*/

    /**
     * Returns with the X coordinate of the right edge of the sprite
     */
    /*get right() {
        return Math.max(this.pos.x, this.pos.x + this.size.x);
    }*/

    /**
     * Returns with the Y coordinate of the top edge of the sprite
     */
    /*get top() {
        return Math.min(this.pos.y, this.pos.y + this.size.y);
    }*/

    /**
     * Returns with the Y coordinate of the bottom edge of the sprite
     */
    /*get bottom() {
        return Math.max(this.pos.y, this.pos.y + this.size.y);
    }*/

    /**
     * Returns with the coordinates of the center of the sprite
     */
    /*get center() {
        return this.pos.add(this.size.mult(0.5));
    }*/

    /**
     * Returns with the offset to the cneter from the top left of the sprite
     */
    /*get centerOffset() {
        return this.size.mult(0.5);
    }*/

    renderColor() {
        // Black background
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.fillRect(...camera.w2cXY(this.pos.x, this.pos.y), ...camera.w2csXY(this.size.x, this.size.y));
        ctx.fill();

        // Colored checkerboard pattern
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(...camera.w2cXY(this.right, this.top));
        ctx.lineTo(...camera.w2cXY(this.right, this.center.y));
        ctx.lineTo(...camera.w2cXY(this.left, this.center.y));
        ctx.lineTo(...camera.w2cXY(this.left, this.bottom));
        ctx.lineTo(...camera.w2cXY(this.center.x, this.bottom));
        ctx.lineTo(...camera.w2cXY(this.center.x, this.top));
        ctx.closePath();
        ctx.fill();
    }

    render() {
        camera.renderTexture(this.texture, this.pos.x, this.pos.y, this.size.x, this.size.y);
    }
}

class Sprite extends SimpleSprite {
    scale = new Vector();
    origin = new Vector();
    rotation = 0;

    /**
     * Creates a new sprite, with a texture and position
     * @param {String} textureId The ID of a loaded resource
     * @param {Vector} position The position of the sprite
     * @param {Vector} size The size of the sprite (a vector, specifying the width and height)
     * @param {String} color The deubg color of the sprite (used when debug rendering or when no texture was provided)
     */
    constructor(textureId, position, size = new Vector(32), color = "#dd00dd") {
        super(textureId, position, size, color);

        this.scale = new Vector(1, 1);
        this.origin = new Vector(0, 0);
    }

    /**
     * Sets the transform origin of this sprite
     * @param {Number} x the X coordinate of the transformation origin (must be inside of the sprite boundary)
     * @param {Number} y the Y coordinate of the transformation origin (must be inside of the sprite boundary)
     */
    setOrigin(x, y) {
        this.origin = new Vector(clamp(x, 0, this.size.x), clamp(y, 0, this.size.y));
    }

    get transformOrigin() {
        return this.pos.add(new Vector(this.origin.x * (1 - this.scale.x), this.origin.y * (1 - this.scale.y)));
    }

    /**
     * Returns with the X coordinate of the left edge of the sprite
     */
    get left() {
        return this.scale.x < 0 ? this.transformOrigin.x + this.size.x*this.scale.x : this.transformOrigin.x;
    }

    /**
     * Returns with the offset from the left of the sprite to the left edge of the sprite
     */
    get leftOffset() {
        return this.scale.x < 0 ? 0 : this.size.x * this.scale.x;
    }

    /**
     * Returns with the X coordinate of the right edge of the sprite
     */
    get right() {
        return this.scale.x < 0 ? this.transformOrigin.x : this.transformOrigin.x + this.size.x*this.scale.x;
    }

    /**
     * Returns with the offset from the left of the sprite to the right edge of the sprite
     */
    get rightOffset() {
        return this.scale.x > 0 ? 0 : this.size.x * this.scale.x;
    }

    /**
     * Returns with the Y coordinate of the top edge of the sprite
     */
    get top() {
        return this.scale.y < 0 ? this.transformOrigin.y + this.size.y*this.scale.y : this.transformOrigin.y;
    }

    /**
     * Returns with the offset from the top of the sprite to the top edge of the sprite
     */
    get topOffset() {
        return this.scale.y < 0 ? 0 : this.size.y * this.scale.y;
    }

    /**
     * Returns with the Y coordinate of the bottom edge of the sprite
     */
    get bottom() {
        return this.scale.y < 0 ? this.transformOrigin.y : this.transformOrigin.y + this.size.y*this.scale.y;
    }

    /**
     * Returns with the offset from the top of the sprite to the bottom edge of the sprite
     */
    get bottomOffset() {
        return this.scale.y > 0 ? 0 : this.size.y * this.scale.y;
    }

    /**
     * Returns with the coordinates of the center of the sprite
     */
    get center() {
        return this.pos.add(this.size.mult(this.scale).mult(0.5));
    }

    /**
     * Returns with the offset to the cneter from the top left of the sprite
     */
    get centerOffset() {
        return (this.size).mult(this.scale).mult(0.5);
    }

    renderColor() {
        ctx.save();
        ctx.translate(-this.center.x, -this.center.y);
        ctx.rotate(this.rotation);

        // Black background
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.fillRect(...camera.w2cXY(this.left, this.top), ...camera.w2csXY(this.rightOffset, this.bottomOffset));
        ctx.fill();

        // Colored checkerboard pattern
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(...camera.w2cXY(this.right, this.top));
        ctx.lineTo(...camera.w2cXY(this.right, this.center.y));
        ctx.lineTo(...camera.w2cXY(this.left, this.center.y));
        ctx.lineTo(...camera.w2cXY(this.left, this.bottom));
        ctx.lineTo(...camera.w2cXY(this.center.x, this.bottom));
        ctx.lineTo(...camera.w2cXY(this.center.x, this.top));
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    render() {
        let newSize = this.size.copy();
        newSize.x *= this.scale.x;
        newSize.y *= this.scale.y;

        let newPos = this.pos.copy();
        if (this.scale.x < 0) newPos.x -= newSize.x;
        if (this.scale.y < 0) newPos.y -= newSize.y;

        this.texture.flipV = this.scale.x < 0;
        this.texture.flipH = this.scale.y < 0;

        camera.renderTexture(this.texture, ...newPos.toArray(), ...newSize.toArray(), this.rotation);
    }
}

class AnimatedSprite extends Sprite {
    animations = {};
    currentAnimation = null;
    defaultAnimation = "";

    /**
     * Creates a new sprite, with multiple animations
     * @param {Vector} position The position of the sprite
     * @param {Vector} size The size of the sprite (a vector, specifying the width and height)
     * @param {Object} animations A texture instance
     * @param {String} color The deubg color of the sprite (used when debug rendering or when no texture was provided)
     */
    constructor(position, size = new Vector(32), animations = {}, color = "#dd00dd") {
        super(null, position, size, color);
        
        this.animations = animations;
        this.defaultAnimation = Object.keys(this.animations)[0];
        this.currentAnimation = this.defaultAnimation;
    }

    /**
     * Sets the default animation to play whren no other alternatives found
     * @param {String} animaionId the ID of the animation to defualt to
     */
    setDefualtAnimation(animaionId) {
        this.defaultAnimation = animaionId;
    }

    /**
     * Sets the currently playing animation to the selected one
     * @param {String} animationId The key of the animation, in this.animations
     * @param {Boolean} animate Determines if the animation should be restarted or paused after switching  
     */
    play(animationId, animate = true) {
        this.currentAnimation = animationId;

        if (!animate) {
            this.animations[this.currentAnimation].pause();
        }
    }

    /**
     * Starts playing the slected animation from the beginning
     * @param {String} animaionId The key of the animation, in this.animations
     */
    restart(animaionId) {
        this.play(animaionId);
        
        this.animations[this.currentAnimation].restart();
    }

    /**
     * Resumes the current animation
     */
    resume() {
        this.animations[this.currentAnimation].resume();
    }

    /**
     * Pauses the current animation
     */
    pause() {
        this.animations[this.currentAnimation].pause();
    }

    /**
     * Plays the default animation
     */
    default() {
        this.play(this.defaultAnimation);
    }

    update() {
        this.texture = this.animations[this.currentAnimation];
    }
}