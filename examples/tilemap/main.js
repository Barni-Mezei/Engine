/* MAIN */
let tilemap;

async function init() {
    //tilemap = new TileMap("terrain");
    tilemap = SimpleTileMap.importTilemap("terrain", 10, 0, await FileResource.getJson("terrain_tilemap"));
    //tilemap.fill("water");
    tilemap.setTileAt(new Vector(), "path_v");
}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);

    tilemap.render();
}

function update() {
    camera.update();
}