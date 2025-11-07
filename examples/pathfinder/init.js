setKeybind("space", "\\ ");

setKeybind("left", "ArrowLeft");
setKeybind("right", "ArrowRight");
setKeybind("up", "ArrowUp");
setKeybind("down", "ArrowDown");

setKeybind("w", "w");
setKeybind("a", "a");
setKeybind("s", "s");
setKeybind("d", "d");

setKeybind("q", "q");
setKeybind("e", "e");

setKeybind("f", "f");
setKeybind("r", "r");

setKeybind("add", "\\+");
setKeybind("sub", "\\-");

addDebugOption("travel", "Travel cost", "bool", false);
addDebugOption("coll", "Pathfinding", "bool", false);
addDebugOption("path", "Paths", "bool", false);

setDebugMenu(true);

Resource.loadTexture("../res/tile_set_01.png", "terrain");
Resource.loadTexture("../res/characters.png", "player_idle", [0, 0, 32, 32]);
Resource.loadTexture("../res/characters.png", "player_walk", [0, 0, 32, 32], [4, 0.15]);
Resource.loadTexture("../res/characters.png", "player_jump", [32, 0, 32, 32], [4, 0.15]);
Resource.loadTexture("../res/shadow.png", "shadow", [0, 0, 32, 32], [2, 0.15]);

Resource.startLoading();
