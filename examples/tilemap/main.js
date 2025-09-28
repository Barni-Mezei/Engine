/* MAIN */
let tilemap;

let editorPos = new Vector();
let cursorPos = new Vector();
let tilePos = new Vector();
let currentTile = "";
let currentTileIndex = 0;

async function init() {
    tilemap = SimpleTileMap.importTilemap("terrain", 0, 0, await FileResource.getJson("terrain_tilemap"));
    tilemap.grid.resize(18, 18);
    tilemap.fill("path_v");
    tilemap._updateTileMapSize();

    editorPos = tilemap.center;

    camera.settings.glideSpeed = 0.25;
    camera.settings.zoomSpeed = -1;
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

    if (isKeyPressed("add")) {
        camera.zoom += 0.1 * camera.realZoom;
    }

    if (isKeyPressed("sub")) {
        camera.zoom -= 0.1 * camera.realZoom;
    }

    camera.clampValues();
    camera.lookAt(editorPos);
    camera.update();

    // Editor controls

    // Cursor and tile position
    cursorPos = camera.c2w(Vector.fromObject(input.mouse)).sub(tilemap.gridTileSize.mult(0.5));
    tilePos = cursorPos.mult(1 / tilemap.gridTileSize.x).round()
    cursorPos = tilePos.mult(tilemap.gridTileSize.x);

    if (isKeyJustPressed("q")) {
        currentTileIndex -= 1;
    }

    if (isKeyJustPressed("e")) {
        currentTileIndex += 1;
    }

    if (currentTileIndex < 0) currentTileIndex = Object.keys(tilemap.tiles).length - 1;
    if (currentTileIndex > Object.keys(tilemap.tiles).length - 1) currentTileIndex = 0;

    currentTile = tilemap.tiles[ Object.keys(tilemap.tiles)[currentTileIndex] ].id;

    // Set tiles
    if (input.mouse.down) {
        tilemap.setTileAt(tilePos, currentTile);
    }
}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);

    tilemap.render("#444", camera.w2csX(0.5));

    // Center
    /*ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(...camera.w2cXY(editorPos.x, editorPos.y), 10, 0, Math.PI * 2);
    ctx.fill()*/

    // Tile cursor
    ctx.strokeStyle = "#00ddff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(...camera.w2cf(cursorPos, tilemap.gridTileSize));
    ctx.stroke()

    document.getElementById("text").innerText += `${tilePos.x}, ${tilePos.y}: ${tilemap.getTileAt(tilePos)}` + "\n";
    document.getElementById("text").innerText += `Current tile [${currentTileIndex}]: ${currentTile}` + "\n";
}