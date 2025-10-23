/** @type {TileMap} */
let tilemap;

let editorPos = new Vector(); // World coordinate
let cursorPos = new Vector(); // Snapped world space coordinate
let tilePos = new Vector(); // Tilemap tile coordinate

let currentTileId = ""; // Name of the current tile

const GRID_SIZE = new Vector(10);

let DONE = false;
let ATTEMPTS = 0;

/* Helper functions */
function fitToView() {
    editorPos = tilemap.center;
    camera.zoom = (Math.min(c.width, c.height) / Math.max(tilemap.size.x, tilemap.size.y)) * 0.9;
}

function visualiseEntropy() {
    tilemap.foreach("graphics_0", function (x, y, tile) {
        tilemap.setTileNavigationAt(0, new Vector(x, y), (tile.meta?.possible?.length / tilemap.tileCount));
    });
}

// WFC logic

function getAllowedTiles(currentTile, sideIndex) {
    if (currentTile == null) return Object.keys(tilemap.tiles);

    let reversedTileSide = tilemap.getTileMeta(currentTile).sides[sideIndex].split("").reverse().join("");

    let out = [];

    for (let tileId in tilemap.tiles) {
        let currentTileSide = tilemap.tiles[tileId].meta.sides[(sideIndex + 2) % 4];

        if (reversedTileSide == currentTileSide) out.push(tileId);
    }

    return out;
}

function updateEntropy(x, y) {
    let needsUpdating = [];

    needsUpdating.push(`${x};${y - 1}`);
    needsUpdating.push(`${x + 1};${y}`);
    needsUpdating.push(`${x};${y + 1}`);
    needsUpdating.push(`${x - 1};${y}`);

    let iter = 0;
    let MAX_ITER = GRID_SIZE.x * GRID_SIZE.y;



    function addIfUnique(array, value) {
        if (!array.includes(value)) array.push(value);
    }

    function getSides(x, y) {
        return [
            new Vector(x, y - 1),
            new Vector(x + 1, y),
            new Vector(x, y + 1),
            new Vector(x - 1, y),
        ]
    }

    function addSides(array, pos) {
        for (let side of getSides(pos.x, pos.y)) {
            addIfUnique(array, `${side.x};${side.y}`);
        }
    }



    let grid = tilemap.getGrid("graphics_0");

    for (let i = 0; i < needsUpdating.length; i++) {
        //console.log(i, iter, needsUpdating[i].split(";"), needsUpdating.length);
        if (iter++ > MAX_ITER) break;

        let splitPos = needsUpdating[i].split(";");
        let currrentTilePos = new Vector(parseInt(splitPos[0]), parseInt(splitPos[1]));
        
        let topTilePos = currrentTilePos.add(new Vector(0, -1));
        let rightTilePos = currrentTilePos.add(new Vector(1, 0));
        let bottomTilePos = currrentTilePos.add(new Vector(0, 1));
        let leftTilePos = currrentTilePos.add(new Vector(-1, 0));


        let allowedTiles = new Set(tilemap.getTileMetaAt(0, currrentTilePos, "possible"));

        console.groupCollapsed(currrentTilePos);
        console.log(`${topTilePos.x};${topTilePos.y}`);

        if (grid.isInGrid(currrentTilePos.x, currrentTilePos.y - 1)) {
            let top = [];
            for (let possibleValue of tilemap.getTileMetaAt(0, topTilePos).possible) {
                top = top + getAllowedTiles(possibleValue, 2);
            }
            let oldSize = allowedTiles.size;

            for (let side of allowedTiles) {
                if (!top.includes(side)) allowedTiles.delete(side);
            }

            console.log(oldSize, allowedTiles.size, oldSize != allowedTiles.size, needsUpdating);
            if (oldSize != allowedTiles.size) {
                console.log("top allows: ", top);
                addSides(needsUpdating, currrentTilePos);
            }
        }

        if (grid.isInGrid(currrentTilePos.x + 1, currrentTilePos.y)) {
            let right = [];
            for (let possibleValue of tilemap.getTileMetaAt(0, rightTilePos).possible) {
                right = right + getAllowedTiles(possibleValue, 3);
            }
            let oldSize = allowedTiles.size;
            
            for (let side of allowedTiles) {
                if (!right.includes(side)) allowedTiles.delete(side);
            }

            console.log(oldSize, allowedTiles.size, oldSize != allowedTiles.size, needsUpdating);
            if (oldSize != allowedTiles.size) {
                console.log("right allows: ", right);
                addSides(needsUpdating, currrentTilePos);
            }
        }


        if (grid.isInGrid(currrentTilePos.x, currrentTilePos.y + 1)) {
            let bottom = [];
            for (let possibleValue of tilemap.getTileMetaAt(0, bottomTilePos).possible) {
                bottom = bottom + getAllowedTiles(possibleValue, 0);
            }
            let oldSize = allowedTiles.size;
            
            for (let side of allowedTiles) {
                if (!bottom.includes(side)) allowedTiles.delete(side);
            }

            console.log(oldSize, allowedTiles.size, oldSize != allowedTiles.size, needsUpdating);
            if (oldSize != allowedTiles.size) {
                console.log("bottom allows: ", bottom);
                addSides(needsUpdating, currrentTilePos);
            }
        }


        if (grid.isInGrid(currrentTilePos.x - 1, currrentTilePos.y)) {
            let left = [];
            for (let possibleValue of tilemap.getTileMetaAt(0,leftTilePos).possible) {
                left = left.concat(getAllowedTiles(possibleValue, 1));
            }

            let oldSize = allowedTiles.size;

            for (let side of allowedTiles) {
                if (!left.includes(side)) allowedTiles.delete(side);
            }

            console.log(oldSize, allowedTiles.size, oldSize != allowedTiles.size, needsUpdating);
            if (oldSize != allowedTiles.size) {
                console.log("left allows: ", left);
                addSides(needsUpdating, currrentTilePos);
            }
        }

        console.log("result", allowedTiles);

        console.groupEnd();

        tilemap.setTileMetaAt(0, currrentTilePos, "possible", Array(...allowedTiles));
    }
}

function eraseGrid() {
    tilemap.clear("graphics_0", null);
    tilemap.foreach("graphics_0", function (x, y, tile) {
        tilemap.setTileMetaAt(0, new Vector(x, y), "possible", structuredClone(Object.keys(tilemap.tiles)) );
    });

    visualiseEntropy();
}

function iterate() {
    if (DONE) return;

    let cells = [];

    tilemap.foreach("graphics_0", function (x, y, tile) {
        if (tile.id !== null) return;

        cells.push({
            pos: new Vector(x, y),
            entropy: tile.meta.possible.length ?? 9999, // Use weights for entropy calculation
        });
    });

    if (cells.length == 0) {
        DONE = true;
        console.log("%cDone!", "font-size: 20px; color: #66ff00;");
        return;
    }

    cells.sort(function (a, b) {
        return a.entropy - b.entropy;
    });

    let lowestEntropyCell = cells[0];

    let possibleValues = tilemap.getTileMetaAt(0, lowestEntropyCell.pos).possible;

    console.log(possibleValues);

    if (possibleValues.length == 0) {
        ATTEMPTS++;
        console.log("%cRestarting...", "font-size: 20px; color: #ff4400;");

        eraseGrid();
        return;
    }

    // TODO: Use weighted random
    let chosenTile = possibleValues[randInt(0, possibleValues.length - 1)];

    tilemap.setTileAt(0, lowestEntropyCell.pos, chosenTile);
    tilemap.setTileMetaAt(0, lowestEntropyCell.pos, "possible", [chosenTile]);

    updateEntropy(lowestEntropyCell.pos.x, lowestEntropyCell.pos.y);
    visualiseEntropy();
}

// Game loop

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

        for (let i = 0; i < 4; i++) {
            tilemap.setTileMeta(`tile_${i}_${y}`, "weight", weight);
            tilemap.renameTile(`tile_${i}_${y}`, `${name}_${i}`);
        }
    }

    let iota = 0;
    addTileRotated(iota++, "water",              ["www", "www", "www", "www"], 1);
    addTileRotated(iota++, "forest",             ["fff", "fff", "fff", "fff"], 1);
    addTileRotated(iota++, "grass",              ["ggg", "ggg", "ggg", "ggg"], 1);
    addTileRotated(iota++, "path_crossing",      ["gpg", "gpg", "gpg", "gpg"], 1);
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

    eraseGrid();

    // Initialise camera
    fitToView();
    visualiseEntropy();
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

    if (isKeyPressed("space")) {
        for (let i = 0; i < 5; i++) {
            iterate();
        }
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

    tilemap.render("#44444488", camera.w2csX(0.5), false, true);

    
    // Current hovered tile
    if (currentTileId != null) {
        ctx.drawImage(
            tilemap.getTileById(currentTileId).texture,
            c.width - 100, 0, 100, 100
        );
    }

    // Tile cursor
    /*ctx.strokeStyle = "#00ddff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(...camera.w2cf(cursorPos, tilemap.tileSize));
    ctx.stroke()*/

    document.getElementById("text").innerText += `Attempts: ${ATTEMPTS}` + "\n";
    document.getElementById("text").innerText += `Cursor: ${tilePos.x};${tilePos.y}` + "\n";
    document.getElementById("text").innerText += `Current tile: ${currentTileId}` + "\n";
    document.getElementById("text").innerText += `Entropy: ${tilemap.getTileNavigationAt(0, tilePos)}` + "\n";
    document.getElementById("text").innerText += `Tile meta: \n`;

    let tileMeta = tilemap.getTileMetaAt(0, tilePos);
    for (let key in tileMeta) {
        document.getElementById("text").innerText += `- ${key}[${tileMeta[key].length ?? "."}]: ${tileMeta[key]}\n`;
    }
}