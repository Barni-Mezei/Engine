/** @type {TileMap} */
let tilemap;

let editorPos = new Vector();
let cursorPos = new Vector();
let tilePos = new Vector();

let currentTile = "";
let currentTileIndex = 0;

let navStrength = 0;

let allLayers = ["graphics_0", "graphics_1", "navigation_0"];
let currentLayerIndex = 0;

let soldiers = [];

class Soldier extends AnimatedSprite {
    agent;

    collider;

    name;

    cooldown = 0;
    tagetPos = new Vector();


    constructor(pathFollow, color) {
        let animations = {
            "idle": new Texture("soldier_idle"),
            "walk": new Texture("soldier_walk"),
            "jump": new Texture("soldier_jump"),
        }

        super(new Vector(), new Vector(100), animations, color);

        this.origin.y = 100;
        this.origin.x = 50;

        this.agent = pathFollow;

        this.name = new Label2D(`Soldier ${soldiers.length}`);
        this.name.setSize(16);

        this.collider = new ColliderAABB(this.pos, this.size);
    }

    update() {
        super.update();

        this.pos = this.agent.pos;
        this.collider.pos = this.pos;

        this.name.setCenter( this.pos.add(new Vector(this.centerOffset.x, 0)) );
        this.name.pos.y += 20;

        // Set scale
        /*if (this.agent.path.getPoint(this.agent.lastPointIndex).x < this.pos.x + Math.abs(this.size.x / 2)) {
            this.scale.x = -1;
        } else {
            this.scale.x = 1;
        }*/

        if (this.agent.lastPointIndex == 0) {
            this.play("walk");
        } else {
            this.play("idle");
        }
    }

    render() {
        if (settings.debug?.boxes) {
            this.collider.render();
        }

        if (this.collider.isColliding(mouse.pos)) {
            this.name.render();
        }

        super.render();
    }
}

async function init() {
    tilemap = TileMap.importFromTiled("terrain", await FileResource.getJson("tiled_tilemap"));

    /*tilemap = new TileMap("terrain", {tileWidth: 16, tileHeight: 16}, 10, 10);

    tilemap.clear("graphics_0", "tile_0_0");
    let newLayerId = tilemap.addLayer("graphics");

    console.log(newLayerId);*/

    // Add navigation
    tilemap.clear("navigation_0", 1);
    tilemap.setGrid("navigation_0", Grid.fromArray([
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]))

    /*tilemap.clear("graphics_0", "tile_0_0");
    tilemap.clear("graphics_1", null);
    tilemap.clear("navigation_0", 0);*/

    editorPos = tilemap.center;

    //camera.settings.rounded = true;
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

    if (input.mouse.middle) {
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

    camera.clampValues();
    camera.lookAt(editorPos, true);
    camera.update();

    // Editor controls

    // Cursor and tile position
    cursorPos = camera.c2w(Vector.fromObject(input.mouse)).sub(tilemap.tileSize.mult(0.5));
    tilePos = cursorPos.mult(1 / tilemap.tileWidth).round()
    cursorPos = tilePos.mult(tilemap.tileWidth);

    if (isKeyJustPressed("q")) {
        currentTileIndex -= 1;
    }

    if (isKeyJustPressed("e")) {
        currentTileIndex += 1;
    }

    if (currentTileIndex < 0) currentTileIndex = Object.keys(tilemap.tiles).length - 1;
    if (currentTileIndex > Object.keys(tilemap.tiles).length - 1) currentTileIndex = 0;

    currentTile = tilemap.tiles[ Object.keys(tilemap.tiles)[currentTileIndex] ].id;

    if (isKeyJustPressed("r")) {
        currentLayerIndex += 1;
    }

    if (isKeyJustPressed("f")) {
        currentLayerIndex -= 1;
    }

    if (currentLayerIndex < 0) currentLayerIndex = allLayers.length - 1;
    if (currentLayerIndex > allLayers.length - 1) currentLayerIndex = 0;

    if (isKeyJustPressed("up")) {
        navStrength += 0.1;
    }

    if (isKeyJustPressed("down")) {
        navStrength -= 0.1;
    }

    navStrength = clamp(navStrength, 0, 1);

    // Set tiles
    if (input.mouse.left) {
        if (currentLayerIndex < 2) {
            tilemap.setTileAt(currentLayerIndex, tilePos, currentTile);
        } else {
            tilemap.setTileNavigationAt(0, tilePos, navStrength);
        }
    }

    // Reset tiles
    if (input.mouse.right) {
        if (currentLayerIndex < 2) {
            tilemap.setTileAt(currentLayerIndex, tilePos, null);
        } else {
            tilemap.setTileNavigationAt(0, tilePos, 1);
        }
    }

    // Other controls
    if (isKeyJustPressed("space")) {
        let newSoldier = new Soldier(
            new PathFollow(4),
            "#ff0000"
        );

        newSoldier.agent.canFinish = false;

        tilemap.layers.navigation_0.objects[0].addAgent(newSoldier.agent);

        soldiers.push(newSoldier);

    }

    for (let soldier of soldiers) {
        soldier.update();
    }
}

function render() {
    ctx.clearRect(0, 0, c.width, c.height);

    if (settings.debug.grid) {
        tilemap.render("#444", camera.w2csX(0.5));
    } else {
        tilemap.render();
    }

    for (let soldier of soldiers) {
        soldier.render();
    }

    // Center
    /*ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(...camera.w2cXY(editorPos.x, editorPos.y), 10, 0, Math.PI * 2);
    ctx.fill()*/

    // Tile cursor
    ctx.strokeStyle = "#00ddff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(...camera.w2cf(cursorPos, tilemap.tileSize));
    ctx.stroke()

    // Current tile display
    ctx.beginPath();
    ctx.fillStyle = "#000";
    ctx.fillRect(c.width - 52, 0, 52, 52*2);

    ctx.drawImage(
        tilemap.getTileById(currentTile).texture,
        c.width - 50, 0, 50, 50
    );

    ctx.fillStyle = `rgba(255, 0, 0, ${navStrength})`;
    ctx.fillRect(
        c.width - 50, 53, 50, 50
    );

    document.getElementById("text").innerText += `${tilePos.x}, ${tilePos.y}: ${tilemap.getTileAt(0, tilePos)}` + "\n";
    document.getElementById("text").innerText += `Current layer [${currentLayerIndex}]: ${allLayers[currentLayerIndex]}` + "\n";
    document.getElementById("text").innerText += `Current tile [${currentTileIndex}]: ${currentTile}` + "\n";
}