/** @type {TileMap} */
let tilemap;

let editorPos = new Vector();
let cursorPos = new Vector();
let tilePos = new Vector();
let currentTile = "";
let currentTileIndex = 0;

let isDragging = false;

async function init() {
    tilemap = TileMap.importFromTiled("terrain", await FileResource.getJson("tiled_tilemap"));

    /*tilemap = new TileMap("terrain", {tileWidth: 16, tileHeight: 16}, 10, 10);

    tilemap.clear("graphics_0", "tile_0_0");
    let newLayerId = tilemap.addLayer("graphics");

    console.log(newLayerId);*/

    editorPos = tilemap.center;

    camera.settings.rounded = true;
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

    if (input.mouse.middle) {
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

    // Editor controls

    // Cursor and tile position
    cursorPos = camera.c2w(Vector.fromObject(input.mouse)).sub(tilemap.tileSize.mult(0.5));
    tilePos = cursorPos.mult(1 / tilemap.tileWidth).round()
    cursorPos = tilePos.mult(tilemap.tileWidth);

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
        tilemap.setTileAt(0, tilePos, currentTile);
    }

    // Reset tiles
    if (input.mouse.right) {
        tilemap.setTileAt(0, tilePos, null);
    }
}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);

    if (settings.debug.grid) {
        tilemap.render("#444", camera.w2csX(0.5));
    } else {
        tilemap.render();
    }

    // Center
    /*ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(...camera.w2cXY(editorPos.x, editorPos.y), 10, 0, Math.PI * 2);
    ctx.fill()*/

    // Tile cursor
    ctx.strokeStyle = "#00ddff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(...camera.w2cf(cursorPos, tilemap.tileSize));
    ctx.stroke()

    // Current tile display
    ctx.beginPath();
    ctx.fillStyle = "#000";
    ctx.fillRect(c.width - 52, 0, 52, 52);

    ctx.drawImage(
        tilemap.getTileById(currentTile).texture,
        c.width - 50, 0, 50, 50
    );

    document.getElementById("text").innerText += `${tilePos.x}, ${tilePos.y}: ${tilemap.getTileAt(0, tilePos)}` + "\n";
    document.getElementById("text").innerText += `Current tile [${currentTileIndex}]: ${currentTile}` + "\n";
}