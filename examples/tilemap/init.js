setKeybind("space", "\\ ");

setKeybind("left", "ArrowLeft");
setKeybind("right", "ArrowRight");
setKeybind("up", "ArrowUp");
setKeybind("down", "ArrowDown");

setKeybind("q", "q");
setKeybind("e", "e");

setKeybind("f", "f");
setKeybind("r", "r");

setKeybind("w", "w");
setKeybind("a", "a");
setKeybind("s", "s");
setKeybind("d", "d");

setKeybind("add", "\\+");
setKeybind("sub", "\\-");

addDebugOption("grid", "Show grid", "bool", true);
addDebugOption("collision", "Show colliders", "bool", false);
addDebugOption("navigation", "Show navigation", "bool", false);
addDebugOption("boxes", "Show boxes", "bool", false);

setDebugMenu(true);

//Resource.loadTexture("../res/small_tiles_animated.png", "terrain", [0,0, 64,64]);
Resource.loadTexture("../res/small_tiles_animated.png", "terrain", [0,0, 64,64], [4, 0.25, "loop", 2, 1]);
Resource.loadFile("./test.json", "terrain_test");
Resource.loadFile("./map01.json", "tiled_tilemap");
Resource.loadFile("./map01.json", "tiled_tileset");

Resource.loadTexture("../res/characters.png", "soldier_idle", [0, 0, 32, 32]);
Resource.loadTexture("../res/characters.png", "soldier_walk", [0, 0, 32, 32], [4, 0.15]);
Resource.loadTexture("../res/characters.png", "soldier_jump", [32, 0, 32, 32], [4, 0.15]);
Resource.loadTexture("../res/shadow.png", "shadow", [0, 0, 32, 32], [2, 0.15]);

Resource.startLoading();