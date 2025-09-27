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

Resource.loadTexture("../res/small_tiles.png", "terrain");
Resource.loadFile("./tilemap.json", "terrain_tilemap");
Resource.startLoading();