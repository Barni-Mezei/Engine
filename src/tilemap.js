/**
 * Dependencies: grid, vector, resources
 */

class Tile {
    id = "";
    atlasPos = new Vector();
    texture;

    constructor(texture, tileId, atlasPos) {
        this.texture = texture;
        this.id = tileId;
        this.atlasPos = atlasPos;
    }
}

class TileMap {
    // Tile atlas
    atlasId = "";
    atlasTexture;
    atlasData;

    // Sliced tiles
    tiles = {}

    // Actual placed tiles
    gridTileSize = new Vector(50, 50);
    grid;


    constructor(textureId, atlasData, width, height) {
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
        
        this.tiles = TileMap.sliceTiles(this.atlasTexture.image, this.atlasData);

        this.grid = new Grid(width, height, {id: Object.keys(this.tiles)});
    }

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
     * Slices a tilemap into induvidual tiles
     * @param {Image} image 
     * @param {Object} atlasData 
     * @returns 
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
                });

                tiles[tileId] = new Tile(tileTexture, tileId, new Vector(x, y));

            }
        }

        return tiles;
    }

    getTileByAtlasPos(x, y) {
        for (let tile of this.tiles) {
            if (tile.atlasPos.isEqual(x, y)) return tile;
        }

        return null;
    }

    setTileMeta(tilePos_tileID, key, value) {}
    getTileMeta(tilePos_tileID, key) {}

    render() {
        /* for loops with tile offset and scaling*/
    }

    update() {

    }
}