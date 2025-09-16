/**
 * Dependencies: vector
 */

class Particle {
    pos = new Vector();
    vel = new Vector();
    airResistance = 0.99;

    colorStart = "#ff0000";
    color = "#ffffff";
    colorEnd = "#00ff00";

    sizeStart = 5;
    size = 0;
    sizeEnd = 1;

    age = 0;
    maxAge = 200;
    lifeProgress = 0;
    disabled = false;

    constructor(x, y, vx, vy, maxAge) {
        this.pos.x = x;
        this.pos.y = y;

        this.vel.x = vx;
        this.vel.y = vy;

        this.maxAge = maxAge ?? this.maxAge;
        this.disabled = false;

        objects.particles.push(this);
    }

    die() {

    }

    #updateEssentials() {
        if (this.maxAge > 0) this.age++;
        this.lifeProgress = this.age / this.maxAge;

        let sizeDiff = this.sizeEnd - this.sizeStart;
        this.size = this.sizeStart + sizeDiff * this.lifeProgress;

        this.color = this.colorStart.replace(")", `,${1 - this.lifeProgress})`);

        if (this.maxAge > 0 &&this.age > this.maxAge) {
            if (!this.disabled) this.die();
            this.disabled = true;
        }
    }

    update() {
        this.#updateEssentials();

        this.pos = this.pos.add(this.vel);
        this.vel.mult(this.airResistance);
    }

    render() {
        let camPos = cameraTransform(this.pos);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(camPos.x, camPos.y, this.size*camera.zoom, 0,Math.PI*2);
        ctx.fill();
    }
}