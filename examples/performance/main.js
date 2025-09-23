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




    resize(newWidth, newHeight, defaultValue = this.defaultValue) {
        if (newWidth > this.size.x) {
            for (let y = 0; y < this.data.length; y++) {
                let extraValues = Array(newWidth - this.size.x).fill(defaultValue);
                this.#data[y].concat(extraValues);
            }
        }
    }
}

class Tile {
    id = "";
    atlasPos = new Vector();
    texture;

    constructor(texture, tileId, localPos, atlasPos) {
        this.texture = texture;
        this.id = tileId;
        this.localPos = localPos;
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
        
        this.tiles = this.sliceTiles(this.atlasTexture.image, this.atlasData);

        this.grid = new Grid(width, height, {id:Object.keys(this.tiles)});
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

    sliceTiles(image, atlasData) {
        let tiles = {};

        for (let y = 0; y < atlasData.rows; y++) {
            for (let x = 0; x < atlasData.columns; x++) {
                let tileId = "tile_" + x + "_" + y;
                let tileTexture = Texture.canvasFromImage(image, this.atlasTexture, {
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

    render() {}

    update() {}
}


function randomColor(minR = 0, maxR = 255, minG = 0, maxG = 255, minB = 0, maxB = 255) {
    return `rgb(${randInt(minR, maxR)},${randInt(minG, maxG)},${randInt(minB, maxB)})`;
}



/* MAIN */
let tilemap;

async function init() {
    tilemap = new TileMap("terrain");
}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);
}

function update() {
    camera.update();
}