let items = {};
let blocks = {};

let player = {
    pos: new Vector(200, 200),
    texture : new Texture("player"),
    speed: 1,
}

let pos = new Vector();

let objects = [];

let follow = false;

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

}

function update() {
    let playerVel = new Vector();

    if (isKeyPressed("moveLeft")) playerVel.x -= 1;
    if (isKeyPressed("moveRight")) playerVel.x += 1;
    if (isKeyPressed("moveUp")) playerVel.y -= 1;
    if (isKeyPressed("moveDown")) playerVel.y += 1;

    playerVel = playerVel.unit(player.speed * time.delta);

    player.pos = player.pos.add( playerVel );

    if (isKeyPressed("left")) pos.x -= 10
    if (isKeyPressed("right")) pos.x += 10
    if (isKeyPressed("up")) pos.y -= 10
    if (isKeyPressed("down")) pos.y += 10

    //camera.lookAt(player.pos);
    camera.update();
}

function render() {
    ctx.clearRect(0, 0, c.width,c.height);

    /*objects.forEach((o, i) => {
        let d = distance(round(player.pos.x, -2), round(player.pos.y, -2), o.pos.x + pos.x, o.pos.y + pos.y);
        d = clamp(300 - d/2, 10, 100);
        camera.renderTexture(o.texture, ...o.pos.toArray(), d, d);
    });*/

    camera.renderTexture(player.texture, ...player.pos.toArray(), 100, 100);

    /*document.getElementById("text").textContent += `Player pos: ${round(player.pos.x, 0)}, ${round(player.pos.y, 0)}\n`;
    document.getElementById("text").textContent += `Following: ${follow}\n`;
    document.getElementById("text").textContent += `Down: '${input.keys.pressed}'\n`;
    document.getElementById("text").textContent += `Just: '${input.keys.justPressed}'\n`;
    document.getElementById("text").textContent += `Cache size: ${Object.keys(Resource._parallelCache).length}\n`;*/
}