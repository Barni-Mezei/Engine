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
    //static ID = 0;

    agent;

    collider;

    name;

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

        this.name = new Label2D(`Soldier ${1}`); //++Soldier.ID
        this.name.setSize(16);

        this.collider = new ColliderAABB(this.pos, new Vector(50,75), new Vector(25, 25));

        this.play("walk");

        // Set initial position
        this.update();
    }

    update() {
        super.update();

        this.pos = this.agent.pos.sub(this.origin);
        this.collider.setPos(this.pos);

        this.name.setCenter( this.pos.add(new Vector(this.centerOffset.x, 0)) );
        this.name.pos.y += 20;

        if (this.agent.finished) {
            this.destroy();
            return;
        }

        this.agent.update();
    }

    render() {
        super.render();

        if (settings.debug?.boxes) {
            this.collider.render();

            ctx.fillStyle = "#ff0000";
            ctx.beginPath();
            ctx.arc(...camera.w2c(this.pos.add(this.origin)).toArray(), camera.w2csX(4), 0, Math.PI*2);
            ctx.fill();
        }

        if (this.collider.isColliding(camera.c2w(input.mouse.pos))) {
            this.name.render();
        }
    }

    destroy() {
        this.agent.removePath();
        this.agent = null;

        super.destroy();
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
}

function cameraControls(delta) {
    let movementSpeed = clamp(1 / camera.realZoom, 1, 50) * delta;

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
}

function update(delta) {
    // Camera controls
    cameraControls(delta);

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
        for (let i = 0; i < 500; i++) {
            let newAgent = new PathFollow(2);
            newAgent.setPath(tilemap.layers.navigation_0.objects[0]);
    
            let newSoldier = new Soldier(newAgent, "#ff0000");
            soldiers.push(newSoldier);
        }
    }

    for (let s of soldiers) {
        s.update();
    }

    // Udate path
    //tilemap.layers.navigation_0.objects[0].update();
    //tilemap.layers.navigation_0.objects[0].clearFinishedAgents();

    let oldLength = soldiers.length;

    soldiers = soldiers.filter(s => !s.disabled);

    // Create a new soldier if one finishes
    /*if (soldiers.length != oldLength) {
        let newAgent = new PathFollow(randFloat(1, 3));
        newAgent.setPath(tilemap.layers.navigation_0.objects[0]);

        let newSoldier = new Soldier(newAgent, "#ff0000");
        soldiers.push(newSoldier);
    }*/
}

function render(delta) {
    ctx.clearRect(0, 0, c.width, c.height);

    if (settings.debug.grid) {
        tilemap.render("#444", camera.w2csX(0.5), settings.debug.collision, settings.debug.navigation);
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
    document.getElementById("text").innerText += `Soldiers: ${soldiers.length}` + "\n";
    //document.getElementById("text").innerText += `PathFollow: ${tilemap.layers.navigation_0.objects[0].agents.length}` + "\n";
    document.getElementById("text").innerText += `U Delta: ${time.ups.delta}` + "\n";
    document.getElementById("text").innerText += `F Delta: ${time.fps.delta}` + "\n";
    document.getElementById("text").innerText += `Cache size: ${Object.keys(Resource._parallelCache).length}` + "\n";
}