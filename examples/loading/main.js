let items = {};
let blocks = {};

let player = {
    pos: new Vector(200, 200),
    texture: null,
    speed: 1,
}

let pos = new Vector();

let objects = [];
let size = new Vector(20, 20);

let fallOff = 2;

async function init() {
    items = await FileResource.getJson("item_list");
    blocks = await FileResource.getJson("block_list");

    for (let i = 0; i < 400; i++) {
        let newBlock = {
            texture: new Texture("grass"),
            pos: new Vector(
                (i % 20) * 100 - 850,
                Math.floor(i / 20) * 100 - 850
            ),
        };

        objects.push(newBlock);
    }

    player.texture = new Texture("player");

    camera.lookAt(player.pos, true);
}

function update(delta) {
    let playerVel = new Vector();

    if (isKeyPressed("moveLeft")) playerVel.x -= 1;
    if (isKeyPressed("moveRight")) playerVel.x += 1;
    if (isKeyPressed("moveUp")) playerVel.y -= 1;
    if (isKeyPressed("moveDown")) playerVel.y += 1;

    playerVel = playerVel.unit(player.speed * delta);

    player.pos = player.pos.add( playerVel );

    if (isKeyPressed("left")) pos.x -= 10
    if (isKeyPressed("right")) pos.x += 10
    if (isKeyPressed("up")) pos.y -= 10
    if (isKeyPressed("down")) pos.y += 10

    if (isKeyPressed("add")) fallOff += 0.025;
    if (isKeyPressed("sub")) fallOff -= 0.025;

    fallOff = clamp(fallOff, 0.25, 10);

    camera.lookAt(player.pos);
    camera.update();
}

function render() {
    ctx.clearRect(0, 0, c.width,c.height);

    objects.forEach((o, i) => {
        let d = distance(player.pos.x, player.pos.y, o.pos.x + pos.x, o.pos.y + pos.y);
        d = clamp(400 - d, 1, 50 * fallOff) / fallOff;

        if (d <= 51) camera.renderTexture(o.texture, ...o.pos.toArray(), 100, 100, 0, 51 - d);
    });

    camera.renderTexture(player.texture, ...player.pos.toArray(), 100, 100);

    /*ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(...camera.w2c(player.pos).toArray(), 5, 0, Math.PI*2);
    ctx.fill();*/

    /*document.getElementById("text").textContent += `Player pos: ${round(player.pos.x, 0)}, ${round(player.pos.y, 0)}\n`;
    document.getElementById("text").textContent += `Following: ${follow}\n`;
    document.getElementById("text").textContent += `Down: '${input.keys.pressed}'\n`;
    document.getElementById("text").textContent += `Just: '${input.keys.justPressed}'\n`;
    document.getElementById("text").textContent += `Cache size: ${Object.keys(Resource._parallelCache).length}\n`;*/
}