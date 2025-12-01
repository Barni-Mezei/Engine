let paths = [];

let soldiers = [];
let positions = [];

let formationRotation = 0;

class Soldier extends AnimatedSprite {
    agent;

    name;

    cooldown = 0;
    tagetPos = new Vector();

    constructor(pathFollow, color) {
        let animations = {
            "idle": new Texture("soldier_idle"),
            "walk": new Texture("soldier_walk"),
            "jump": new Texture("soldier_jump"),
        }

        super(new Vector(), new Vector(100), animations, color);

        this.origin.y = 100;
        this.origin.x = 50;

        this.agent = pathFollow;

        this.name = new Label2D(`Soldier ${soldiers.length}`);
        this.name.setSize(16);
    }

    update() {
        super.update();

        this.pos = this.agent.pos;

        this.name.setCenter( this.pos.add(new Vector(this.centerOffset.x, 0)) );
        this.name.pos.y += 20;

        // Set scale
        /*if (this.agent.path.getPoint(this.agent.lastPointIndex).x < this.pos.x + Math.abs(this.size.x / 2)) {
            this.scale.x = -1;
        } else {
            this.scale.x = 1;
        }*/

        if (this.agent.lastPointIndex == 0) {
            this.play("walk");
        } else {
            this.play("idle");
        }
    }

    render() {
        super.render();

        if (settings.debug?.boxes) {
            ctx.lineWidth = camera.w2csX(4);

            ctx.strokeStyle = "#ff0000";
            ctx.beginPath();
            ctx.moveTo(...camera.w2cXY(this.left, this.top));
            ctx.lineTo(...camera.w2cXY(this.left, this.bottom));
            ctx.stroke();
    
            ctx.strokeStyle = "#00ff00";
            ctx.beginPath();
            ctx.moveTo(...camera.w2cXY(this.right, this.top));
            ctx.lineTo(...camera.w2cXY(this.right, this.bottom));
            ctx.stroke();
    
            ctx.strokeStyle = "#0088ff";
            ctx.beginPath();
            ctx.moveTo(...camera.w2cXY(this.left, this.top));
            ctx.lineTo(...camera.w2cXY(this.right, this.top));
            ctx.stroke();
    
            ctx.strokeStyle = "#ff00ff";
            ctx.beginPath();
            ctx.moveTo(...camera.w2cXY(this.left, this.bottom));
            ctx.lineTo(...camera.w2cXY(this.right, this.bottom));
            ctx.stroke();
        }

        if (distance(...camera.w2cXY(this.center.x, this.center.y), input.mouse.x, input.mouse.y) < camera.w2csX(Math.min(this.size.x, this.size.y) / 2)) {
            this.name.render();
        }
    }
}

function randomColor(minR = 0, maxR = 255, minG = 0, maxG = 255, minB = 0, maxB = 255) {
    return `rgb(${randInt(minR, maxR)},${randInt(minG, maxG)},${randInt(minB, maxB)})`;
}

async function init() {
    input.mouse.x = c.width / 2;
    input.mouse.y = c.height / 2;

    settings.gameSettings = await FileResource.getJson("settings");

    for (let i = 0; i < settings.gameSettings.soldier_count; i++) {
        let newPos = pol(
            (i % settings.gameSettings.width) * settings.gameSettings.column_gap - ((settings.gameSettings.width-1) * settings.gameSettings.column_gap / 2),
            Math.floor(i / settings.gameSettings.width) * settings.gameSettings.row_gap
        );

        let newSoldier = new Soldier(
            new PathFollow(4),
            randomColor(20, 200, 20, 200, 20, 200)
        );

        newSoldier.agent.canFinish = false;
        let newPath = new Path([
            Vector.fromAngle(newPos.angle, newPos.length).add(Vector.fromObject(input.mouse)),
            Vector.fromAngle(newPos.angle, newPos.length).add(Vector.fromObject(input.mouse)),
        ]);

        newPath.addAgent(newSoldier.agent);

        soldiers.push(newSoldier);
        paths.push(newPath);
        positions.push(newPos);
    }
}

function update(delta) {
    // Re-assign taget
    if (input.mouse.left) {
        for (let index in paths) {
            let path = paths[index];
            let point = Vector.fromAngle(positions[index].angle + formationRotation, positions[index].length);
            
            path.removePointFromStart();
            path.removePointFromEnd();
            path.addPointAtStart(soldiers[index].pos);
            path.addPointAtEnd(camera.c2w(Vector.fromObject(input.mouse)).add(point).sub(new Vector(soldiers[index].centerOffset.x, soldiers[index].topOffset)));
            soldiers[index].agent.lastPointIndex = 0;
        }
    }

    if (isKeyPressed("space")) {
        paths.forEach((p, index) => {
            p.removePointFromStart();
            p.removePointFromEnd();
            p.addPointAtStart(soldiers[index].pos);
            p.addPointAtEnd( new Vector(
                (c.width/2 - 100) / camera.realZoom * randFloat(-1, 1),
                (c.height/2 - 100) / camera.realZoom * randFloat(-1, 1),
            ));
            soldiers[index].agent.lastPointIndex = 0;
        });
    }

    if (isKeyPressed("a")) formationRotation -= 2;
    if (isKeyPressed("d")) formationRotation += 2;

    if (isKeyPressed("w")) {
        for (let s of soldiers) s.agent.speed += 1;
    };
    if (isKeyPressed("s")) {
        for (let s of soldiers) s.agent.speed -= 1;
    };

    if (isKeyPressed("add")) camera.zoom += camera.zoom * 0.01 * delta;
    if (isKeyPressed("sub")) camera.zoom -= camera.zoom * 0.01 * delta;
    camera.clampValues();

    if (isKeyPressed("left")) camera.pos.x -= 10 / camera.realZoom;
    if (isKeyPressed("right")) camera.pos.x += 10 / camera.realZoom;
    if (isKeyPressed("up")) camera.pos.y -= 10 / camera.realZoom;
    if (isKeyPressed("down")) camera.pos.y += 10 / camera.realZoom;

    if (isKeyPressed("q")) camera.pos = new Vector();

    for (let p of paths) p.update();
    for (let s of soldiers) s.update();

    camera.lookAt(new Vector(0, 0), true);
    camera.update(delta);

}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);

    if (settings.debug?.paths) {
        for (let p of paths) p.render();
    }

    // Draw mouse positions
    ctx.fillStyle = "#ffffff22";
    for (let index in positions) {
        let point = positions[index];
        let offset = Vector.fromAngle(point.angle + formationRotation, point.length);
        let pointpos = camera.w2c(camera.c2w(input.mouse.pos).add(offset));

        ctx.beginPath();
        ctx.arc(...pointpos.toArray(), camera.w2csX(10), 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw formation direction arrow
    let arrowPoints = {
        bottom: [0,   -20],
        top:    [0,   -100],
        left:   [-20, -80],
        right:  [20,  -80],
    }

    for (let key in arrowPoints) {
        let point = pol(arrowPoints[key][0], arrowPoints[key][1]);
        point = rec(point.angle + formationRotation, point.length);

        arrowPoints[key] = [...camera.w2c(camera.c2w(input.mouse.pos).add(Vector.fromObject(point))).toArray()];
    }

    ctx.strokeStyle = "#ffffff22";
    ctx.lineWidth = camera.w2csX(10);
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(...arrowPoints["bottom"]);
    ctx.lineTo(...arrowPoints["top"]);
    ctx.lineTo(...arrowPoints["left"]);
    ctx.moveTo(...arrowPoints["right"]);
    ctx.lineTo(...arrowPoints["top"]);
    ctx.stroke();

    // Draw target positions
    ctx.fillStyle = "#00ddff88";
    for (let index in paths) {
        let path = paths[index];
        let targetpoint = path.points[path.points.length - 1].add(new Vector(soldiers[index].centerOffset.x, soldiers[index].topOffset));
    
        targetpoint = camera.w2c(targetpoint);
    
        ctx.beginPath();
        ctx.arc(...targetpoint.toArray(), camera.w2csX(5), 0, Math.PI * 2);
        ctx.fill();
    }

    for (let s of soldiers) s.render();

    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(...camera.w2cXY(0, 0), camera.w2csX(5), 0, Math.PI * 2);
    ctx.fill();

    document.getElementById("text").textContent += `Speed: ${soldiers[0]?.agent?.speed ?? "?"}` + "\n";
}