let paths = [];

let soliders = [];
let positions = [];

let formationRotation = 0;

class Solider extends AnimatedSprite {
    agent;

    name;

    cooldown = 0;
    tagetPos = new Vector();

    constructor(pathFollow, color) {
        let animations = {
            "idle": new Texture("solider_idle"),
            "walk": new Texture("solider_walk"),
            "jump": new Texture("solider_jump"),
        }

        super(new Vector(), new Vector(100), animations, color);

        this.origin.y = 100;
        this.origin.x = 50;

        this.agent = pathFollow;

        this.name = new Label2D(`Solider ${soliders.length}`);
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

    for (let i = 0; i < settings.gameSettings.solider_count; i++) {
        let newPos = pol(
            (i % settings.gameSettings.width) * settings.gameSettings.column_gap - ((settings.gameSettings.width-1) * settings.gameSettings.column_gap / 2),
            Math.floor(i / settings.gameSettings.width) * settings.gameSettings.row_gap
        );

        let newSolider = new Solider(
            new PathFollow(4),
            randomColor(20, 200, 20, 200, 20, 200)
        );

        newSolider.agent.canFinish = false;
        let newPath = new Path([
            Vector.fromAngle(newPos.angle, newPos.length).add(Vector.fromObject(input.mouse)),
            Vector.fromAngle(newPos.angle, newPos.length).add(Vector.fromObject(input.mouse)),
        ]);

        newPath.addAgent(newSolider.agent);

        soliders.push(newSolider);
        paths.push(newPath);
        positions.push(newPos);
    }
}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);

    /*paths.forEach(p => {
        p.render();
    });*/

    // Draw mouse positions
    positions.forEach(p => {
        let offset = Vector.fromAngle(p.angle + formationRotation, p.length);
        let mPos = Vector.fromObject(input.mouse);
        pointpos = camera.w2c(offset).add(Vector.fromObject(input.mouse));

        ctx.fillStyle = "#ffffff22";
        ctx.beginPath();
        ctx.arc(...pointpos.toArray(), camera.w2csX(10), 0, Math.PI * 2);
        ctx.fill();
    });

    let arrowPoints = {
        bottom: [0,   -20],
        top:    [0,   -100],
        left:   [-20, -80],
        right:  [20,  -80],
    }

    for (let key in arrowPoints) {
        let point = pol(arrowPoints[key][0], arrowPoints[key][1]);
        point = rec(point.angle + formationRotation, point.length);
        arrowPoints[key] = [...camera.w2c(Vector.fromObject(point)).add(Vector.fromObject(input.mouse)).toArray()];
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
    paths.forEach((p, index) => {
        let targetpoint = p.points[p.points.length - 1].add(new Vector(soliders[index].centerOffset.x, soliders[index].topOffset));

        targetpoint = camera.w2c(targetpoint);

        ctx.fillStyle = "#00ddff88";
        ctx.beginPath();
        ctx.arc(...targetpoint.toArray(), camera.w2csX(5), 0, Math.PI * 2);
        ctx.fill();
    });

    soliders.forEach(s => {
        s.render();
    });
}

function update() {
    // Re-assign taget
    if (input.mouse.down) {
        paths.forEach((p, index) => {
            let point = Vector.fromAngle(positions[index].angle + formationRotation, positions[index].length);

            p.removePointFromStart();
            p.removePointFromEnd();
            p.addPointAtStart(soliders[index].pos);
            p.addPointAtEnd(camera.c2w(Vector.fromObject(input.mouse)).add(point).sub(new Vector(soliders[index].centerOffset.x, soliders[index].topOffset)));
            soliders[index].agent.lastPointIndex = 0;
        });
    }

    if (isKeyJustPressed("space")) {
        paths.forEach((p, index) => {
            p.removePointFromStart();
            p.removePointFromEnd();
            p.addPointAtStart(soliders[index].pos);
            p.addPointAtEnd( new Vector(randFloat(20, c.width/camera.realZoom-20), randFloat(20, c.height/camera.realZoom-100)) );
            soliders[index].agent.lastPointIndex = 0;
        });
    }

    if (isKeyPressed("a")) formationRotation -= 2;
    if (isKeyPressed("d")) formationRotation += 2;

    if (isKeyPressed("w")) {
        soliders.forEach(s => {
            s.agent.speed += 1;
        });
    };
    if (isKeyPressed("s")) {
        soliders.forEach(s => {
            s.agent.speed -= 1;
        });
    };

    if (isKeyPressed("add")) camera.zoom += 0.1;
    if (isKeyPressed("sub")) camera.zoom -= 0.1;

    if (isKeyPressed("left")) camera.pos.x -= 10 / camera.realZoom;
    if (isKeyPressed("right")) camera.pos.x += 10 / camera.realZoom;
    if (isKeyPressed("up")) camera.pos.y -= 10 / camera.realZoom;
    if (isKeyPressed("down")) camera.pos.y += 10 / camera.realZoom;

    if (isKeyPressed("q")) camera.pos = new Vector();


    // Update paths and agents on them
    paths.forEach(p => {
        p.update();
    });

    // Update soliders
    soliders.forEach(s => {
        s.update();
    });

    document.getElementById("text").textContent += "Speed: " + soliders[0]?.agent.speed + "\n";

    //camera.lookAt(new Vector(0, 0), true);
    camera.update();
}