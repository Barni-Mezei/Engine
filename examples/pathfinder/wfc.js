// Helper functions
function visualiseEntropy() {
    tilemap.foreach("graphics_0", function (x, y, tile) {
        tilemap.setTileNavigationAt(0, new Vector(x, y), ((tile.meta?.possible?.length ?? 0) + 1) / tilemap.tileCount);
    });
}

function eraseGrid() {
    tilemap.clear("graphics_0", null);
    tilemap.foreach("graphics_0", function (x, y, tile) {
        tile.meta.possible = tilemap.tileIds;
    });
}

function placeRandomTile() {
    let pos = new Vector(randInt(0, tilemap.width), randInt(0, tilemap.height));
    let chosenTile = tilemap.tileIds[randInt(0, tilemap.tileIds.length - 1)];

    tilemap.setTileAt(0, pos, chosenTile);
    tilemap.setTileMetaAt(0, pos, "possible", [chosenTile]);

    updateEntropy(pos.x, pos.y);
}

function eraseSection(centerX, centerY, width, height) {
    let startX = Math.round(centerX - width / 2);
    let startY = Math.round(centerY - height / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            tilemap.setTileAt(0, new Vector(startX + x, startY + y), null);
            tilemap.setTileMetaAt(0, new Vector(startX + x, startY + y), "possible", tilemap.tileIds);
        }
    }

    //updateEntropy(startX + x, startY + y);
    updateEntropy(centerX, centerY);
}

// Generator functions
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
    let MAX_ITER = 10; //GRID_SIZE.x * GRID_SIZE.y;

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
                top = [...top, ...getAllowedTiles(possibleValue, 2)];
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
                right = [...right, ...getAllowedTiles(possibleValue, 3)];
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
                bottom = [...bottom, ...getAllowedTiles(possibleValue, 0)];
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
                left = [...left, ...getAllowedTiles(possibleValue, 1)];
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
        if (tilemap.getTileMetaAt(0, currrentTilePos, "sides")) continue; // Keep collapsed tiles intact
        tilemap.setTileMetaAt(0, currrentTilePos, "possible", Array(...allowedTiles));
    }
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
        generationDone()
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

    let lowestEntropyCell = cells[randInt(0, sameEntropy - 1)];

    let possibleValues = tilemap.getTileMetaAt(0, lowestEntropyCell.pos).possible;

    if (possibleValues.length == 0) {
        ATTEMPTS++;

        eraseSection(lowestEntropyCell.pos.x, lowestEntropyCell.pos.y, 5, 5);

        return;
    }

    let tileWeights = {};
    let tileWeightSum = 0;

    for (let key of possibleValues) {
        tileWeights[key] = tilemap.getTileMeta(key, "weight");
        tileWeightSum += tileWeights[key];
    }

    // Normailse weights
    for (let key in tileWeights) {
        tileWeights[key] /= tileWeightSum;
    }

    let chosenTile = weightedRandom(tileWeights);

    tilemap.setTileAt(0, lowestEntropyCell.pos, chosenTile);
    tilemap.setTileMetaAt(0, lowestEntropyCell.pos, "possible", [chosenTile]);

    updateEntropy(lowestEntropyCell.pos.x, lowestEntropyCell.pos.y);

    lastCell = lowestEntropyCell.pos;
}