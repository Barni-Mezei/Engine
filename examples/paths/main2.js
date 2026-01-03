/** @type {Path} */
let path;

/** @type {Character} */
let player;

let closestPoint = new Vector();

class Character extends AnimatedSprite {
    static ID = 0;

    path;
    agent;

    collider;

    name;

    shadow;

    constructor(path, startPos) {
        let animations = {
            "idle": new Texture("soldier_idle"),
            "walk": new Texture("soldier_walk"),
            "jump": new Texture("soldier_jump"),
        }

        super(startPos, new Vector(50), animations);

        this.origin.y = 50;
        this.origin.x = 25;

        this.agent = new PathFollow(4);
        this.path = path;
        this.agent.setPath(this.path);

        // Do not start following
        this.agent.pos = startPos;
        this.agent.finished = true;
        this.agent.following = false;

        this.name = new Label2D(`Agent ${Character.ID++}`);
        this.name.setSize(16);

        this.collider = new ColliderAABB(this.pos, new Vector(25, 32), new Vector(12.5, 20));

        this.shadow = new AnimatedSprite(new Vector(), new Vector(50), {
            "idle": new Texture("shadow"),
            "walk": new Texture("shadow_walk"),
        });

        this.play("idle");
        this.shadow.play("idle");

        // Set initial position
        this.update();
    }

    setGoal() {
        let closestPointIndex = this.path.getClosestPoint();

        this.agent.lastPointIndex = closestPointIndex;
        this.agent.following = true;
        this.agent.finished = false;

        this.play("walk");
        this.shadow.play("walk");
    }

    update(delta) {
        super.update();

        this.pos = this.agent.pos.sub(this.origin);
        this.collider.setPos(this.pos);

        this.name.setCenter( this.pos.add(new Vector(this.centerOffset.x, 20)) );

        //camera.renderTexture(this.shadow, this.pos.x + (100/32)*0.5, this.pos.y + (100/32)*2, this.width, this.height);
        this.shadow.setCenter( this.pos.add(new Vector(this.centerOffset.x + 1, 27)) );
        this.shadow.update();

        if (this.agent.finished) {
            this.play("idle");
            this.shadow.play("idle");
            return;
        }

        this.agent.update(delta);
    }

    render() {
        if (settings.debug?.path) this.path.render();

        this.shadow.render();
        super.render();

        if (settings.debug?.boxes) {
            this.collider.render();

            ctx.fillStyle = "#ff0000";
            ctx.beginPath();
            ctx.arc(...camera.w2c(this.pos.add(this.origin)).toArray(), camera.w2csX(4), 0, Math.PI*2);
            ctx.fill();
        }

        if (this.collider.isColliding(camera.c2w(input.mouse.pos))) {
            this.name.render();
        }
    }

    destroy() {
        this.agent.removePath();
        this.agent = null;

        this.shadow.destroy();

        super.destroy();
    }
}

function init() {
    path = new Path([
        new Vector(0, 0),
        new Vector(300, -200),
        new Vector(500, 0),
        //new Vector(700, 0),
    ]);

    player = new Character(path, new Vector(200, 0));

    camera.lookAt(new Vector(300, 100), true);
}

function update(delta) {

    player.update();

    if (input.mouse.left && !input.mouse.oldLeft) {
        player.agent.pos = camera.c2w(input.mouse.pos);
        closestPoint = path.getClosestPoint(player.agent.pos);
    }

    camera.update(delta);
}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);

    player.render();
    path.render();

    ctx.strokeStyle = "#0df";
    ctx.beginPath();
    ctx.moveTo(...camera.w2c(player.agent.pos).toArray());
    ctx.lineTo(...camera.w2c(closestPoint).toArray());
    ctx.stroke();

    ctx.fillStyle = "#f00";
    ctx.beginPath();
    ctx.arc(...camera.w2c(closestPoint).toArray(), 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f0";
    ctx.beginPath();
    ctx.arc(...camera.w2c(new Vector()).toArray(), 5, 0, Math.PI * 2);
    ctx.fill();
}
