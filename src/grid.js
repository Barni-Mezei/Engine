/**
 * Dependencies: vector
 */












class Grid {
    // Default cell value
    defaultValue = null;

    // Size of the grid
    size = new Vector();

    // The 2D array of cell data
    #data;

    get width() {
        return this.size.x;
    }

    get height() {
        return this.size.y;
    }

    constructor(width, height, defaultValue = null) {
        this.defaultValue = defaultValue;

        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width;x++) {
                row.push(this.defaultValue);
            }
            this.#data.push(row);
        }
    }

    isInGrid(x, y) {
        return x > 0 && x < this.size.x && y > 0 && y < this.size.y;
    }


    setCell(x, y, value) {
        if (!this.isInGrid(x, y)) return false;

        this.#data[y][x] = value;
        return true;
    }

    getCell(x, y, defaultValue = this.defaultValue) {
        if (!this.isInGrid(x, y)) return defaultValue;

        return this.#data[y][x]
    }


    greedyMesh() {
        /* On waht layer, output returned, Ggraphic, collision, nav.*/
    }


    /*
    When resizing a grid, the default values are NOT cloned, but rather set, so values may point to the same object, meaning every new cell will be the same
    
    */
    resize(newWidth, newHeight, defaultValue = this.defaultValue) {
        if (newWidth > this.size.x) {
            for (let y = 0; y < this.#data.length; y++) {
                let extraValues = Array(newWidth - this.size.x).fill(defaultValue);
                this.#data[y].concat(extraValues);
            }
        }
    }


    /** TODO
     * Assigns a body index to each of the cells in the given grid, based on the islands it finds.
     * @param {Array} grid A grid of cells
     * @param {Number} gridWidth The width of the grid (in cells)
     * @param {Number} gridHeight The height of the grid (in cells)
     * @returns {Number} The number of bodies found.
     */
    findIslands(grid, startIndex, gridWidth = (grid[0] ?? []).length, gridHeight = grid.length) {
        /*
        - clear the body indexes.
        
        - get one unassigned cell.
        floodfill all the connected cells.
        repeat.

        if no unassigned cells found: done
        */

        //Reset body colors
        bodyColors = [];

        //Clear the existing body indexs
        resetBodyIndexes();

        let unassignedCell = undefined;
        let currentBodyIndex = startIndex-1;

        while (true) {
            //Find an unassigned cell
            unassignedCell = findCellByBodyIndex(grid, -1);
            if (unassignedCell == undefined) break;
            
            let fillQueue = [];
            let processedCells = [];
            currentBodyIndex++;

            //console.groupCollapsed("Starting a new body");

            //Process next cell in the fillque and add neighbours (flood fill)
            let iter = 0;//Safety guard
            do {
                let cell = unassignedCell;
                if (iter != 0) { cell = fillQueue.pop(); }

                processedCells.push(cell);
                if (getBlockName(cell.type) == "air") continue;

                cell.bodyIndex = currentBodyIndex;

                //console.log("Iter:", iter, "cell:", cell);

                let topCell = undefined;
                let rightCell = undefined;
                let bottomCell = undefined;
                let leftCell = undefined;

                let x = cell.pos.x;
                let y = cell.pos.y;

                //Get neighbours
                if (cell.sides[0] == 1) { topCell = getGridCell(x, y - 1, grid); }
                if (cell.sides[1] == 1) { rightCell = getGridCell(x + 1, y, grid); }
                if (cell.sides[2] == 1) { bottomCell = getGridCell(x, y + 1, grid); }
                if (cell.sides[3] == 1) { leftCell = getGridCell(x - 1, y, grid); }

                //Remove connection if it is not in both ways
                if (topCell != undefined && topCell.sides[2] == 0) topCell = undefined;
                if (rightCell != undefined && rightCell.sides[3] == 0) rightCell = undefined;
                if (bottomCell != undefined && bottomCell.sides[0] == 0) bottomCell = undefined;
                if (leftCell != undefined && leftCell.sides[1] == 0) leftCell = undefined;

                //Add to queue if not added yet.
                if (topCell != undefined && processedCells.indexOf(topCell) == -1) fillQueue.push(topCell);
                if (rightCell != undefined && processedCells.indexOf(rightCell) == -1) fillQueue.push(rightCell);
                if (bottomCell != undefined && processedCells.indexOf(bottomCell) == -1) fillQueue.push(bottomCell);
                if (leftCell != undefined && processedCells.indexOf(leftCell) == -1) fillQueue.push(leftCell);

                iter++;
            } while (iter < gridWidth*gridHeight && fillQueue.length > 0);

            //console.log("Body finished with blocks:", iter);

            //console.groupEnd();
        };

        let numOfBodies = (currentBodyIndex - startIndex) + 1;

        //Add colors
        for (let i = 0; i < numOfBodies; i++) { bodyColors.push(getColorHUE(i / numOfBodies)); }

        return numOfBodies;
    }




    /**TODO: copyGrid
     * Returns a new grid with the given size, and the contents copied from the main grid
     * @param {Array} grid A grid of cells
     * @param {Object} pos An object with X and Y keys
     * @param {Object} size An object with X and Y keys
     * @returns {Array} 
     */
    copyFromGrid(grid, pos, size) {
        return create2DArray(size.x, size.y, function (x, y) {
            let originalCell = getGridCell(pos.x + x, pos.y + y, grid);

            if (originalCell == undefined) {
                return new GridCell(x, y, getBlockType("air"));
            } else {
                let cell = new GridCell(x, y, originalCell.type);

                return cell;
            }
        });
    }


    /** TODO: pasteGrid
     * Places the blocks from blockArry to the build grid.
     * @param {Number} gridX X grid-coordinate of the top-left cell
     * @param {Number} gridY Y grid-coordinate of the top-left cell
     * @param {Array<gridCell>} blockArray A 2d array of gridCells
     * @param {Number} width Size of blockArray
     * @param {Number} height Size of blockArray
     */
    mergeToGridFromArray(gridX, gridY, blockArray, width, height, ignoreAir = true) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let cell = getGridCell(x, y, blockArray);
                if (cell == undefined) continue;
                if (ignoreAir && getBlockName(cell.type) == "air") continue;

                let gridCellX = gridX + x;
                let gridCellY = gridY + y;
                let gridCell = deepCopy(getGridCell(gridCellX, gridCellY));
                if (gridCell == undefined) continue; //Skip out of bounds cells

                let blockNameUnder = getBlockName(gridCell.type);
                let blockNamePlaced = getBlockName(cell.type);

                setGridCell(gridCellX, gridCellY, cell.type);
            }
        }
    }


    /**
     * Returns a new grid, with the same size of the original, but replaces the blocks that does not pass the bodyIndex check, with air.
     * @param {Array} grid A grid of cells
     * @param {Number} filterFn The filter function. Passed with: (x, y, cell) where the cell is tha cell object it self.
     * @param {Number} gridWidth The width of the grid (in cells)
     * @param {Number} gridHeight The height of the grid (in cells)
     */
    filterCells(grid, filterFn, gridWidth = (grid[0] ?? []).length, gridHeight = grid.length) {
        let newGrid = create2DArray(gridWidth, gridHeight, function (x, y) {
            let cell = getGridCell(x, y, grid);
            if (cell == undefined) return;
            if (filterFn(x, y, cell)) {
                return cell;
            } else {
                return new GridCell(x, y, getBlockType("air"));
            }
        });

        return newGrid;
    }


    /**TODO: Used area
     * Returns the dimensions of the bounding rect of all used cells in the grid (specify tile considered as AIR)
     * @param {Array} grid A grid of cells
     * @param {Number} gridWidth The width of the grid (in cells)
     * @param {Number} gridHeight The height of the grid (in cells)
     * @returns {Object} Returns an objects with the keys: 'pos' and 'size', both containing an X and a Y value.
     */
    getBoundingRect(grid, gridWidth = (grid[0] ?? []).length, gridHeight = grid.length) {
        let minX = gridWidth;
        let minY = gridHeight;
        let maxX = 0;
        let maxY = 0;

        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                let cell = getGridCell(x, y, grid);
                if (cell == undefined || getBlockName(cell.type) == "air") continue;

                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }

        return {
            pos: {
                x: minX,
                y: minY,
            },

            size: {
                x: (maxX - minX) + 1,
                y: (maxY - minY) + 1,
            },
        }
    }



}
























/**
 * Creates a 2 dimensional array with the given size.
 * @param {Number} width Width of the 2D array
 * @param {Number} height Height of the 2D array
 * @param {Function} creatorFunction A function called on every cell with (x, y)
 */
function create2DArray(width, height, creatorFunction) {
    let arr = [];

    for (let y = 0; y < height; y++) {
        let row = [];
        for (let x = 0; x < width; x++) {
            row.push(creatorFunction(x, y));
        }
        arr.push(row);
    }

    return arr;
}

/**
 * Clears the entire grid
 * @param {Boolean} forceReset If the grid is re-created (true) or cleared (false)
 */
function clearGrid(forceReset = true) {
    let erasingArray = create2DArray(buildGrid.size.x, buildGrid.size.y, function (x, y) {
        return new GridCell(x, y, getBlockType("air"));
    });

    //If the grid is not there: construct it!
    if (forceReset || buildGrid.data.length == 0) {
        buildGrid.data = erasingArray;
        return;
    }

    //If the grid is there: clear it (give back the blocks)
    mergeToGridFromArray(0, 0, erasingArray, buildGrid.size.x, buildGrid.size.y, false);
}

/**
 * Checks if the build grid has any of the fllowing block
 * @param {Number} blockType A block's type (-1 for every block type)
 * @returns {Boolean}
 */
function gridHasBlock(blockType) {
    for (let y = 0; y < buildGrid.size.y; y++) {
        for (let x = 0; x < buildGrid.size.x; x++) {
            let cell = getGridCell(x, y);
            if (blockType == -1 && getBlockName(cell.type) != "air") return true;
            if (cell.type == blockType) return true;
        }
    }

    return false;
}

/**
 * Returns the grid cell (object) at the given coordinates
 * @param {Number} x 
 * @param {Number} y 
 * @returns {gridCell | undefined}
 */
function getGridCell(x, y, gridArray = buildGrid.data) {
    if (gridArray[y] == undefined) return undefined;
    return gridArray[y][x];
}

/**
 * Sets the grid cell's type at the given coordinates
 * @param {Number} x Grid cell x
 * @param {Number} y Grid cell y
 * @param {Number} type The INDEX of the block
 */
function setGridCell(x, y, type, gridArray = buildGrid.data) {
    if (type < 0 || type >= Object.keys(blockData).length) throw new Error(`Block type (${type}) is invalid!`);
    if (gridArray[y] == undefined) throw new Error(`Position (${x}, ${y}) is out of bounds!`);
    if (gridArray[y][x] == undefined) throw new Error(`Position (${x}, ${y}) is out of bounds!`);
    gridArray[y][x].type = type;
    gridArray[y][x].update();
}

/**
 * Sets the grid cell's type at the given coordinates
 * @param {Number} x Grid cell x
 * @param {Number} y Grid cell y
 * @param {String} name The NAME of the block
 */
function setGridCellByName(x, y, name) {
    setGridCell(x, y, getBlockType(name));
}

/**
 * Places the blocks from blockArry to the build grid.
 * @param {Number} gridX X grid-coordinate of the top-left cell
 * @param {Number} gridY Y grid-coordinate of the top-left cell
 * @param {Array<gridCell>} blockArray A 2d array of gridCells
 * @param {Number} width Size of blockArray
 * @param {Number} height Size of blockArray
 */
function mergeToGridFromArray(gridX, gridY, blockArray, width, height, ignoreAir = true) {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let cell = getGridCell(x, y, blockArray);
            if (cell == undefined) continue;
            if (ignoreAir && getBlockName(cell.type) == "air") continue;


            let gridCellX = gridX + x;
            let gridCellY = gridY + y;
            let gridCell = deepCopy(getGridCell(gridCellX, gridCellY));
            if (gridCell == undefined) continue; //Skip out of bounds cells

            let blockNameUnder = getBlockName(gridCell.type);
            let blockNamePlaced = getBlockName(cell.type);

            if (blockNameUnder == "air") {
                //console.log("Placing on air, placing:", blockNamePlaced);
                if (blockNamePlaced == "air") {
                    setGridCell(gridCellX, gridCellY, cell.type);
                    continue;
                }

                _removeBlock(blockNamePlaced);
                if (_getBlockAmount(blockNamePlaced) < 0) {
                    //console.log("%cDecrementing failed, not enough:", "color: red;", blockNamePlaced);
                    _giveBlock(blockNamePlaced); //back to 0
                    if (!input.mouse.oldDown && width > 1 && height > 1) {
                        pushNotification(`Not enough ${blockData[blockNamePlaced].name}s!`, 0.5, "error");
                    }
                    continue;
                }

                //console.log("Succesfully placed:", blockNamePlaced);
                setGridCell(gridCellX, gridCellY, cell.type);
            } else {
                //console.log("Placing on", blockNameUnder, "placing", blockNamePlaced);

                _giveBlock(blockNameUnder);
                //console.log("Gicing", blockNameUnder, "new value:", _getBlockAmount(blockNameUnder));

                if (blockNamePlaced == "air") {
                    //console.log("%cDeleting", "color: red;");
                    setGridCell(gridCellX, gridCellY, cell.type);
                    continue;
                }

                _removeBlock(blockNamePlaced);
                if (_getBlockAmount(blockNamePlaced) < 0) {
                    //console.log("%cDecrementing failed, not enough:", "color: red;", blockNamePlaced, "giving back:", blockNamePlaced, "removing:", blockNameUnder);
                    _giveBlock(blockNamePlaced); //back to 0
                    _removeBlock(blockNameUnder); //remove given block under
                    if (!input.mouse.oldDown && width > 1 && height > 1) {
                        pushNotification(`Not enough ${blockData[blockNamePlaced].name}s!`, 0.5, "error");
                    }
                    continue;
                }

                //console.log("Succesfully placed:", blockNamePlaced);
                setGridCell(gridCellX, gridCellY, cell.type);
            }
        }
    }

    _updateBlockAmountsInHotbar();
}

/**
 * Returns a new grid with the given size, and the contents copied from the main grid
 * @param {Array} grid A grid of cells
 * @param {Object} pos An object with X and Y keys
 * @param {Object} size An object with X and Y keys
 * @returns {Array} 
 */
function copyFromGrid(grid, pos, size) {
    return create2DArray(size.x, size.y, function (x, y) {
        let originalCell = getGridCell(pos.x + x, pos.y + y, grid);

        if (originalCell == undefined) {
            return new GridCell(x, y, getBlockType("air"));
        } else {
            let cell = new GridCell(x, y, originalCell.type);

            return cell;
        }
    });
}

/**
 * Returns a single grid cell, with the given index, or undefined if no cell was found. (returns with the first one it finds!)
 * @param {Array} grid A grid of cells
 * @param {Number} bodyIndex The allowed body index
 * @param {Number} gridWidth The width of the grid (in cells)
 * @param {Number} gridHeight The height of the grid (in cells)
 * @returns {gridCell | undefined}
 */
function findCellByBodyIndex(grid, bodyIndex, gridWidth = (grid[0] ?? []).length, gridHeight = grid.length) {
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            let cell = getGridCell(x, y, grid);
            if (cell == undefined || getBlockName(cell.type) == "air") continue;

            if (cell.bodyIndex == bodyIndex) return cell;
        }
    }

    return undefined;
}

/**
 * Resets all of the body indexes on the grid
 */
function resetBodyIndexes() {
    for (let y = 0; y < buildGrid.size.y; y++) {
        for (let x = 0; x < buildGrid.size.x; x++) {
            let cell = getGridCell(x, y);
            if (cell == undefined) continue;

            cell.bodyIndex = -1;
        }
    }
}

/**
 * Returns a new grid, with the same size of the original, but replaces the blocks that does not pass the bodyIndex check, with air.
 * @param {Array} grid A grid of cells
 * @param {Number} filterFn The filter function. Passed with: (x, y, cell) where the cell is tha cell object it self.
 * @param {Number} gridWidth The width of the grid (in cells)
 * @param {Number} gridHeight The height of the grid (in cells)
 */
function filterCells(grid, filterFn, gridWidth = (grid[0] ?? []).length, gridHeight = grid.length) {
    let newGrid = create2DArray(gridWidth, gridHeight, function (x, y) {
        let cell = getGridCell(x, y, grid);
        if (cell == undefined) return;
        if (filterFn(x, y, cell)) {
            return cell;
        } else {
            return new GridCell(x, y, getBlockType("air"));
        }
    });

    return newGrid;
}

/**
 * Returns the dimensions of the bounding rect of the structure in the given grid
 * @param {Array} grid A grid of cells
 * @param {Number} gridWidth The width of the grid (in cells)
 * @param {Number} gridHeight The height of the grid (in cells)
 * @returns {Object} Returns an objects with the keys: 'pos' and 'size', both containing an X and a Y value.
 */
function getBoundingRect(grid, gridWidth = (grid[0] ?? []).length, gridHeight = grid.length) {
    let minX = gridWidth;
    let minY = gridHeight;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            let cell = getGridCell(x, y, grid);
            if (cell == undefined || getBlockName(cell.type) == "air") continue;

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }

    return {
        pos: {
            x: minX,
            y: minY,
        },

        size: {
            x: (maxX - minX) + 1,
            y: (maxY - minY) + 1,
        },
    }
}

function calculateCenterOfMassGrid() {
    let sumCellX = 0;
    let sumCellY = 0;
    let cellsFound = 0;

    for (let y = 0; y < buildGrid.size.y; y++) {
        for (let x = 0; x < buildGrid.size.x; x++) {
            let cell = getGridCell(x, y);
            if (cell == undefined || getBlockName(cell.type) == "air") continue;

            for (let i = 0; i < blockData[getBlockName(cell.type)].mass * 2; i++) {
                sumCellX += x;
                sumCellY += y;
                cellsFound += 1;
            }
        }
    }

    sumCellX /= cellsFound;
    sumCellY /= cellsFound;

    centerOfMass.x = sumCellX;
    centerOfMass.y = sumCellY;
    centerOfMass.visible = cellsFound > 0;
}