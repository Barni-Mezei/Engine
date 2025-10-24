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

document.getElementById("debug").classList.remove("hidden");

Resource.loadTexture("../res/tile_set_01.png", "terrain");
Resource.loadTexture("../res/desert_reduced.png", "desert");
Resource.loadTexture("../res/characters.png", "player", [0,0, 32,32]);

Resource.startLoading();
