/* MAIN */
let tilemap;

async function init() {
    tilemap = new TileMap("terrain");
}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);

    tilemap.render();
}

function update() {
    camera.update();
}