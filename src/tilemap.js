/**
 * Dependencies: grid, vector, resources, camera
 */

/**
 * In progress: importing From tiled
 */

class SimpleTile {
    id = ""; // Tile name
    char = null; // Compacted tile ID
    atlasPos = new Vector();
    meta = {};
    texture;
    pattern;

    constructor(texture, tileId, atlasPos) {
        this.texture = texture;
        this.id = tileId;
        this.atlasPos = atlasPos;

        this.meta = {};
        this.pattern = ctx.createPattern(texture, "repeat");
        this.char = null;
    }

    toObject() {
        return {
            id: structuredClone(this.id),
            meta: structuredClone(this.meta),
        }
    }
}

class SimpleTileMap extends Object2D {
    // Tile atlas
    atlasId = "";
    atlasTexture;
    atlasData;

    // Sliced tiles
    tiles = {}

    // Actual placed tiles
    gridTileSize = new Vector(50, 50);
    grid;

    /**
     * 
     * @param {String} textureId The ID of a loaded resource
     * @param {Object} atlasData Metadata about the tiles in the specified atlas texture, with the following structure:
     * - rows (null): Number of tile columns in the atlas texture
     * - columns (null): Number of tile columns in the atlas texture
     * - tileWidth (16): Width of a single tile in the atlas texture (in pixels)
     * - tileHeight (16): Height of a single tile in the atlas texture (in pixels)
     * - gapX (0): Gap between tiles on the X axis (in pixels)
     * - gapY (00): Gap between tiles on the Y axis (in pixels)  
     * 
     * (rows + columns) or (tileWidth + tileHeight) could be set to null, if the other one is specified,
     * and the function will calculate the missing values.
     * @param {Number} width Width of the tilemap (in tiles)
     * @param {Number} height Height of the tilemap (in tiles)
     */
    constructor(textureId, atlasData, width, height) {
        super(new Vector(), new Vector(1, 1));

        this.atlasId = textureId;
        this.atlasTexture = new Texture(textureId);

        this.atlasData = {
            rows: null, // Auto complete if tile width is present
            columns: null,
            tileWidth: 16, // Autocomplete if rows a re present
            tileHeight: 16,
            gapX: 0,
            gapY: 0,
        }

        this._setAtlasData(atlasData);
        
        this.tiles = SimpleTileMap.sliceTiles(this.atlasTexture.image, this.atlasData);

        this.grid = new Grid(width, height, {
            id: Object.keys(this.tiles)[0],
            meta: {},
        }, function (tile) {
            return tile.id;
        });

        this._updateTileMapSize();
        this._updateTileSizes();
    }

    /**
     * Sets this tile map's tile atlas data, by calculating any missing fields
     * @param {Object} atlasData An atlas data object, with potentially missing fields
     */
    _setAtlasData(atlasData) {
        // Set atlas data
        for (let key in atlasData) {
            this.atlasData[key] = atlasData[key];
        }

        // Complete atlas size
        if (this.atlasData.rows == null) {
            this.atlasData.rows = (this.atlasTexture.image.width + this.atlasData.gapX) / (this.atlasData.tileWidth + this.atlasData.gapX);
            this.atlasData.columns = (this.atlasTexture.image.height + this.atlasData.gapY) / (this.atlasData.tileHeight + this.atlasData.gapY);
        }

        // Complete tile size
        if (this.atlasData.tileWidth == null) {
            this.atlasData.tileWidth = (this.atlasTexture.image.width + this.atlasData.gapX) / this.atlasData.rows;
            this.atlasData.tileHeight = (this.atlasTexture.image.height + this.atlasData.gapY) / this.atlasData.columns;
        }
    }

    /**
     * Calculates the size of the bounding box of the tilemap, in world space
     */
    _updateTileMapSize() {
        // Update map size
        this.size.x = this.grid.width * this.gridTileSize.x;
        this.size.y = this.grid.height * this.gridTileSize.y;
    }

    /**
     * Udates the tile pattern sizes, to match the tilemap's, onscreen tile size
     */
    _updateTileSizes() {
        // Update tile pattern sizes
        for (let tileId in this.tiles) {
            let tile = this.tiles[tileId];

            let offCanvas = new OffscreenCanvas(this.gridTileSize.x, this.gridTileSize.y);
            let offCtx = offCanvas.getContext("2d");
            offCtx.imageSmoothingEnabled = !c.isPixelPerfect;

            offCtx.drawImage(
                tile.texture,
                0, 0, offCanvas.width, offCanvas.height
            );

            this.tiles[tileId].texture = offCanvas;
            this.tiles[tileId].pattern = offCtx.createPattern(offCanvas, "repeat");
        }
    }

    /**
     * Returns with an temporary Id for a tile, based on its atlas position
     */
    static _getTileIdFromCoords(x, y) {
        return "tile_" + x + "_" + y;
    }

    /**
     * Slices a tilemap into induvidual tiles
     * @param {Image} image A canvas drawable object, that will get sliced into tiles, based on the atlasData
     * @param {Object} atlasData An object specifying the properties of the tile atlas
     * @param {Object} tileObject The class, holding the tile's data
     * @returns {Object} An object, where each key is a tile's ID and the value is a new tile 
     */
    static sliceTiles(image, atlasData, tileObject = SimpleTile) {
        let tiles = {};

        for (let y = 0; y < atlasData.rows; y++) {
            for (let x = 0; x < atlasData.columns; x++) {
                let tileId = SimpleTileMap._getTileIdFromCoords(x, y);
                let tileTexture = Texture.canvasFromImage(image, {
                    width: atlasData.tileWidth,
                    height: atlasData.tileHeight,
                    x: atlasData.tileWidth * x + Math.min(0, atlasData.gapX * (x - 1)),
                    y: atlasData.tileHeight * y + Math.min(0, atlasData.gapY * (y - 1)),
                }, false);

                tiles[tileId] = new tileObject(tileTexture, tileId, new Vector(x, y));
            }
        }

        return tiles;
    }

    static importTilemap(atlasTextureId, width, height, importData) {
        if (!("atlasData" in importData)) throw Error('Missing property "atlasData" in importData!');

        let newTilemap = new SimpleTileMap(atlasTextureId, importData.atlasData, width, height);

        let tileChars = {};

        // Import tiles from the atlas texture
        if ("tiles" in importData) {
            for (let tileId in importData.tiles) {
                let currentTile = importData.tiles[tileId];
                tileChars[currentTile.char] = currentTile.id;
                newTilemap.renameTile(tileId, currentTile.id);
                for (let key in currentTile.meta) {
                    newTilemap.setTileMeta(currentTile.id, key, currentTile.meta[key]);
                    newTilemap.tiles[currentTile.id].char = currentTile?.char ?? null;
                }
            }

            // Default to the first tile
            newTilemap.grid.defaultValue = Object.values(newTilemap.tiles)[0].toObject();
        }

        // Import tiles to the tile grid
        if ("grid" in importData) {
            // Set default from the grid
            if ("default" in importData.grid) {
                newTilemap.grid.defaultValue = newTilemap.tiles[importData.grid.default].toObject();
            }

            newTilemap.grid.resize(importData.grid.width, importData.grid.height);

            for (let y = 0; y < importData.grid.data.length; y++) {
                let row = importData.grid.data[y];
                for (let i = 0; i < row.length; i += 2) {
                    let tileChar = row[i] + row[i+1];
                    let tilePos = new Vector(i/2, y);
                    let tileId = tileChars[tileChar];

                    newTilemap.setTileAt(tilePos, tileId);
                }
            }
        }

        return newTilemap;
    }

    /**
     * 
     * @param {*} atlasTextureId name of the loaded atlas texture to use in the tilemap
     * @param {*} importData 
     * @returns 
     */
    static importFromTiled(atlasTextureId, importData) {
        //console.dir(importData.layers);

        let atlasData = {
            tileWidth: importData.tilewidth,
            tileHeight: importData.tileheight,
            gapX: 0,
            gapY: 0,
        }

        let newTilemap = new SimpleTileMap(atlasTextureId, atlasData, importData.width, importData.height);

        // Find the first tile layer
        let layerName = "tilelayer";
        let layerIndex = importData.layers.reduce(
            function(result, current, index) {
                if (index == 1) {
                    return result.type == layerName ? 0 : (current.type == layerName ? 1 : null);
                } else {
                    return result === null ? (current.type == layerName ? index : null) : result;
                }
            }
        );

        // No tile layer found
        if (layerIndex === null) {
            return newTilemap;
        }

        let tileLayer = importData.layers[layerIndex];

        newTilemap.grid.defaultValue = {id: null, meta: {}};

        for (let i = 0; i < tileLayer.data.length; i++) {
            let tilePos = Grid.indexToCoordinate(i, tileLayer.width);
            let tileId = SimpleTileMap._getTileIdFromCoords( ...Grid.indexToCoordinate(tileLayer.data[i] - 1, newTilemap.atlasData.columns).toArray() );

            newTilemap.setTileAt(tilePos, tileId);
        }

        return newTilemap;
    }

    /**
     * Returns with a json object, containing all necesary data from importing it later
     * @param {String|null} fileName (optional) The file name, to download under 
     * @returns 
     */
    exportTilemap(fileName = null) {
        let out = {
            atlasData: this.atlasData,
            tiles: {},
            grid: {
                width: this.grid.width,
                height: this.grid.height,
                default: this.grid.defaultValue.id,
                data: [],
            },
        }

        let tileChars = {};

        // Add tiles to the export
        let i = 0;
        for (let tileId in this.tiles) {
            let tile = this.tiles[tileId];
            let defaultTileId = SimpleTileMap._getTileIdFromCoords(tile.atlasPos.x, tile.atlasPos.y);
            if (tile.id == defaultTileId) continue;

            if (tile.char == null) {
                // 8697 possible tile IDs (from chr: 33 '!' to chr: 126 '~')
                tileChars[tileId] = String.fromCharCode(33 + Math.floor(i/93)) + String.fromCharCode(33 + (i % 93));
            } else {
                tileChars[tileId] = tile.char;
            }

            out.tiles[defaultTileId] = {
                char: tileChars[tileId],
                id: tile.id,
                meta: tile.meta,
            }

            i++;
        }

        // Export grid data
        let oldY = 0;
        let row = "";

        this.grid.forEach(function(x, y, tile) {
            if (y != oldY) {
                out.grid.data.push(row);
                row = "";
                oldY = y;
            }

            row += tileChars[tile.id];
        });

        // Add last row
        if (row.length > 0) out.grid.data.push(row);

        if (fileName) {
            FileResource.downloadFile( fileName + ".json", JSON.stringify(out) );
        } else {
            return out;
        }
    }

    /**
     * Sets a tile's ID in the tile atlas
     * @param {String} tileId The ID of the tile
     * @param {String} newTileId The new ID of the tile
     */
    renameTile(tileId, newTileId) {
        if (!(tileId in this.tiles)) return;

        // Update tiles on the tilemap
        this.grid.map(function (x, y, tile) {
            if (tile.id == tileId) tile.id = newTileId;
            return tile
        });

        // Add new tile
        this.tiles[newTileId] = this.tiles[tileId];
        this.tiles[newTileId].id = newTileId;

        // Remove old tile
        delete this.tiles[tileId];
    }

    /**
     * Sets a tile's ID in the tile atlas
     * @param {Vector} atlasPos Tile position in the tile atlas
     * @param {String} newTileId The new ID of the tile
     */
    renameTilebyAtlasPos(atlasPos, newTileId) {
        for (let currentTileId in this.tiles) {
            let tile = this.tiles[currentTileId];
            if (tile.atlasPos.isEqual(atlasPos)) {
                // Add new tile
                this.tiles[newTileId] = tile;
                this.tiles[newTileId].id = newTileId;

                // Remove old tile
                delete this.tiles[currentTileId];
            };
        }
    }

    /**
     * Fills the entire tilemap with the specified tile
     * @param {String} tileId The ID of a tile
     */
    fill(tileId) {
        this.grid.fill(this.getTileById(tileId).toObject());
    }

    /**
     * Sets a tile on the tilemap
     * @param {Vector} tilePos The tile position on the tilemap
     * @param {String} tileId The ID of the tile to set
     * @param {Object} tileMeta A the tile's metadata (WARNING: If set, it overwrites all existing metadata in that cell!)
     */
    setTileAt(tilePos, tileId, tileMeta = null) {
        let tile = this.grid.getCell(tilePos.x, tilePos.y);
        tile.id = tileId;
        tile.meta = tileMeta ?? {};
        this.grid.setCell(tilePos.x, tilePos.y, tile);
    }

    /**
     * Set a tile's metadata on the tilemap
     * @param {Vector} tilePos The tile position on the tilemap
     * @param {String} key The key to set the value at
     * @param {Any} value The value to set
     */
    setLocalTileMeta(tilePos, key, value) {
        let tile = this.grid.getCell(tilePos.x, tilePos.y);
        tile.meta[key] = value;
        this.grid.setCell(tilePos.x, tilePos.y, tile);
    }

    /**
     * Sets a tile's metadata in the tile atlas
     * @param {String} tileId The ID of the tile, whose data will be set
     * @param {String} key The key to set the value at
     * @param {Any} value The value to set
     */
    setTileMeta(tileId, key, value) {
        if (!(tileId in this.tiles)) return;

        this.tiles[tileId].meta[key] = value;
    }

    /**
     * Sets a tile's metadata in the tile atlas
     * @param {Vector} atlasPos Tile position in the tile atlas
     * @param {String} key The key to set the value at
     * @param {Any} value The value to set
     */
    setTileMetaAt(atlasPos, key, value) {
        for (let tileId in this.tiles) {
            let tile = this.tiles[tileId];
            if (tile.atlasPos.isEqual(atlasPos)) {
                tile.meta[key].meta = value;
            };
        }
    }


    /**
     * Returns with a tile from the texture atlas, by its position
     * @param {Vector} atlasPos A vector, representing a texture atlas coordinate
     * @returns {Tile|null} The tile from the atlas, at the specified position, or null if no tile was found
     */
    getTileById(tileId) {
        if (!(tileId in this.tiles)) return null;

        return this.tiles[tileId];
    }

    /**
     * Returns with a tile from the texture atlas, by its position
     * @param {Vector} atlasPos Tile position in the tile atlas
     * @returns {Tile|null} The tile from the atlas, at the specified position, or null if no tile was found
     */
    getTileByAtlasPos(atlasPos) {
        for (let tileId in this.tiles) {
            let tile = this.tiles[tileId];
            if (tile.atlasPos.isEqual(atlasPos)) return tile;
        }

        return null;
    }

    /**
     * Returns with a tile ID from the tilemap
     * @param {Vector} tilePos The tile position on the tilemap
     * @returns {String|null} Returns with a tile ID, or null
     */
    getTileAt(tilePos) {
        return this.grid.getCell(tilePos.x, tilePos.y, null)?.id ?? null;
    }

    /**
     * Returns with a tile's local metadata from the tilemap
     * @param {Vector} tilePos The tile position on the tilemap
     * @returns {Object|null} Returns with an object, containing the tile's metadata, or null
     */
    getLocalTileMeta(tilePos) {
        return this.grid.getCell(tilePos.x, tilePos.y, null)?.meta ?? null;
    }

    render(gridColor = null, gridThickness = null) {
        let self = this;

        this.grid.forEach(function (x, y, tile) {
            if (tile.id == null) return;

            let tilePos = self.pos.add(new Vector(x, y).mult(self.gridTileSize));

            /*ctx.drawImage(
                self.getTileById(tile.id).texture,
                ...camera.w2c(tilePos).round().toArray(), ...camera.w2cs(self.gridTileSize).round().toArray()
            );*/

            ctx.drawImage(
                self.getTileById(tile.id).texture,
                ...camera.w2cf(tilePos.round(settings.debug.a), self.gridTileSize.round(settings.debug.a))
            );

            //ctx.fillStyle = self.getTileById(tile.id).pattern;
            //ctx.fillRect(...camera.w2c(tilePos).round().toArray(), ...camera.w2cs(self.gridTileSize).round().toArray());
        });

        if (gridColor != null) {
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = camera.w2csX(gridThickness);
            ctx.lineJoin = "butt";
            ctx.lineCap = "butt";

            // Horizontal lines
            for (let y = 0; y <= this.grid.height; y++) {
                ctx.beginPath();
                ctx.moveTo(...camera.w2cXY(this.left, this.pos.y + y * this.gridTileSize.y));
                ctx.lineTo(...camera.w2cXY(this.right, this.pos.y + y * this.gridTileSize.y));
                ctx.stroke();
            }

            // Vertical lines
            for (let x = 0; x <= this.grid.width; x++) {
                ctx.beginPath();
                ctx.moveTo(...camera.w2cXY(this.pos.x + x * this.gridTileSize.x, this.top));
                ctx.lineTo(...camera.w2cXY(this.pos.x + x * this.gridTileSize.x, this.bottom));
                ctx.stroke();
            }
        }
    }

    update() {

    }
}

class Tile extends SimpleTile {
    /*
    0 top,
    1 top-right,
    2 right,
    3 bottom-right,
    4 bottom,
    5 bottom-left,
    6 left
    7 top-left,

    Neighbor indexes:
        7 0 1
        6   2
        5 4 3
    */
    autotile = [];

    constructor(texture, tileId, atlasPos) {
        super(texture, tileId, atlasPos);

        delete this.char;

        this.updatePattern();
    }

    updatePattern() {
        this.pattern = ctx.createPattern(this.texture, "repeat");
    }

    setAutotile(array) {
        this.autotile = array;
    }
}


class TileMap extends Object2D {
    #layers = {};

    /**
     * @readonly
     */
    get layers() { return this.#layers; }

    #gridTileSize = new Vector(50, 50);

    /**
     * @param {Vector} value The width and height of a single tile (in world space)
     */
    set tileSize(value) { return this.#gridTileSize = value; }
    get tileSize() { return this.#gridTileSize; }

    /**
     * @type {Number} The width of a single tile (in world space)
     */
    get tileWidth() { return this.#gridTileSize.x; }

    /**
     * @readonly
     * @type {Number} The height of a single tile (in world space)
     */
    get tileHeight() { return this.#gridTileSize.y; }

    #width = 0;
    #height = 0;

    /**
     * Width of the tilemap (in tiles)
     */
    get width() { return this.#width; }

    /**
     * Height of the tilemap (in tiles)
     */
    get height() { return this.#height; }

    /**
     * The available tiles in the atlas texture
     */
    #tiles = {};

    /**
     * @readonly
     */
    get tiles() { return this.#tiles; }

    /**
     * @type {String|null} The default tile ID to set to new layers
     */
    defaultTile = null;

    settings = {
        /**
         * If set, it enables **automatic re-calculation of collision and navigation objects**
         * It is recommended to turn off, before large grid operations on the collision and navigation layers
         * then turning it on and calling the updates manually.
         */
        autoUpdate: false,
    }

    /**
     * 
     * @param {String} atlasTextureId The ID of a loaded resource
     * @param {Object} atlasData Metadata about the tiles in the specified atlas texture, with the following structure:
     * - rows (null): Number of tile columns in the atlas texture
     * - columns (null): Number of tile columns in the atlas texture
     * - tileWidth (16): Width of a single tile in the atlas texture (in pixels)
     * - tileHeight (16): Height of a single tile in the atlas texture (in pixels)
     * - gapX (0): Gap between tiles on the X axis (in pixels)
     * - gapY (0): Gap between tiles on the Y axis (in pixels)  
     * 
     * (rows + columns) or (tileWidth + tileHeight) could be set to null, if the other ones are specified.
     * @param {Number} width Width of the tilemap (in tiles)
     * @param {Number} height Height of the tilemap (in tiles)
     */
    constructor(atlasTextureId, atlasData, width, height) {
        super(new Vector(), new Vector(1, 1));

        // Remove unnecessary properties
        delete this.gridTileSize;
        delete this.tiles;
        delete this.importTilemap;
        delete this.exportTilemap;
        delete this.renameTilebyAtlasPos;
        delete this._updateTileMapSize;
        delete this._updateTileSizes;
        delete this.grid;

        // Default value for the tilemap's settings
        this.settings = {
            autoUpdate: false,
        }

        this.defaultTile = null;

        this.#width = width;
        this.#height = height;

        this.atlasId = atlasTextureId;
        this.atlasTexture = new Texture(atlasTextureId);

        this.atlasData = {
            rows: null, // Auto complete if tile width is present
            columns: null,
            tileWidth: 16, // Autocomplete if rows a re present
            tileHeight: 16,
            gapX: 0,
            gapY: 0,
        }

        this._setAtlasData(atlasData);
        
        this.#tiles = SimpleTileMap.sliceTiles(this.atlasTexture.image, this.atlasData, Tile);

        this.#layers = {};
        this.addLayer("graphics");
        this.addLayer("collision");
        this.addLayer("navigation");

        this._updateSize();
        this._updateTilePatterns();
    }

    /**
     * Sets this tile map's tile atlas data, by calculating any missing fields
     * @param {Object} atlasData An atlas data object, with potentially missing fields
     */
    _setAtlasData(atlasData) {
        // Set atlas data
        for (let key in atlasData) {
            this.atlasData[key] = atlasData[key];
        }

        // Complete atlas size
        if (this.atlasData.rows == null) {
            this.atlasData.rows = (this.atlasTexture.image.width + this.atlasData.gapX) / (this.atlasData.tileWidth + this.atlasData.gapX);
            this.atlasData.columns = (this.atlasTexture.image.height + this.atlasData.gapY) / (this.atlasData.tileHeight + this.atlasData.gapY);
        }

        // Complete tile size
        if (this.atlasData.tileWidth == null) {
            this.atlasData.tileWidth = (this.atlasTexture.image.width + this.atlasData.gapX) / this.atlasData.rows;
            this.atlasData.tileHeight = (this.atlasTexture.image.height + this.atlasData.gapY) / this.atlasData.columns;
        }
    }

    /**
     * Calculates the size of the bounding box of the tilemap, in world space
     */
    _updateSize() {
        // Update object size
        this.size = new Vector(
            this.#width,
            this.#height
        ).mult( this.tileSize );
    }

    /**
     * Udates the tile pattern sizes, to match the tilemap's, onscreen tile size
     */
    _updateTilePatterns() {
        // Update tile pattern sizes
        for (let tileId in this.#tiles) {
            let tile = this.#tiles[tileId];

            let offCanvas = new OffscreenCanvas(...camera.w2csXY(this.tileWidth, this.tileHeight));
            let offCtx = offCanvas.getContext("2d");
            offCtx.imageSmoothingEnabled = !c.isPixelPerfect;

            offCtx.drawImage(
                tile.texture,
                0, 0, offCanvas.width, offCanvas.height
            );

            /*this.#tiles[tileId].texture = offCanvas;
            this.#tiles[tileId].pattern = offCtx.createPattern(offCanvas, "repeat");*/

            tile.texture = offCanvas;
            tile.pattern = offCtx.createPattern(offCanvas, "repeat");
        }
    }

    static importFromTiled(atlasTextureId, importData) {
        //console.dir(importData.layers);

        let atlasData = {
            tileWidth: importData.tilewidth,
            tileHeight: importData.tileheight,
            gapX: 0,
            gapY: 0,
        }

        let newTilemap = new TileMap(atlasTextureId, atlasData, importData.width, importData.height);

        // Remove all layers
        newTilemap.removeLayer("graphics_0");
        newTilemap.removeLayer("collision_0");
        newTilemap.removeLayer("navigation_0");

        // Re-add the layers from the save file
        for (let layer of importData.layers) {
            if (layer.type == "tilelayer") {
                let newLayer = newTilemap.addLayer("graphics");

                let dataGrid = Grid.fromArray(layer.data, layer.width);

                dataGrid.map(function (x, y, tileId) {
                    let tilePos = Grid.indexToCoordinate(tileId - 1, newTilemap.atlasData.columns);
                    let correctTileId = SimpleTileMap._getTileIdFromCoords(tilePos.x, tilePos.y);
                    return {
                        id: tileId == 0 ? null : correctTileId,
                        meta: {},
                    }
                });

                newTilemap.setGrid(newLayer, dataGrid);
            }

            function transformToWorldSpace(tilemap, layer, importData, x, y) {
                return new Vector(
                    ((x / importData.tilewidth) + (layer.offsetx / importData.tilewidth)) * tilemap.tileWidth + tilemap.pos.x,
                    ((y / importData.tileheight) + (layer.offsety / importData.tileheight)) * tilemap.tileHeight + tilemap.pos.y,
                );
            }

            if (layer.type == "objectgroup") {
                let newLayer = newTilemap.addLayer("navigation");
                for (let object of layer.objects) {
                    if ("point" in object) {
                        console.log("Point at: ", object.x, object.y, object.width, object.height);
                        newTilemap.addObject(
                            newLayer,
                            new Point(...transformToWorldSpace(newTilemap, layer, importData, object.x, object.y).toArray()),
                        );
                    } else if ("polygon" in object) {
                        console.log("Path at: ", object.x, object.y, object.width, object.height);

                        for (let i in object.polygon) {
                            console.log(object.polygon[i]);
                            object.polygon[i] = transformToWorldSpace(
                                newTilemap,
                                layer,
                                importData,
                                object.polygon[i].x,
                                object.polygon[i].y
                            ).add(new Vector());
                        }

                        let newPath = new Path(object.polygon);

                        newTilemap.addObject(newLayer, newPath);

                    } else {
                        console.log("Rectangle at: ", object.x, object.y, object.width, object.height);
                    }
                }


                /*let newLayer = newTilemap.addLayer("graphics");

                let dataGrid = Grid.fromArray(layer.data, layer.width);

                dataGrid.map(function (x, y, tileId) {
                    let tilePos = Grid.indexToCoordinate(tileId - 1, newTilemap.atlasData.columns);
                    let correctTileId = SimpleTileMap._getTileIdFromCoords(tilePos.x, tilePos.y);
                    return {
                        id: tileId == 0 ? null : correctTileId,
                        meta: {},
                    }
                });

                newTilemap.setGrid(newLayer, dataGrid);*/
            }

        }

        return newTilemap;
    }

    static exportToTiled(fileName) {}

    /**
     * Creates a new layer in the tilemap
     * @param {String} type The layer type. Possible values:
     * - `graphics`: Visible, displays graphical tiles
     * - `collision`: Invisible, used to simulate collisions with the tilemap
     * - `navigation`: Invisible, guides pathfinding agents
     * @returns {String|null} Returns the ID of the new layer or null, if the layer could be created
     */
    addLayer(layerType) {
        if (!["graphics", "collision", "navigation"].includes(layerType)) return null;

        let sameTypeLayers = [];

        for (let layerId in this.#layers) {
            if (layerId.search(new RegExp(`${layerType}_[0-9]+`)) == 0) sameTypeLayers.push(layerId);
        }

        // Assure Z index correctness between layers
        sameTypeLayers.sort();

        let lastLayer = sameTypeLayers[sameTypeLayers.length - 1] ?? "placeholder_-1";
        let lastLayerIndex = parseInt( lastLayer.split("_")[1] );
        let newLayerId = `${layerType}_${lastLayerIndex + 1}`;

        if (layerType == "graphics") {
            this.#layers[newLayerId] = {
                grid: new Grid(this.#width, this.#height, {
                    id: this.defaultTile,
                    meta: {},
                }, function (tile) {
                    return tile.id;
                }),

                objects: [],
            }

            this.#layers[newLayerId].grid.defaultValue = {
                id: this.defaultTile,
                meta: {},
            }
        }

        if (layerType == "collision") {
            this.#layers[newLayerId] = {
                grid: new Grid(this.#width, this.#height,
                    false, // Tile value
                function (tile) {
                    return tile;
                }),

                objects: [],
            }

            this.#layers[newLayerId].grid.defaultValue = false;
        }

        if (layerType == "navigation") {
            this.#layers[newLayerId] = {
                grid: new Grid(this.#width, this.#height,
                    0, // Tile value
                function (tile) {
                    return tile;
                }),

                objects: [],
            }

            this.#layers[newLayerId].grid.defaultValue = 0;
        }

        return newLayerId;
    }

    /**
     * Removes an already existing tilemap layer
     * @param {String} layerId The ID of a layer (example: "graphics_0")
     */
    removeLayer(layerId) {
        if (!(layerId in this.#layers)) return;

        delete this.#layers[layerId];
    }

    /**
     * Returns an array of layer ids, in the correct rendering order (graphics, collision, navigation)
     * @param {String|null} layerType If specified, only this types of layers will be returned
     * @returns {Array} Returns the array of layer ids, in the correct rendering order
     */
    getLayers(layerType = null) {
        let out = [];
        
        if (layerType == null) {
            let graphicsLayers = [];
            let collisionLayers = [];
            let navigationLayers = [];
    
            for (let layerId in this.#layers) {
                if (layerId.search(/graphics_[0-9]+/g) == 0) graphicsLayers.push(layerId);
                if (layerId.search(/collision_[0-9]+/g) == 0) collisionLayers.push(layerId);
                if (layerId.search(/navigation_[0-9]+/g) == 0) navigationLayers.push(layerId);
            }

            // Assure Z index correctness between layers
            graphicsLayers.sort();
            collisionLayers.sort();
            navigationLayers.sort();

            // Assure Z index correctness between layer types (used when debug rendering)
            out = out.concat(graphicsLayers).concat(collisionLayers).concat(navigationLayers);
        } else {
            for (let layerId in this.#layers) {
                //console.log(layerId);
                if (layerId.search(new RegExp(`${layerType}_[0-9]+`)) == 0) out.push(layerId);
            }

            // Assure Z index correctness between layers
            out.sort();
        }

        return out;
    } 

    /**
     * Returns with the first layer in the tilemap, or null if none found (it is NOT necessary the first by rendering order)
     * @returns {Object|null}
     */
    getFirstLayer() {
        if (Object.keys(this.#layers).length == 0) return null;

        return this.#layers[ Object.keys(this.#layers)[0] ];
    }

    /** Replaces an existing layer's grid, with the specified one
     * @param {Grid} grid The grid, to replace to
     */
    setGrid(layerId, grid) {
        if (!(layerId in this.#layers)) return;

        this.#layers[layerId].grid = grid;
    }

    /** Returns with the specified layer's grid object, or null if the layer is invalid
     * @param {String} layerId The ID of a layer (example: "graphics_0")
     * @returns {Object|null}
     */
    getGrid(layerId) {
        return this.#layers[layerId]?.grid ?? null;
    }

    /** Appends an object to an existing layer's objects array
     * @param {String} layerId The ID of a layer (example: "graphics_0")
     * @param {Object} object The object, to add to the layer
     */
    addObject(layerId, object) {
        if (!(layerId in this.#layers)) return;

        this.#layers[layerId].objects.push(object);
    }

    /** Retrieves all objects stored in a layer
     * @param {String} layerId The ID of a layer (example: "graphics_0")
     */
    getObjects(layerId) {
        if (!(layerId in this.#layers)) return;

        return this.#layers[layerId].objects;
    }

    // Tiles array
    renameTile(tileId, key) {}

    setTileMeta(tileId, key, value) {}
    getTileMeta(tileId, key) {}

    getTileById(tileId) {
        if (!(tileId in this.#tiles)) return null;

        return this.#tiles[tileId];
    }

    getTileByAtlasPos(atlasPos) {}

    /**
     * Returns with the first tile in the tilemap (it is NOT necessary the first on the atlas texture)
     * @returns {Object}
     */
    getFirstTile() {
        if (this.#tiles == {}) return null;

        return this.#tiles[ Object.keys(this.#tiles)[0] ];
    }

    setTileAutotile(tileId, neighbors) {}
    setTileAutotileDirection(tileId, direction = "top", connectionID) {} /* top top_right right bottom_right bottom bottom_left left top_left*/
    setTileAutotileIndex(tileId, index, connectionID) {}
    getTileAutotile(tileId) {}

    getAutotile(tileID, neighbors) {} /* [] connectionID or null if unknown returns a tile id*/

    // Multi layer
    setTileMetaAt(layerId, tilePos, key, value) {}
    getTileMetaAt(layerId, tilePos, key) {}

    getColumnAt(tilePos) {}

    /**
     * Sets a tile on the tilemap's specified graphics layer
     * @param {Number} graphicsLayer The number of a graphics layer
     * @param {Vector} tilePos The tile position on the tilemap
     * @param {String} tileId The ID of a tile from the tileset
     * @param {Object} tileMeta A the tile's metadata to set to (WARNING: If set, it overwrites all existing metadata in that tile!)
     */
    setTileAt(graphicsLayer, tilePos, tileId, tileMeta) {
        let grid = this.getGrid("graphics_"+graphicsLayer);

        if (!grid) return;
        if (!grid.isInGrid(tilePos.x, tilePos.y)) return;

        let tile = grid.getCell(tilePos.x, tilePos.y);
        tile.id = tileId;
        tile.meta = tileMeta ?? {};
        grid.setCell(tilePos.x, tilePos.y, tile);
    }

    /**
     * Returns with a tile ID from the tilemap's specified layer
     * @param {Number} graphicsLayer The number of a graphics layer
     * @param {Vector} tilePos The tile position on the tilemap
     * @returns {String|null} Returns with a tile ID or null
     */
    getTileAt(graphicsLayer, tilePos) {
        return this.getGrid("graphics_"+graphicsLayer).getCell(tilePos.x, tilePos.y, null)?.id ?? null;
    }
    
    /**
     * Replaces all tiles on the specified layer with the gicven tile
     * @param {String} layerId The ID of a layer (example: "graphics_0")
     * @param {String} tileId The ID of a tile from the tileset, null, or a simple value if the layer is not a graphical layer
     */
    clear(layerId, tileId) {
        if (layerId.search(/graphics_[0-9]+/g) == 0) {
            this.#layers[layerId].grid.fill({id: tileId, meta: {}});
        } else {
            this.#layers[layerId].grid.fill(tileId);
        }
    }

    fill(layerId, tileId, tilePos) {} /* paint bucket. fills only the tile it starts on */
    foreach(layerId, callback) {} /* calls the fuinction on every tile */
    map(layerId, callback) {} /* sets the tile to what the callback returns with */

    /* [[Vector(0,0), Vector(0,1)], [Vector(1,1)]] array of positions. positions are tiles on  an island */
    getIslands(layerId, emptyTileFunction /* returns a bool, if the tile is empty */) {}

    // Special
    // Collision
    setTileCollision(collisionLayer, tilePos, value) {}
    setAllTileCollision(collisionLayer, tilePos, collisionsOnLayers /* array */) {}
    getTileCollision(collisionLayer, tilePos) {}
    getAllTileCollision(tilePos) {} /* ret artray of layer collisions */

    isColliding(layerIds /* array of layer ids */,point  /* world pos coordinate vec2 */) {}

    // Navigation
    setTileNavigation(navLayer, tilePos, travelCost /* high makes a wall */) {
        if (typeof travelCost != "number") return 1;

        let grid = this.getGrid("navigation_"+navLayer);

        if (!grid) return 2;
        if (!grid.isInGrid(tilePos.x, tilePos.y)) return 3;
    
        grid.setCell(tilePos.x, tilePos.y, travelCost);
    }

    getTileNavigation(navLayer, tilePos) {}

    /* {tiles: [Vector(0,0) ...], path: [Vector() ...]} returns array of tile pos + a world coord point list for path creation */
    findPath(navLayer, startPos, endPos, algorithm = "astar") {} 

    _updateCollision(collisionLayer /* null to update all layers */) {} /* greedy meshes collision layers */
    _updateNavigation(navLayer /* null to update all layers */) {} /* greedy meshes nav layers */

    render(gridColor = null, gridThickness = null, collision = false, navigation = false) {
        /*
        Layer render order:
        (always) graphics_1 to graphics_n
        (debug) collision_1 to collision_n
        (debug) nav_1 to nav_1
        */

        let self = this;

        //console.log(this.getLayers());
        for (let layerId of this.getLayers("graphics")) {
            // Render tiles
            this.getGrid(layerId).forEach(function (x, y, tile) {
                if (tile.id == null) return;

                let tilePos = new Vector(
                    self.pos.x + x * self.tileWidth,
                    self.pos.y + y * self.tileHeight
                );

                ctx.drawImage(
                    self.getTileById(tile.id).texture,
                    ...camera.w2c(tilePos).toArray(), ...camera.w2cs(self.tileSize).toArray()
                );
            });
        }

        if (settings.debug.collision) {
            for (let layerId of this.getLayers("collision")) {
                // Render tiles
                this.getGrid(layerId).forEach(function (x, y, tile) {
                    if (tile == null) return;
    
                    let tilePos = new Vector(
                        self.pos.x + x * self.tileWidth,
                        self.pos.y + y * self.tileHeight
                    );
    
                    ctx.fillStyle = `rgba(0, 100, 255, ${tile / 2})`;
                    
                    ctx.fillRect(...camera.w2cf(tilePos, self.tileSize));
                });
    
                // Render objects
                for (let obj of this.#layers[layerId].objects) {
                    obj.render();
                };
            }
        }

        if (settings.debug.navigation) {
            let tileInset = 1; // Size of the inset for the nav tiles

            for (let layerId of this.getLayers("navigation")) {
                // Render tiles
                this.getGrid(layerId).forEach(function (x, y, tile) {
                    if (tile == null) return;
    
                    let tilePos = new Vector(
                        self.pos.x + x * self.tileWidth + (tileInset / 2),
                        self.pos.y + y * self.tileHeight + (tileInset / 2)
                    );
    
                    ctx.fillStyle = `rgba(255, 0, 0, ${tile / 2})`;
                    ctx.fillRect(...camera.w2cf(tilePos, self.tileSize.sub(new Vector(tileInset))));
                });
    
                // Render objects
                for (let obj of this.#layers[layerId].objects) {
                    obj.render();
                };
            }
        }

        /*if (gridColor != null) {
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = camera.w2csX(gridThickness);
            ctx.lineJoin = "butt";
            ctx.lineCap = "butt";

            // Horizontal lines
            for (let y = 0; y <= this.#height; y++) {
                ctx.beginPath();
                ctx.moveTo(...camera.w2cXY(this.left, this.pos.y + y * this.tileHeight));
                ctx.lineTo(...camera.w2cXY(this.right, this.pos.y + y * this.tileHeight));
                ctx.stroke();
            }

            // Vertical lines
            for (let x = 0; x <= this.#width; x++) {
                ctx.beginPath();
                ctx.moveTo(...camera.w2cXY(this.pos.x + x * this.tileWidth, this.top));
                ctx.lineTo(...camera.w2cXY(this.pos.x + x * this.tileWidth, this.bottom));
                ctx.stroke();
            }
        }*/
    }

    update() {}
}