/**
 * Dependencies: vector
 */












class Grid {
    // Default cell value
    defaultValue = null;

    // Size of the grid
    size = new Vector();

    hashFunction;

    // The 2D array of cell data
    #data;

    get width() {
        return this.size.x;
    }

    get height() {
        return this.size.y;
    }

    get data() {
        return this.#data;
    }

    /**
     * 
     * @param {Number} width Width of the grid, in number of cells
     * @param {Number} height Height of the grid, in number of cells
     * @param {Any} defaultValue The default value, to put in the place of a grid cell, when no other value is specified
     * @param {Function} hashFunction A function, that is called on every cell, and is used to compare them. (Should return a number or a string)
     * is passed in as an argument (used for comparing cells)
     */
    constructor(width, height, defaultValue = null, hashFunction = null) {
        // Grid size
        this.size = new Vector(width, height);

        // Grid data
        this.defaultValue = defaultValue;
        this.#data = [];

        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width;x++) {
                row.push(structuredClone(this.defaultValue));
            }
            this.#data.push(row);
        }

        // Hashing function
        this.hashFunction = hashFunction;
        this.hashFunction ??= function (tile) {
            return tile;
        }
    }

    /**
     * Converts the grid, into an array, and returns with it
     * @param {String} mode Determines, the format of the output array. Possible values can be:
     * - "1d": The returned array is a single dimansional array, containing cells, from each row immediately appended after eachother
     * - "2d" (default): The returned array, is an array of rows, which are arrays of cells
     * @returns {Array} All the cells in the grid
     */
    toArray(mode = "2d") {
        switch (mode) {
            default:
            case "2d":
                return this.#data;
                break;

            case "1d":
                let out = [];
                for (let row of this.#data) {
                    out = out.concat(row);
                }

                return out;
                break;
        }
    }

    /**
     * Checks if the specified cell position is inside of the bounds of this grid, or not
     * @param {Number} x The X position of a cell
     * @param {Number} y The Y position of a cell
     * @returns {Boolean} Is the cell position inside of the grid?
     */
    isInGrid(x, y) {
        return x >= 0 && x < this.size.x && y >= 0 && y < this.size.y;
    }

    /**
     * Sets a cell's value inside of the grid
     * @param {Number} x The X coordinate of the cell
     * @param {Number} y the Y coordinate of the cell
     * @param {Any} value The value to set the grid cell to
     * @returns {Boolean} Was the operation succesful? (Returns false if the position was out of the grid)
     */
    setCell(x, y, value) {
        if (!this.isInGrid(x, y)) return false;

        this.#data[y][x] = value;

        return true;
    }

    /**
     * Returns the value in the cell, at the specified coordinates, or the grid's default value
     * @param {Number} x The X coordinate of the grid cell
     * @param {Number} y the Y coordinate of the grid cell
     * @param {Any} defaultValue The value to return with, if the tile does not exists
     * (Applies only to this function, does not set this.defaultValue, but does overwrite it)
     * @returns {Any} The value of the cell at the specified position, or the default value
     */
    getCell(x, y, defaultValue = this.defaultValue) {
        if (!this.isInGrid(x, y)) return defaultValue;

        return this.#data[y][x];
    }

    /**
     * Resizes the grid, to the new specified size. New tiles will default to this.defaultValue, and cropped tiles, will disappear forever
     * @param {Number} newWidth The new width of the grid, in number of cells
     * @param {Number} newHeight The new height of the grid, in number of cells
     * @param {Any} defaultValue The value to set empty tiles to (Applies only to this function, does not set this.defaultValue, but does overwrite it)
     * @returns {Vector} The original size of the grid, in number of cells
     */
    resize(newWidth, newHeight, defaultValue = this.defaultValue) {
        let originalSize = this.size.copy();
        this.size = new Vector(newWidth, newHeight);

        // Add to height
        if (newHeight > originalSize.y) {
            for (let i = 0; i < newHeight - originalSize.y; i++) {
                let extraRow = [];
                for (let i = 0; i < newWidth; i++) {
                    extraRow.push(structuredClone(defaultValue));
                }

                this.#data.push(extraRow);
            }
        }

        // Remove from height
        if (newHeight < originalSize.y) {
            // Keep values, only in the new width boundary
            let newData = [];
            for (let i = 0; i < newHeight; i++) {newData[i] = this.#data[i]}

            this.#data = newData;
        }

        // Add to width
        if (newWidth > originalSize.x) {
            for (let y = 0; y < this.#data.length; y++) {
                let extraValues = [];
                for (let i = 0; i < newWidth - originalSize.x; i++) {
                    extraValues.push(structuredClone(defaultValue));
                }

                this.#data[y] = this.#data[y].concat(extraValues);
            }
        }

        // Remove from width
        if (newWidth < originalSize.x) {
            for (let y = 0; y < this.#data.length; y++) {
                // Keep values, only in the new width boundary
                let newRow = [];
                for (let i = 0; i < newWidth; i++) {newRow[i] = this.#data[y][i]}

                this.#data[y] = newRow;
            }
        }

        return originalSize;
    }


    /**
     * This function will fill the entire grid with the specified value
     * @param {Any} cellValue The value to fill the grid with
     */
    fill(cellValue) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.#data[y][x] = structuredClone(cellValue);
            }
        }
    }

    /**
     * This function will iterate over every cell in the grid, from top left to bottom right,
     * and calls the provided callback function, with the cell passed in as a parameter
     * @param {Function} callback The function which will get called on every cell. Parameters:
     * - x: The X coordinate of the current cell
     * - y: The Y coordinate of the current cell
     * - cell: The cell itself
     */
    forEach(callback) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                callback( x, y, this.#data[y][x] );
            }
        }
    }

    /**
     * Works very similar to the built in `Array.prototype.map` function. The return value of the callback will be set, as the new cell value
     * @param {Function} callback The function which will get called on every cell
     */
    map(callback) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.#data[y][x] = callback(x, y, this.#data[y][x]);
            }
        }
    }

    /**
     * Applies greedy meshing on the full grid, using the provided hashing function, or the default hashing function
     * @param {String} defaultAxis The first axis to start expanding the box on.
     * (When set to X the boxes may be more flat. Keep in mind that the number of resulting boxes will stay the same, in both settings)
     * @param {Function} hashFunction A function, that is called on every cell, and is used to compare them. (Should return a number or a string)
     * @returns {Array} The array of regions, this function inds
     */
    greedyMesh(firstAxis = "x", hashFunction = null) {
    }

    /**
     * Assigns an index to every  cells in the grid, based on the island they are connected to
     * @param {Function} hashFunction A function, that is called on every cell, and is used to compare them. (Should return a number or a string)
     * @param {Any} defaultValue The value to set empty tiles to (Applies only to this function, does not set this.defaultValue, but does overwrite it)
     * @returns {Grid} A new grid, where each cell, holds an island's ID or, defaultValue
     */
    findIslands(defaultValue = this.defaultValue, hashFunction = this.hashFunction) {
        /*
        - clear the body indexes.
        
        - get one unassigned cell.
        floodfill all the connected cells.
        repeat.

        if no unassigned cells found: done
        */

        // Reset body colors
        bodyColors = [];

        // Clear the existing body indexs
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

    /**TODO: copyGrid (area start XY, width, height, defaults to entire grid)
     * Returns a new grid with the given size, and the contents copied from the main grid
     * @param {Array} grid A grid of cells
     * @param {Object} pos An object with X and Y keys
     * @param {Object} size An object with X and Y keys
     * @returns {Array} 
     */
    copyGrid(grid, pos, size) {
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


    /** TODO: Rename to "pasteGrid", accepts a merger function, with old and vew cell as input, an return will be set
     * Places the blocks from blockArry to the build grid.
     * @param {Number} gridX X grid-coordinate of the top-left cell
     * @param {Number} gridY Y grid-coordinate of the top-left cell
     * @param {Array<gridCell>} blockArray A 2d array of gridCells
     * @param {Number} width Size of blockArray
     * @param {Number} height Size of blockArray
     */
    pasteGrid(gridX, gridY, blockArray, width, height, ignoreAir = true) {
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


    /**TODO: Replaced by this.map() ?
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


    /**TODO: Used area, or island bounding rect, determined by function??
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






















function findIslands(defaultValue = this.defaultValue, hashFunction = this.hashFunction) {
    /*
    - clear the body indexes.
    
    - get one unassigned cell.
    floodfill all the connected cells.
    repeat.

    if no unassigned cells found: done
    */

    // Reset body colors
    bodyColors = [];

    // Clear the existing body indexs
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