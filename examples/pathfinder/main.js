/** @type {TileMap} */
let tilemap;

let editorPos = new Vector(); // World coordinate
let cameraOffset = new Vector();
let cursorPos = new Vector(); // Snapped world space coordinate
let tilePos = new Vector(); // Tilemap tile coordinate

let player;
let following = false;

let currentTileId = ""; // Name of the current tile

const GRID_SIZE = new Vector(100);
let collapsedTiles = 0;
let DONE = false;
let ATTEMPTS = 0;

/* Helper functions */
function fitToView() {
    editorPos = tilemap.center;
    camera.zoom = (Math.min(c.width, c.height) / Math.max(tilemap.size.x, tilemap.size.y)) * 0.9;
}

class Character extends AnimatedSprite {
    static ID = 0;

    speedScale = 0.25;

    path;
    agent;

    collider;

    name;

    shadow;

    constructor(startPos) {
        let animations = {
            "idle": new Texture("player_idle"),
            "walk": new Texture("player_walk"),
            "jump": new Texture("player_jump"),
        }

        super(startPos, new Vector(50), animations);

        this.origin.y = 50;
        this.origin.x = 25;

        this.agent = new PathFollow(4);
        this.path = new Path([startPos, startPos]);
        this.agent.setPath(this.path);

        this.name = new Label2D(`Sir montington the III`);
        this.name.setSize(16);

        this.collider = new ColliderAABB(this.pos, new Vector(25, 32), new Vector(12.5, 20));

        this.shadow = new AnimatedSprite(new Vector(), new Vector(50), {
            "idle": new Texture("shadow"),
            "walk": new Texture("shadow_walk"),
        });

        this.play("idle");
        this.shadow.play("idle");

        // Set initial position
        this.update();
    }

    setGoal(tilePos) {
        let tileSpacePos = this.pos.add(this.origin).sub(tilemap.tileSize.mult(0.5));
        let tileBelow = tileSpacePos.mult(1 / tilemap.tileWidth).round();

        let foundPath = tilemap.findPath(0, tileBelow, tilePos, "astar", settings.debug?.jitter);

        if (foundPath === null) return;

        this.path.points = foundPath.points;

        this.pos = this.path.points[0].copy();
        this.agent.lastPointIndex = 0;
        this.agent.following = true;
        this.agent.finished = false;

        this.play("walk");
        this.shadow.play("walk");
    }

    update(delta) {
        super.update();

        this.pos = this.agent.pos.sub(this.origin);
        this.collider.setPos(this.pos);

        this.name.setCenter( this.pos.add(new Vector(this.centerOffset.x, 20)) );
        //this.name.pos.y += 20;

        //camera.renderTexture(this.shadow, this.pos.x + (100/32)*0.5, this.pos.y + (100/32)*2, this.width, this.height);
        this.shadow.setCenter( this.pos.add(new Vector(this.centerOffset.x + 1, 27)) );
        this.shadow.update();

        // Get position
        let tileSpacePos = this.pos.add(this.origin).sub(tilemap.tileSize.mult(0.5));
        let tileBelow = tileSpacePos.mult(1 / tilemap.tileWidth).round();

        this.agent.speed = Math.max(1 - tilemap.getTileNavigationAt(0, tileBelow), 0.25) * this.speedScale * delta;

        if (this.agent.finished) {
            this.play("idle");
            this.shadow.play("idle");
            return;
        }

        this.agent.update(delta);
    }

    render() {
        if (settings.debug?.path) this.path.render();

        this.shadow.render();
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

        this.shadow.destroy();

        super.destroy();
    }
}


// Game loop
function init() {
    tilemap = new TileMap("terrain", {tileWidth: 16, tileHeight: 16}, GRID_SIZE.x, GRID_SIZE.y);

    /*
    w: Water
    s: Sand
    g: Grass
    m: Meadow
    f: Forest
    p: Path
    */

    function addTileRotated(y, name, sides, weight, travelCost) {
        tilemap.setTileMeta(`tile_0_${y}`, "sides", [sides[0], sides[1], sides[2], sides[3]]);
        tilemap.setTileMeta(`tile_1_${y}`, "sides", [sides[3], sides[0], sides[1], sides[2]]);
        tilemap.setTileMeta(`tile_2_${y}`, "sides", [sides[2], sides[3], sides[0], sides[1]]);
        tilemap.setTileMeta(`tile_3_${y}`, "sides", [sides[1], sides[2], sides[3], sides[0]]);

        for (let i = 0; i < 4; i++) {
            tilemap.setTileMeta(`tile_${i}_${y}`, "weight", weight);
            tilemap.setTileMeta(`tile_${i}_${y}`, "travelCost", travelCost);
            tilemap.renameTile(`tile_${i}_${y}`, `${name}_${i}`);
        }
    }

    let iota = 0;
    addTileRotated(iota++, "water",              ["www", "www", "www", "www"], 10, 1);
    addTileRotated(iota++, "forest",             ["fff", "fff", "fff", "fff"], 10, 1);
    addTileRotated(iota++, "grass",              ["ggg", "ggg", "ggg", "ggg"], 20, 0.25);
    addTileRotated(iota++, "path_crossing",      ["gpg", "gpg", "gpg", "gpg"], 1,  0);
    addTileRotated(iota++, "shore",              ["wsg", "ggg", "gsw", "www"], 3,  0.5);
    addTileRotated(iota++, "water_corner",       ["wsg", "ggg", "ggg", "gsw"], 3,  0.95);
    addTileRotated(iota++, "island_corner",      ["wsg", "gsw", "www", "www"], 2,  0.95);
    addTileRotated(iota++, "forest_edge",        ["fmg", "ggg", "gmf", "fff"], 3,  0.85);
    addTileRotated(iota++, "corner_forest_edge", ["fmg", "ggg", "ggg", "gmf"], 3,  0.85);
    addTileRotated(iota++, "clearing_corner",    ["fmg", "gmf", "fff", "fff"], 2,  0.95);
    addTileRotated(iota++, "staright_path",      ["gpg", "ggg", "gpg", "ggg"], 2,  0);
    addTileRotated(iota++, "corner_path",        ["gpg", "gpg", "ggg", "ggg"], 2,  0);
    addTileRotated(iota++, "path_junction",      ["gpg", "gpg", "ggg", "gpg"], 1,  0);
    addTileRotated(iota++, "square",             ["gpg", "ggg", "ggg", "ggg"], 1,  0);

    addTileRotated(iota++, "error",              ["xxx", "yxx", "xyx", "yyx"], 1,  1);

    tilemap.deleteTile("error_0");
    tilemap.deleteTile("error_1");
    tilemap.deleteTile("error_2");
    tilemap.deleteTile("error_3");

    eraseGrid();

    // Initialise camera
    camera.settings.minZoom = 0.01;

    // Spawn the player randomly
    player = new Character(tilemap.tileCenterToWorld(new Vector(randInt(0, tilemap.width), randInt(0, tilemap.height))));

    fitToView();

    cameraOffset = player.origin;
}

function generationDone() {
    tilemap.foreach("graphics_0", function(x, y, tile) {
        tilemap.setTileNavigationAt(0, new Vector(x, y), tile.meta.travelCost);
    });
}

function update(delta) {
    // Camera controls
    let movementSpeed = clamp(2 / camera.realZoom, 5, 50) * delta * 0.2;

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
        if (following && !input.mouse.oldMiddle) {
            editorPos = player.pos.sub(cameraOffset);
        }
        following = false;
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

    // Center map on screen
    if (isKeyPressed("f")) {
        following = false;
        fitToView();
    }

    camera.clampValues();
    if (following) {
        editorPos = Vector.lerp(editorPos, player.pos, 0.1);
        camera.lookAt(editorPos.add(cameraOffset), true);
    } else {
        camera.lookAt(editorPos, true);
    }
    camera.update();

    // Cursor and tile position
    cursorPos = camera.c2w(Vector.fromObject(input.mouse)).sub(tilemap.tileSize.mult(0.5));
    tilePos = cursorPos.mult(1 / tilemap.tileWidth).round()
    cursorPos = tilePos.mult(tilemap.tileWidth);
    currentTileId = tilemap.getTileAt(0, tilePos);

    // Tilemap updating functions
    if (input.mouse.right) {
        eraseSection(tilePos.x, tilePos.y, 9, 9);
        DONE = false;
    }

    // Generating
    if (!DONE) {
        for (let i = 0; i < settings.debug?.iter ?? 1; i++) {
            iterate();
        }
    }

    // Pathfinding
    if (input.mouse.left) {
        if (tilemap.getGrid("graphics_0").isInGrid(tilePos.x, tilePos.y)) {
            // Erase visited tiles
            tilemap.map("collision_0", function (x, y, cell) {return false});

            player.setGoal(tilePos);
        }
    }

    if (isKeyJustPressed("space")) {
        if (following) {
            // Focused on the map
            editorPos = player.pos.add(cameraOffset);
        } else {
            // Focused on the player
            camera.zoom = 2.15;

        }

        following = !following;


    }

    player.update(delta);
}

function render(delta) {
    ctx.clearRect(0, 0, c.width, c.height);

    //tilemap.render("#44444488", camera.w2csX(2), false, true);
    tilemap.render(null, null, settings.debug?.coll, settings.debug?.travel);

    // Current hovered tile
    if (currentTileId != null) {
        ctx.drawImage(
            tilemap.getTileById(currentTileId).texture.image,
            c.width - 50, 0, 50, 50
        );
    }

    player.render(delta);

    // Tile cursor
    ctx.strokeStyle = "#00ddff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(...camera.w2c(cursorPos.add(tilemap.tileSize.mult(0.5))).toArray(), camera.w2csX(tilemap.tileWidth*0.5), 0, Math.PI*2);
    ctx.stroke()

    let precent = round((collapsedTiles / (GRID_SIZE.x * GRID_SIZE.y)) * 100, 2);

    document.getElementById("text").innerText += `Progress: ${collapsedTiles}/${GRID_SIZE.x * GRID_SIZE.y} ${precent}%` + "\n";
    document.getElementById("text").innerText += `Misplaces: ${ATTEMPTS}` + "\n";
    document.getElementById("text").innerText += `Cursor: ${tilePos.x};${tilePos.y}` + "\n";
    document.getElementById("text").innerText += `Current tile: ${currentTileId}` + "\n";
}