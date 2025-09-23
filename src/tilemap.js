/**
 * Dependencies: resources, objects, vector, physics
 */

class Tile {
    /**
     * 
     * @param {String} id ID (name) of the tile
     * @param {Vector} pos Position of the tile, relative to the TileMap
     * @param {Vector} atlasPos Top left corner of the atlas rect
     * @param {String|Collider2D} collider Tile collider OR "rect" for full-tile collision
     * @param {Number} navCost Cost of traveling through this tile (-1 to disable travel)
     * @returns 
     */
    static create(id, pos, atlasPos, collider = "rect", navCost = 0) {
        return {
            id: id,
            pos: pos,
            atlasPos: atlasPos,
            collider: collider,
            navCost: navCost,
        }
    }

    /**
     * Retrieves metadata from the specified tile
     * @param {Object} tile A tile object
     * @param {String} key The data's key. Leave empty to retrieve every metadata from the tile
     * @returns {Any} The tile's metadata
     */
    static getMeta(tile, key) {
        if ("meta" in tile) {
            if (key) {        
                if (key in tile.meta) return tile.meta[key];
                return null;
            }
            return tile.meta;
        } else {
            if (key) return null;
            return {};
        }
    }

    /**
     * Sets a tile's metadata
     * @param {Object} tile A tile object
     * @param {String} key The key to store the value under
     * @param {Any} value The value to store in to the tile's metadata
     * @returns The modified tile object
     */
    static setMeta(tile, key, value) {
        if (!("meta" in tile)) {
            tile.meta = {};
        }
        tile.meta[key] = value;
        return tile;
    }
}

class TileMap {
    uid = "";
    disabled = false;

    atlasData = {};
    atlas;

    tiles = {};

    // The 2D array of tiles
    map = [];

    /*
    
    TODO tilemap

    load tilemap means load a texture and slice it
    
    */

    /**
     * Slices induvidual tiles from a single atlas texture. Fully transparent tiles are discarded.
     * @param {String} resourceId The ID of a loaded resource (texture)
     * @param {Object} atlasData The configuartion of the atlas texture. Default values: `{
     *     rows: 4,
     *     columns: 4,
     *     tileWidth: 16,
     *     tileHeight: 16,
     *     gapX: 0,
     *     gapY: 0,
     * }`
     */
    constructor(resourceId, atlasData) {
        // Load atlas texture
        this.atlas = new Texture(resourceId);

        // Default atlas data
        this.atlasData = {
            rows: 4,
            columns: 4,
            tileWidth: 16,
            tileHeight: 16,
            gapX: 0,
            gapY: 0,
        };

        // Load atlas data
        for (let key in atlasData) {
            this.atlasData[key] = atlasData[key];
        }

        // Slice atlas in to tiles
        this.sliceToTiles(this.atlas.image);
    }

    sliceToTiles(imageObject, atlasData) {

    }
    
    addTile(resourceID, tileData) {this.sliceToTiles(resourceID, atlasData)}
    
    addTiles(resourceID, atlasData) {this.sliceToTiles(resourceID, atlasData)}

    // Custom meta
    setTileMeta(key, value) {}
    
    getTileMeta() {}

    // Nav and mesh
    setTileData(key, value) {}


    getTileByName(id) {}
    getTileByAtlasPos(x, y) {}


    /**
     * Slices tilemaps into tiles, and calculates tile data
     */
    sliceTilemaps() {
        for (let name in textures) {
            if (!("mapData" in textures[name])) continue;

            // Tile map data
            let map = textures[name].mapData;

            let bitmapImage = textures[map.bitmapName].image;

            //document.body.appendChild(bitmapImage);

            console.log("Slicing tilemap:", name);
            console.log("Bitmap:", bitmapImage, bitmapImage.width, bitmapImage.height);

            let bitmapC = document.createElement("canvas");
            let bitmapCtx = bitmapC.getContext("2d");

            bitmapC.width = map.width * 3;
            bitmapC.height = map.height * 3;

            bitmapCtx.drawImage(bitmapImage, 0,0, bitmapC.width, bitmapC.height);

            // Add tiles to array
            for (let y = 0; y < map.height; y++) {
                for (let x = 0; x < map.width; x++) {
                    let tileC = document.createElement("canvas");
                    let tileCtx = tileC.getContext("2d");

                    tileC.width = 3;
                    tileC.height = 3;

                    // Draw 1 tile from bitmap
                    tileCtx.drawImage(bitmapC, x*3,y*3, 3,3, 0,0, 3,3);
                    
                    //Get tile data (row by row) (filter for red channel only)
                    let tileData = tileCtx.getImageData(0,0, 3,3);
                    tileData = tileData.data.filter((a, index) => index % 4 == 0);

                    // Do not push empty tiles
                    if (!tileData.includes(255)) continue;

                    // Produce eighbour map
                    let neighbours = [
                        tileData[0], //Top left
                        tileData[1], //Top
                        tileData[2], //Top right
                        
                        tileData[5], //Right
                        
                        tileData[8], //Bottom right
                        tileData[7], //Bottom
                        tileData[6], //Bottom left
                        
                        tileData[3], //Left
                    ]

                    neighbours = neighbours.map((a) => a == 0 ? 0 : 1);

                    textures[name].mapData.tiles.push({
                        connections: neighbours.join(''),
                        cropX: x * map.tileWidth,
                        cropY: y * map.tileHeight,
                    });
                }
            }
        }
    }

    /**
     * Renders the the given texture, at the given coordinates, with scaling and rotating options.
     * @param {String} name Name of the texture
     * @param {Array} connections Array of connected edges 0 if edge has no connection, 1 if edge have connection
     * @param {Number} x Screen X (top-left corner)
     * @param {Number} y Screen Y (top-left corner)
     * @param {Number} width Width of the texture
     * @param {Number} height Height of the texture
     * @param {Number} rotation In degrees
     * @param {Number} margin Inset from width and height
     */
    drawTileByConnections(name, connections, x, y, width = 16, height = 16, rotation = 0, margin = 0) {
        if (!(name in textures)) return;
        if (!("mapData" in textures[name])) return;

        let map = textures[name].mapData;
        let connectionString = connections.join('');

        if (map.tiles.length == 0) throw new Error(`No tiles found in tilemap '${name}'`);

        //Find tile with correct connections
        let tileIndex = 0;
        for (let i = 0; i < map.tiles.length; i++) {
            let tile = map.tiles[i];
            if (tile.connections == connectionString) {
                tileIndex = i;
                break;
            }
        }

        //console.log("Drawing:", name, connectionString, tileIndex);
        
        let tileData = textures[name].mapData.tiles[tileIndex];
        let cropData = [tileData.cropX, tileData.cropY, map.tileWidth, map.tileHeight];

        //console.log("Data:", textures[name].image, x,y, cropData, width,height, rotation, margin);

        drawImageRotated(textures[name].image, x,y, cropData, width,height, rotation, margin);
    }

    update() {}

    destroy() {
        this.disabled = true;
    }
}