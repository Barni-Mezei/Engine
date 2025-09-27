/* MAIN */
let tilemap;

async function init() {
    //tilemap = new TileMap("terrain");
    tilemap = TileMap.importTilemap("terrain", 5, 5, await FileResource.getJson("terrain_tilemap"));
    tilemap.fill("water");
}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);

    tilemap.render();
}

function update() {
    camera.update();
}