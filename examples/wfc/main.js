/** @type {TileMap} */
let tilemap;

let editorPos = new Vector();
let cursorPos = new Vector();
let tilePos = new Vector();

let currentTile = "";
let currentTileIndex = 0;

let navStrength = 0;

let allLayers = ["graphics_0", "graphics_1", "navigation_0"];
let currentLayerIndex = 0;

const GRID_SIZE = new Vector(5, 5);

function init() {
    tilemap = new TileMap("terrain", {tileWidth: 16, tileHeight: 16}, GRID_SIZE.x, GRID_SIZE.y);

    tilemap.clear("graphics_0", "tile_0_0");

    console.log(tilemap);

    // Add navigation
    /*tilemap.clear("navigation_0", 1);
    tilemap.setGrid("navigation_0", Grid.fromArray([
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]))*/

    /*tilemap.clear("graphics_0", "tile_0_0");
    tilemap.clear("graphics_1", null);
    tilemap.clear("navigation_0", 0);*/

    editorPos = tilemap.center;

    //camera.settings.rounded = true;
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

    // Cursor and tile position
    cursorPos = camera.c2w(Vector.fromObject(input.mouse)).sub(tilemap.tileSize.mult(0.5));
    tilePos = cursorPos.mult(1 / tilemap.tileWidth).round()
    cursorPos = tilePos.mult(tilemap.tileWidth);
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
    ctx.rect(...camera.w2cf(cursorPos, tilemap.tileSize));
    ctx.stroke()

    document.getElementById("text").innerText += `Current tile [${currentTileIndex}]: ${currentTile}` + "\n";
}