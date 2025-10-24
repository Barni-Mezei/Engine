/** @type {TileMap} */
let tilemap;

let editorPos = new Vector(); // World coordinate
let cursorPos = new Vector(); // Snapped world space coordinate
let tilePos = new Vector(); // Tilemap tile coordinate

let markerPos = new Vector(); // Error marker position
let lastCell = new Vector();

let currentTileId = ""; // Name of the current tile

const colors = {
    "s": "#ffff00", // Sand
    "S": "#ffffff", // Skull
    "r": "#333322", // Ridge
    "R": "#333322", // Big ridge
    "h": "#74743fff", // Hole

    // Special connectors
    "1": "#ff0000",
    "2": "#00ff00",
    "3": "#0000ff",
    "4": "#ff00ff",
    "5": "#a6c400ff",
    "6": "#00ffff",
    "7": "#ffffff",
    "8": "#fc7100ff",
    "9": "#f700ffff",
    "a": "#00ff95ff",
    "b": "#6200ffff",
    "c": "#91ff00ff",
    "d": "#ff0000",
    "e": "#00ff00",
    "f": "#0000ff",
    "g": "#ff00ff",
    //"h": "",
    "i": "#00ffff",
    "j": "#ffffff",
    "k": "#fc7100ff",
    "l": "#f700ffff",
    "m": "#00ff95ff",
    "n": "#6200ffff",
    "o": "#91ff00ff",
    "p": "#ff0000",
    "q": "#00ff00",
    //"r": "",
    //"s": "",
    "t": "#a6c400ff",
    "u": "#00ffff",
    "v": "#ffffff",
    "w": "#fc7100ff",
    "x": "#f700ffff",
    "y": "#00ff95ff",
    "z": "#6200ffff",
}

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
        tilemap.setTileNavigationAt(0, new Vector(x, y), ((tile.meta?.possible?.length ?? 0) + 1) / (tilemap.tileCount + 1));
    });
}

// WFC logic

function getAllowedTiles(currentTile, sideIndex) {
    if (currentTile == null) return tilemap.tileIds;

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
    let MAX_ITER = 10 //GRID_SIZE.x * GRID_SIZE.y;

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

        /*console.groupCollapsed(currrentTilePos);
        console.log(`${topTilePos.x};${topTilePos.y}`);*/

        if (grid.isInGrid(currrentTilePos.x, currrentTilePos.y - 1)) {
            let top = [];
            for (let possibleValue of tilemap.getTileMetaAt(0, topTilePos).possible) {
                top = top + getAllowedTiles(possibleValue, 2);
            }
            let oldSize = allowedTiles.size;

            for (let side of allowedTiles) {
                if (!top.includes(side)) allowedTiles.delete(side);
            }

            //console.log(oldSize, allowedTiles.size, oldSize != allowedTiles.size, needsUpdating);
            if (oldSize != allowedTiles.size) {
                //console.log("top allows: ", top);
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

            //console.log(oldSize, allowedTiles.size, oldSize != allowedTiles.size, needsUpdating);
            if (oldSize != allowedTiles.size) {
                //console.log("right allows: ", right);
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

            //console.log(oldSize, allowedTiles.size, oldSize != allowedTiles.size, needsUpdating);
            if (oldSize != allowedTiles.size) {
                //console.log("bottom allows: ", bottom);
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

            //console.log(oldSize, allowedTiles.size, oldSize != allowedTiles.size, needsUpdating);
            if (oldSize != allowedTiles.size) {
                //console.log("left allows: ", left);
                addSides(needsUpdating, currrentTilePos);
            }
        }

        /*console.log("result", allowedTiles);

        console.groupEnd();*/
        if (tilemap.getTileMetaAt(0, currrentTilePos, "sides")) continue; // Keep collapsed tiles intacted
        tilemap.setTileMetaAt(0, currrentTilePos, "possible", Array(...allowedTiles));
    }
}

function eraseGrid() {
    tilemap.clear("graphics_0", null);

    tilemap.setGrid("graphics_0", new Grid(GRID_SIZE.x, GRID_SIZE.y, {id: null, meta: {possible: tilemap.tileIds}}))
    /*tilemap.foreach("graphics_0", function (x, y, tile) {
        tile.meta.possible = tilemap.tileIds;
    });*/

    placeRandomTile("sand_" + randInt(0, 5));

    //visualiseEntropy();
}

function placeRandomTile(tileId) {
    let pos = new Vector(randInt(0, tilemap.width), randInt(0, tilemap.height));

    tilemap.setTileAt(0, pos, tileId);
    tilemap.setTileMetaAt(0, pos, "possible", [tileId]);

    updateEntropy(pos.x, pos.y);
}

function eraseSection(centerX, centerY, width, height) {
    let startX = Math.round(centerX - width / 2);
    let startY = Math.round(centerY - height / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            tilemap.setTileAt(0, new Vector(startX + x, startY + y), null);
            tilemap.setTileMetaAt(0, new Vector(startX + x, startY + y), "possible", tilemap.tileIds);
            updateEntropy(centerX, centerY);
        }
    }

    //visualiseEntropy();
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

    let sameEntropy = cells.length;
    for (let i = 0; i < cells.length; i++) {
        if (cells[i].entropy > cells[0].entropy) {
            sameEntropy = i;
            break;
        }
    }

    //let lowestEntropyCell = cells[randInt(0, sameEntropy - 1)];
    let lowestEntropyCell = cells[0];

    let possibleValues = tilemap.getTileMetaAt(0, lowestEntropyCell.pos).possible;

    //console.log(possibleValues);

    if (possibleValues.length == 0) {
        ATTEMPTS++;
        //console.log("%cRestarting...", "font-size: 20px; color: #ff4400;");

        //tilemap.setTileAt(0, lowestEntropyCell.pos, "error_0");
        //tilemap.setTileMetaAt(0, lowestEntropyCell.pos, "possible", tilemap.tileIds);
        //DONE = true;

        //console.log(cells);

        markerPos = lastCell;

        //eraseSection(lastCell, lastCell, 1, 1);

        eraseGrid();
        return;
    }

    // TODO: Use weighted random
    let chosenTile = possibleValues[randInt(0, possibleValues.length - 1)];

    tilemap.setTileAt(0, lowestEntropyCell.pos, chosenTile);
    tilemap.setTileMetaAt(0, lowestEntropyCell.pos, "possible", [chosenTile]);

    updateEntropy(lastCell.x, lastCell.y);
    //visualiseEntropy();

    lastCell = lowestEntropyCell.pos;

    //debugger;
}

// Game loop

/* TODO:

- left clik to paint tiles
- right click to erase tiles
- erased chunks regenerate

- generate in overlapping chunks
- muti thread in checkerboard chunks, or halves of the map

- select an area to generate in, and press space to start and stop generation.
  on errorr, a red tile shows up at the impossible spot. if outo-erase is enabled, then a 5x5 area
  wil be eresed around it and the generation resumes.

- walking character

*/

function init() {
    tilemap = new TileMap("desert", {tileWidth: 32, tileHeight: 32}, GRID_SIZE.x, GRID_SIZE.y);

    for (let tile of tilemap.tileIds) {
        tilemap.setTileMeta(tile, "weight", 1);
        tilemap.setTileMeta(tile, "sides", ["??1??", "??2??", "??3??", "??4??"]);

    }

    function addTile(x, y, name, sides, weight) {
        tilemap.setTileMeta(`tile_${x}_${y}`, "sides", [sides[0], sides[1], sides[2], sides[3]]);
        tilemap.setTileMeta(`tile_${x}_${y}`, "weight", weight);
        tilemap.renameTile(`tile_${x}_${y}`, `${name}`);
    }

    function addFeature(startX, startY, width, height, name, letter, rules) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let tileX = startX + x;
                let tileY = startY + y;

                let sides = [];

                for (let i = 0; i < 4; i++) {
                    if (rules[y][x][i] == "x") {
                        sides.push("sssss");
                    } else {
                        sides.push(`s${letter}${rules[y][x][i]}${letter}s`);
                    }
                }

                addTile(tileX, tileY, `${name}_${x}_${y}`, sides, 1);
            }
        }
    }

    // Sand tiles
    addTile(0, 0, "sand_0",  ["sssss", "sssss", "sssss", "sssss"], 1);
    addTile(1, 0, "sand_1",  ["sssss", "sssss", "sssss", "sssss"], 1);
    addTile(2, 0, "sand_2",  ["sssss", "sssss", "sssss", "sssss"], 1);
    addTile(3, 0, "sand_3",  ["sssss", "sssss", "sssss", "sssss"], 1);
    addTile(2, 1, "sand_4",  ["sssss", "sssss", "sssss", "sssss"], 1);
    addTile(3, 1, "sand_5",  ["sssss", "sssss", "sssss", "sssss"], 1);
    addTile(2, 2, "sand_6",  ["sssss", "sssss", "sssss", "sssss"], 1);
    addTile(3, 2, "sand_7",  ["sssss", "sssss", "sssss", "sssss"], 1);
    addTile(3, 3, "sand_8",  ["sssss", "sssss", "sssss", "sssss"], 1);
    addTile(3, 4, "sand_9",  ["sssss", "sssss", "sssss", "sssss"], 1);
    addTile(3, 5, "sand_10", ["sssss", "sssss", "sssss", "sssss"], 1);

    // Strict small ridge, always 2x2
    addFeature(0,1, 2,2, "ridge", "r", [
        ["x12x", "xx31"],
        ["24xx", "3xx4"],
    ]);

    // Strict hole, always 3x3
    /*addFeature(0,3, 3,3, "hole", "h", [
        ["x12x", "x341", "xx53"],
        ["267x", "4896", "5xa8"],
        ["7bxx", "9cxb", "axxc"],
    ]);*/

    // Variable sized hole
    addFeature(0,3, 3,3, "hole", "h", [
        ["x12x", "x131", "xx41"],
        ["232x", "3333", "4x43"],
        ["25xx", "35x5", "4xx5"],
    ]);

    // Strict crater, always 3x3
    addFeature(0,6, 3,3, "crater", "l", [
        ["x12x", "x341", "xx53"],
        ["267x", "4896", "5xa8"],
        ["7bxx", "9cxb", "axxc"],
    ]);

    // Strict 5x3 template
    /*addFeature(0,9, 3,5, "", "A", [
        ["x12x", "x341", "xx53"],
        ["267x", "4896", "5xa8"],
        ["7bcx", "9deb", "axfd"],
        ["cghx", "eijg", "fxki"],
        ["hlxx", "jmxl", "kxxm"],
    ]);*/

    // Strict big ridge, always 3x5
    /*addFeature(0,9, 3,5, "big_ridge", "n", [
        ["????", "x12x", "xx31"],
        ["x45x", "2674", "3x86"],
        ["59ax", "7bc9", "8xxb"],
        ["adxx", "cxed", "????"],
        ["????", "exxx", "????"],
    ]);*/

    // Strict small crater, always 2x2
    addFeature(0,14, 2,2, "small_crater", "c", [
        ["x12x", "xx31"],
        ["24xx", "3xx4"],
    ]);

    // Strict 4x5 template
    /*addFeature(0,16, 4,5, "", "B", [
        ["x12x", "x341", "x563", "xx75"],
        ["289x", "4ab8", "6cda", "7xec"],
        ["9fgx", "bhif", "djkh", "exlj"],
        ["gmnx", "iopm", "kqro", "rxsq"],
        ["ntxx", "puxt", "rvxu", "sxxv"],
    ]);*/

    //Skull, always 4x5
    /*addFeature(0,16, 4,5, "", "z", [
        ["x12x", "x341", "x563", "xx75"],
        ["289x", "4ab8", "6cda", "7xec"],
        ["9fgx", "bhif", "djkh", "exlj"],
        ["gmxx", "iopm", "kqro", "rxsq"],
        ["???", "puxx", "rvxu", "sxxv"],
    ]);*/


    eraseGrid();

    
    // Initialise camera
    fitToView();
    //visualiseEntropy();
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

    if (input.mouse.down) {
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



    
    camera.clampValues();
    camera.lookAt(editorPos, true);
    camera.update();

    // Cursor and tile position
    cursorPos = camera.c2w(Vector.fromObject(input.mouse)).sub(tilemap.tileSize.mult(0.5));
    tilePos = cursorPos.mult(1 / tilemap.tileWidth).round()
    cursorPos = tilePos.mult(tilemap.tileWidth);
    currentTileId = tilemap.getTileAt(0, tilePos);

    // Tilemap updating functions
    for (let i = 0; i < 10; i++) {
        iterate();
    }


    if (isKeyPressed("space")) {
    ATTEMPTS = 0;
        eraseGrid();
        DONE = false;
    }

    if (input.mouse.right) {
        eraseSection(tilePos.x, tilePos.y, 5, 5);
        DONE = false;
    }
}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);

    tilemap.render("#44444488", camera.w2csX(0.5), false, true);
    //tilemap.render("#00000000", 0, false, true);

    
    // Current hovered tile
    if (currentTileId != null) {
        let currentSides = tilemap.getTileMeta(currentTileId).sides;
        let iconSize = new Vector(100);
        let dotGap = new Vector(iconSize.x / currentSides[0].length, iconSize.y / currentSides[1].length);
        let startX = c.width - iconSize.x;
        let startY = 0;

        ctx.drawImage(
            tilemap.getTileById(currentTileId).texture,
            startX, startY, iconSize.x, iconSize.y
        );


        for (let i = 0; i < currentSides[0].length; i++) {
            // Top edge
            ctx.fillStyle = colors[currentSides[0][i]] ?? "#000000";

            ctx.beginPath();
            ctx.arc(startX + (i + 0.5) * dotGap.x, startY + 5, 5, 0, Math.PI*2);
            ctx.fill();

            // Right edge
            ctx.fillStyle = colors[currentSides[1][i]] ?? "#000000";

            ctx.beginPath();
            ctx.arc(startX + iconSize.x - 5, startY + (i + 0.5) * dotGap.x, 5, 0, Math.PI*2);
            ctx.fill();

            // Bottom edge
            ctx.fillStyle = colors[currentSides[2][i]] ?? "#000000";

            ctx.beginPath();
            ctx.arc(startX + (i + 0.5) * dotGap.x, startY + iconSize.y - 5, 5, 0, Math.PI*2);
            ctx.fill();

            // Left edge
            ctx.fillStyle = colors[currentSides[3][i]] ?? "#000000";

            ctx.beginPath();
            ctx.arc(startX + 5, startY + (i + 0.5) * dotGap.x, 5, 0, Math.PI*2);
            ctx.fill();
        }
    }

    // Marker
    /*if (markerPos.x > -1) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = camera.w2csX(4);
        ctx.beginPath();
        ctx.rect(...camera.w2cf(markerPos.mult(tilemap.tileSize), tilemap.tileSize));
        ctx.stroke()
    }*/

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