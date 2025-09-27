/**
 * Dependencies: grid, vector, resources
 */

class Tile {
    id = "";
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
    }

    toObject() {
        return {
            id: structuredClone(this.id),
            meta: structuredClone(this.meta),
        }
    }
}

class TileMap extends Object2D {
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

        this.#setAtlasData(atlasData);
        this.#updateSize();
        
        this.tiles = TileMap.sliceTiles(this.atlasTexture.image, this.atlasData);

        this.grid = new Grid(width, height, {
            id: Object.keys(this.tiles)[0],
            meta: {},
        }, function (tile) {
            return tile.id;
        });
    }

    /**
     * Sets this tile map's tile atlas data, by calculating any missing fields
     * @param {Object} atlasData An atlas data object, with potentially missing fields
     */
    #setAtlasData(atlasData) {
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
    #updateSize() {
        // Update map size
        this.size.x = this.atlasData.columns * this.atlasData.tileWidth;
        this.size.y = this.atlasData.rows * this.atlasData.tileHeight;
    }

    /**
     * Slices a tilemap into induvidual tiles
     * @param {Image} image A canvas drawable object, that will get sliced into tiles, based on the atlasData
     * @param {Object} atlasData An object specifying the properties of the tile atlas
     * @returns {Object} An object, where each key is a tile's ID and the value is a new tile 
     */
    static sliceTiles(image, atlasData) {
        let tiles = {};

        for (let y = 0; y < atlasData.rows; y++) {
            for (let x = 0; x < atlasData.columns; x++) {
                let tileId = "tile_" + x + "_" + y;
                let tileTexture = Texture.canvasFromImage(image, {
                    width: atlasData.tileWidth,
                    height: atlasData.tileHeight,
                    x: atlasData.tileWidth * x + Math.min(0, atlasData.gapX * (x - 1)),
                    y: atlasData.tileHeight * y + Math.min(0, atlasData.gapY * (y - 1)),
                }, false);

                tiles[tileId] = new Tile(tileTexture, tileId, new Vector(x, y));
            }
        }

        return tiles;
    }

    static importTilemap(atlasTextureId, width, height, importData) {
        if (!("atlasData" in importData)) throw Error('Missing property "atlasData" in importData!');

        let newTilemap = new TileMap(atlasTextureId, importData.atlasData, width, height);

        console.dir(newTilemap.tiles);

        if ("tiles" in importData) {
            for (let tileId in importData.tiles) {
                let currentTile = importData.tiles[tileId];
                newTilemap.renameTile(tileId, currentTile.id);
                for (let key in currentTile.meta) {
                    newTilemap.setTileMeta(currentTile.id, key, currentTile.meta[key]);
                }
            }
        }

        console.dir(newTilemap.tiles);

        return newTilemap;
    }

    /**
     * Sets a tile's ID in the tile atlas
     * @param {String} tileId The ID of the tile
     * @param {String} newTileId The new ID of the tile
     */
    renameTile(tileId, newTileId) {
        if (!(tileId in this.tiles)) return;

        // Add new tile
        this.tiles[newTileId] = this.tiles[tileId];
        this.tiles[newTileId].id = newTileId;

        // Remove old tile
        delete this.tiles[tileId];

        // Update tiles on the tilemap
        this.grid.map(function (tile) {
            if (tile.id == tileId) tile.id = newTileId;
            return tile
        });
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
        console.dir(this.grid);
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
        for (let tile of this.tiles) {
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
        for (let tile of this.tiles) {
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

    render() {
        /* for loops with tile offset and scaling*/

        //console.log(this.grid);

        this.grid.forEach(function (tile) {
            //console.log(tile);
            ctx.fillStyle = this.getTileById(tile.id).pattern;
            ctx.fillRect(this.po);
        });
        //debugger

    }

    update() {

    }
}