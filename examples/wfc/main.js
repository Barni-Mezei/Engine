/** @type {TileMap} */
let tilemap;

let editorPos = new Vector(); // World coordinate
let cursorPos = new Vector(); // Snapped world space coordinate
let tilePos = new Vector(); // Tilemap tile coordinate

let currentTileId = ""; // Name of the current tile

const GRID_SIZE = new Vector(5);

function fitToView() {
    editorPos = tilemap.center;
    camera.zoom = (Math.min(c.width, c.height) / Math.max(tilemap.size.x, tilemap.size.y)) * 0.9;
}

function iterate() {

    let remainingCells = tilemap.filter("graphics_0")

    tilemap.foreach("graphics_0", function (x, y, cell) {
        if (cell.id != null) return;
        console.log(x, y, cell);
    });
}

function init() {
    tilemap = new TileMap("terrain", {tileWidth: 16, tileHeight: 16}, GRID_SIZE.x, GRID_SIZE.y);

    /*
    w: Water
    s: Sand
    g: Grass
    m: Meadow
    f: Forest
    p: Path
    */

    function addTileRotated(y, name, sides, weight) {
        tilemap.setTileMeta(`tile_0_${y}`, "sides", [sides[0], sides[1], sides[2], sides[3]]);
        tilemap.setTileMeta(`tile_1_${y}`, "sides", [sides[3], sides[0], sides[1], sides[2]]);
        tilemap.setTileMeta(`tile_2_${y}`, "sides", [sides[2], sides[3], sides[0], sides[1]]);
        tilemap.setTileMeta(`tile_3_${y}`, "sides", [sides[1], sides[2], sides[3], sides[0]]);

        for (let i = 0; i < 4; i++) tilemap.setTileMeta(`tile_${i}_${y}`, "weight", weight);
        for (let i = 0; i < 4; i++) tilemap.renameTile(`tile_${i}_${y}`, `${name}_${i}`);
    }

    let iota = 0;
    addTileRotated(iota++, "water",              ["www", "www", "www", "www"], 1);
    addTileRotated(iota++, "forest",             ["fff", "fff", "fff", "fff"], 1);
    addTileRotated(iota++, "grass",              ["ggg", "ggg", "ggg", "ggg"], 1);
    addTileRotated(iota++, "path_crossing",      ["ppp", "ppp", "ppp", "ppp"], 1);
    addTileRotated(iota++, "shore",              ["wsg", "ggg", "gsw", "www"], 1);
    addTileRotated(iota++, "water_corner",       ["wsg", "ggg", "ggg", "gsw"], 1);
    addTileRotated(iota++, "island_corner",      ["wsg", "gsw", "www", "www"], 1);
    addTileRotated(iota++, "forest_edge",        ["fmg", "ggg", "gmf", "fff"], 1);
    addTileRotated(iota++, "corner_forest_edge", ["fmg", "ggg", "ggg", "gmf"], 1);
    addTileRotated(iota++, "clearing_corner",    ["fmg", "gmf", "fff", "fff"], 1);
    addTileRotated(iota++, "staright_path",      ["gpg", "ggg", "gpg", "ggg"], 1);
    addTileRotated(iota++, "corner_path",        ["gpg", "gpg", "ggg", "ggg"], 1);
    addTileRotated(iota++, "path_junction",      ["gpg", "gpg", "ggg", "gpg"], 1);
    addTileRotated(iota++, "square",             ["gpg", "ggg", "ggg", "ggg"], 1);

    tilemap.clear("graphics_0", null);

    tilemap.setTileAt(0, new Vector(1, 1), "water_corner_0");

    //console.dir(tilemap.tiles);

    console.dir(tilemap.getTileMetaAt(0, new Vector(), "sides"));

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

    fitToView();
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

    if (isKeyPressed("f")) {
        fitToView();
    }

    if (isKeyJustPressed("space")) {
        iterate();
    }

    camera.clampValues();
    camera.lookAt(editorPos, true);
    camera.update();

    // Cursor and tile position
    cursorPos = camera.c2w(Vector.fromObject(input.mouse)).sub(tilemap.tileSize.mult(0.5));
    tilePos = cursorPos.mult(1 / tilemap.tileWidth).round()
    cursorPos = tilePos.mult(tilemap.tileWidth);
    currentTileId = tilemap.getTileAt(0, tilePos);
}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);

    tilemap.render("#44444488", camera.w2csX(0.5));

    
    // Current hovered tile

    if (currentTileId != null) {
        ctx.drawImage(
            tilemap.getTileById(currentTileId).texture,
            c.width - 50, 0, 50, 50
        );
    }

    // Tile cursor
    ctx.strokeStyle = "#00ddff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(...camera.w2cf(cursorPos, tilemap.tileSize));
    ctx.stroke()

    document.getElementById("text").innerText += `Cursor: ${tilePos.x};${tilePos.y}` + "\n";
    document.getElementById("text").innerText += `CursoCurrent tile: ${currentTileId}` + "\n";
}