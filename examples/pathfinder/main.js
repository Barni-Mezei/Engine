/** @type {TileMap} */
let tilemap;

let editorPos = new Vector(); // World coordinate
let cursorPos = new Vector(); // Snapped world space coordinate
let tilePos = new Vector(); // Tilemap tile coordinate

let path;
let characters = [];

let spawnPos = new Vector(-1);
let goalPos = new Vector(-1);

let currentTileId = ""; // Name of the current tile

const GRID_SIZE = new Vector(20);
let DONE = false;
let ATTEMPTS = 0;

/* Helper functions */
function fitToView() {
    editorPos = tilemap.center;
    camera.zoom = (Math.min(c.width, c.height) / Math.max(tilemap.size.x, tilemap.size.y)) * 0.9;
}


class Character extends AnimatedSprite {
    static ID = 0;

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

        super(startPos, new Vector(100), animations, color);

        this.origin.y = 100;
        this.origin.x = 50;

        this.agent = pathFollow;

        this.name = new Label2D(`${++Character.ID}`);
        this.name.setSize(16);

        this.collider = new ColliderAABB(this.pos, new Vector(50,75), new Vector(25, 25));

        this.shadow = new Texture("shadow");

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

        this.agent.speed = time.ups.delta * 0.1;
        this.agent.update();
    }

    render() {
        camera.renderTexture(this.shadow, this.pos.x + (100/32)*0.5, this.pos.y + (100/32)*2, this.width, this.height);
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
    /*addTileRotated(iota++, "water",              ["www", "www", "www", "www"], 15, 1);
    addTileRotated(iota++, "forest",             ["fff", "fff", "fff", "fff"], 13, 1);
    addTileRotated(iota++, "grass",              ["ggg", "ggg", "ggg", "ggg"], 15, 0.5);
    addTileRotated(iota++, "path_crossing",      ["gpg", "gpg", "gpg", "gpg"], 1,  0);
    addTileRotated(iota++, "shore",              ["wsg", "ggg", "gsw", "www"], 7,  1);
    addTileRotated(iota++, "water_corner",       ["wsg", "ggg", "ggg", "gsw"], 7,  1);
    addTileRotated(iota++, "island_corner",      ["wsg", "gsw", "www", "www"], 6,  1);
    addTileRotated(iota++, "forest_edge",        ["fmg", "ggg", "gmf", "fff"], 7,  1);
    addTileRotated(iota++, "corner_forest_edge", ["fmg", "ggg", "ggg", "gmf"], 7,  1);
    addTileRotated(iota++, "clearing_corner",    ["fmg", "gmf", "fff", "fff"], 6,  1);
    addTileRotated(iota++, "staright_path",      ["gpg", "ggg", "gpg", "ggg"], 4,  0);
    addTileRotated(iota++, "corner_path",        ["gpg", "gpg", "ggg", "ggg"], 4,  0);
    addTileRotated(iota++, "path_junction",      ["gpg", "gpg", "ggg", "gpg"], 2,  0);
    addTileRotated(iota++, "square",             ["gpg", "ggg", "ggg", "ggg"], 2,  0);*/

    addTileRotated(iota++, "water",              ["www", "www", "www", "www"], 10, 1);
    addTileRotated(iota++, "forest",             ["fff", "fff", "fff", "fff"], 10, 1);
    addTileRotated(iota++, "grass",              ["ggg", "ggg", "ggg", "ggg"], 10, 0.5);
    addTileRotated(iota++, "path_crossing",      ["gpg", "gpg", "gpg", "gpg"], 8,  0);
    addTileRotated(iota++, "shore",              ["wsg", "ggg", "gsw", "www"], 7,  1);
    addTileRotated(iota++, "water_corner",       ["wsg", "ggg", "ggg", "gsw"], 7,  1);
    addTileRotated(iota++, "island_corner",      ["wsg", "gsw", "www", "www"], 6,  1);
    addTileRotated(iota++, "forest_edge",        ["fmg", "ggg", "gmf", "fff"], 7,  1);
    addTileRotated(iota++, "corner_forest_edge", ["fmg", "ggg", "ggg", "gmf"], 7,  1);
    addTileRotated(iota++, "clearing_corner",    ["fmg", "gmf", "fff", "fff"], 6,  1);
    addTileRotated(iota++, "staright_path",      ["gpg", "ggg", "gpg", "ggg"], 8,  0);
    addTileRotated(iota++, "corner_path",        ["gpg", "gpg", "ggg", "ggg"], 8,  0);
    addTileRotated(iota++, "path_junction",      ["gpg", "gpg", "ggg", "gpg"], 8,  0);
    addTileRotated(iota++, "square",             ["gpg", "ggg", "ggg", "ggg"], 8,  0);

    addTileRotated(iota++, "error",              ["xxx", "yxx", "xyx", "yyx"], 1,  1);

    tilemap.deleteTile("error_0");
    tilemap.deleteTile("error_1");
    tilemap.deleteTile("error_2");
    tilemap.deleteTile("error_3");

    eraseGrid();

    // Initialise camera
    fitToView();
}

function generationDone() {
    setNavigation()
}

function update(delta) {
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

    if (input.mouse.left) {
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

    if (isKeyPressed("f")) {
        fitToView();
    }

    camera.clampValues();
    camera.lookAt(editorPos, true);
    camera.update();

    // Cursor and tile position
    cursorPos = camera.c2w(Vector.fromObject(input.mouse)).sub(tilemap.tileSize.mult(0.5));
    tilePos = cursorPos.mult(1 / tilemap.tileWidth).round()
    cursorPos = tilePos.mult(tilemap.tileWidth);
    currentTileId = tilemap.getTileAt(0, tilePos);

    // Tilemap updating functions
    if (input.mouse.right) {
        eraseSection(tilePos.x, tilePos.y, 5, 5);
        DONE = false;
    }

    // Generating
    if (!DONE) {
        for (let i = 0; i < 10; i++) {
            iterate();
        }
    }

    // Pathfinding
    if (isKeyPressed("q")) {
        let newCharacter = new Character(tilePos.mult(tilemap.tileSize).add(tilemap.tileSize.mult(0.5)));

        characters.push(newCharacter);
    }

    if (isKeyPressed("e")) {
        goalPos = tilePos;
    }

    if (isKeyJustPressed("space")) {
        // Erase visited tiles
        tilemap.map("collision_0", function (x, y, cell) {return false});


        path = tilemap.findPath(0, spawnPos, goalPos, "astar");

        for (let i in path.points) {
            path.points[i] = path.points[i].mult(tilemap.tileSize).add(tilemap.tileSize.mult(0.5));
        }
    }
}

function render(delta) {
    ctx.clearRect(0, 0, c.width, c.height);

    //tilemap.render("#44444488", camera.w2csX(2), false, true);
    tilemap.render("#00000000", 0, false, false);
    
    // Current hovered tile
    if (currentTileId != null) {
        ctx.drawImage(
            tilemap.getTileById(currentTileId).texture.image,
            c.width - 50, 0, 50, 50
        );
    }

    // Markers
    if (spawnPos.x != -1) {
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = camera.w2csX(4);
        ctx.beginPath();
        ctx.rect(...camera.w2cf(spawnPos.mult(tilemap.tileSize), tilemap.tileSize));
        ctx.stroke()
    }

    if (goalPos.x != -1) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = camera.w2csX(4);
        ctx.beginPath();
        ctx.rect(...camera.w2cf(goalPos.mult(tilemap.tileSize), tilemap.tileSize));
        ctx.stroke()
    }

    if (path) path.render();

    // Tile cursor
    ctx.strokeStyle = "#00ddff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(...camera.w2c(cursorPos.add(tilemap.tileSize.mult(0.5))).toArray(), camera.w2csX(tilemap.tileWidth*0.5), 0, Math.PI*2);
    ctx.stroke()

    document.getElementById("text").innerText += `Attempts: ${ATTEMPTS}` + "\n";
    document.getElementById("text").innerText += `Cursor: ${tilePos.x};${tilePos.y}` + "\n";
    document.getElementById("text").innerText += `Current tile: ${currentTileId}` + "\n";
    document.getElementById("text").innerText += `Entropy: ${tilemap.getTileNavigationAt(0, tilePos)}` + "\n";
    document.getElementById("text").innerText += `Tile meta: \n`;

    let tileMeta = tilemap.getTileMetaAt(0, tilePos);
    for (let key in tileMeta) {
        document.getElementById("text").innerText += `- ${key}[${tileMeta[key].length ?? "."}]: ${tileMeta[key]}\n`;
    }
}