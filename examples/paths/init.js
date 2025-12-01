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

camera.settings.glideSpeed = 0.05;
camera.settings.zoomSpeed = 0.5;

camera.zoom = 0.75;

addDebugOption("boxes", "Show boxes", "bool", false);
addDebugOption("paths", "Show paths", "bool", false);
setDebugMenu(true);

Resource.loadTexture("../res/characters.png", "soldier_idle", [0, 0, 32, 32]);
Resource.loadTexture("../res/characters.png", "soldier_walk", [0, 0, 32, 32], [4, 0.15]);
Resource.loadTexture("../res/characters.png", "soldier_jump", [32*4, 0, 32, 32], [4, 0.15]);
Resource.loadFile("./settings.json", "settings");
Resource.startLoading();


/*Resource.maxLoadables = 1;
Resource.loadFromFile("./imports.json").then(() => {Resource.maxLoadables -= 1; Resource.startLoading()} );*/