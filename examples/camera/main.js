let player = {
    texture: new Texture("player"),
    pos: new Vector(),
    speed: 10,
}

let objects = [];

let follow = true;

function init() {
    for (let i = 0; i < 500; i++) {
        let textureInstance = new Texture("grass");

        let x = randInt(-40, 40) * 50;
        let y = randInt(-40, 40) * 50;

        objects.push({
            pos: new Vector(x, y),

            texture: textureInstance,
        });
    }

    //player.texture = new Texture("player");
}

function update() {
    let playerVel = new Vector();

    if (isKeyPressed("moveLeft")) playerVel.x -= 1;
    if (isKeyPressed("moveRight")) playerVel.x += 1;
    if (isKeyPressed("moveUp")) playerVel.y -= 1;
    if (isKeyPressed("moveDown")) playerVel.y += 1;

    playerVel = playerVel.unit(player.speed);

    player.pos = player.pos.add( playerVel );

    if (isKeyPressed("left")) camera.pos.x -= 10 / camera.realZoom;
    if (isKeyPressed("right")) camera.pos.x += 10 / camera.realZoom;
    if (isKeyPressed("up")) camera.pos.y -= 10 / camera.realZoom;
    if (isKeyPressed("down")) camera.pos.y += 10 / camera.realZoom;

    if (isKeyPressed("add")) camera.zoom += 0.1;
    if (isKeyPressed("sub")) camera.zoom -= 0.1;

    camera.clampValues();

    if (isKeyJustPressed("space")) {
        follow = !follow;

        new Sound(follow ? "switch_on" : "switch_off");
    }

    if (follow) camera.lookAt(player.pos.add(new Vector(50, 50)), true);

    camera.update();
}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);

    objects.forEach((o, i) => {
        camera.renderTexture(o.texture, ...o.pos.toArray(), 50, 50);
    });

    camera.renderTexture(player.texture, ...player.pos.toArray(), 100, 100);

    /*ctx.fillStyle = "#888888";
    ctx.fillRect(0, 0, 200, 200);
    ctx.drawImage(objects[0].texture.image, 0, 0, 200, 200);*/

    document.getElementById("text").textContent += `Player pos: ${round(player.pos.x, 0)}, ${round(player.pos.y, 0)}\n`;
    document.getElementById("text").textContent += `Following: ${follow}\n`;
    document.getElementById("text").textContent += `Down: '${input.keys.pressed}'\n`;
    document.getElementById("text").textContent += `Just: '${input.keys.justPressed}'\n`;
    document.getElementById("text").textContent += `Cache size: ${Object.keys(Resource._parallelCache).length}\n`;
}