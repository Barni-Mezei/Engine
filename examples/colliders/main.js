let editorPos = new Vector();
let mousePos = new Vector();

let objects = [];

function init() {
    objects.push(new ColliderAABB(new Vector(0, 0), new Vector(200, 100)));
    objects.push(new ColliderAABB(new Vector(300, 0), new Vector(100, 200)));

    objects.push(new ColliderCircle(new Vector(100, 200), 50));
    objects.push(new ColliderCircle(new Vector(300, 350), 100));
}

function update() {
    // Camera controls
    let movementSpeed = clamp(5 / camera.realZoom, 5, 50);

    if (isKeyPressed("w")) {
        editorPos.y -= movementSpeed;
    }

    if (isKeyPressed("s")) {
        editorPos.y += movementSpeed;
    }

    if (isKeyPressed("a")) {
        editorPos.x -= movementSpeed;
    }

    if (isKeyPressed("d")) {
        editorPos.x += movementSpeed;
    }

    if (input.mouse.left) {
        editorPos = editorPos.add( new Vector(input.mouse.prevX - input.mouse.x, input.mouse.prevY - input.mouse.y).mult(1 / camera.realZoom) );
    }

    if (isKeyPressed("add") || input.mouse.wheelUp) {
        camera.zoom += 0.1 * camera.realZoom;
        camera.clampValues();
        if (camera.zoom < camera.settings.maxZoom) editorPos = camera.c2w(Vector.fromObject(input.mouse).sub(c.center).mult(0.09).add(c.center));
    }

    if (isKeyPressed("sub") || input.mouse.wheelDown) {
        camera.zoom -= 0.1 * camera.realZoom;
        camera.clampValues();
        if (camera.zoom > camera.settings.minZoom) editorPos = camera.c2w(Vector.fromObject(input.mouse).sub(c.center).mult(-0.11).add(c.center));
    }

    camera.clampValues();
    camera.lookAt(editorPos, true);
    camera.update();

    mousePos = camera.c2w(Vector.fromObject(input.mouse));

    // Update colliders
    for (let o of objects) o.update();
}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);

    for (let o of objects) o.render();

    let mouseIsColliding = false;

    for (let o of objects) {
        if (o.isColliding(mousePos)) {
            mouseIsColliding = true;
            let resolutionVector = o.resolutionVector(mousePos);
            resolutionVector.render(...camera.w2cXY(mousePos.x, mousePos.y), camera.zoom, "#00ff00");
        }

        let point;

        point = o.closestPoint(mousePos);

        ctx.fillStyle = "#00ddff";
        ctx.beginPath();
        ctx.arc(...camera.w2c(point).toArray(), 4, 0, Math.PI * 2);
        ctx.fill();

        point = o.closestPointOnEdge(mousePos);

        ctx.fillStyle = "#dd00ff";
        ctx.beginPath();
        ctx.arc(...camera.w2c(point).toArray(), 4, 0, Math.PI * 2);
        ctx.fill();
    };

    // Origin
    /*ctx.fillStyle = mouseIsColliding ? "#00ff00" : "#ff0000";
    ctx.beginPath();
    ctx.arc(...camera.w2c(mousePos).toArray(), 4, 0, Math.PI * 2);
    ctx.fill();*/
}