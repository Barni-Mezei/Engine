class TileMap {
    uid = "";
    disabled = false;

    texture;
    bitmap;

    constructor(textureId, bitmapId) {
        this.texture = new Texture(textureId);
        this.bitmap = new Texture(bitmapId);

        this.sliceTilemaps();
    }

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