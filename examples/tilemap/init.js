setKeybind("space", "\\ ");

setKeybind("left", "ArrowLeft");
setKeybind("right", "ArrowRight");
setKeybind("up", "ArrowUp");
setKeybind("down", "ArrowDown");

setKeybind("q", "q");
setKeybind("e", "e");
setKeybind("w", "w");
setKeybind("a", "a");
setKeybind("s", "s");
setKeybind("d", "d");

setKeybind("add", "\\+");
setKeybind("sub", "\\-");

addDebugOption("grid", "Show grid", "bool", false);

Resource.loadTexture("../res/small_tiles.png", "terrain");
Resource.loadFile("./test.json", "terrain_test");
Resource.loadFile("./map01.json", "tiled_tilemap");
Resource.loadFile("./map01.json", "tiled_tileset");
Resource.startLoading();
