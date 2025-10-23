camera.settings.glideSpeed = 0.1;
//camera.zoom = 0.5;

setKeybind("moveUp", "w")
setKeybind("moveLeft", "a")
setKeybind("moveDown", "s")
setKeybind("moveRight", "d")

setKeybind("up", "ArrowUp")
setKeybind("left", "ArrowLeft")
setKeybind("down", "ArrowDown")
setKeybind("right", "ArrowRight")

setKeybind("space", "\\ ")
setKeybind("add", "\\+")
setKeybind("sub", "-")

Resource.loadTexture("../res/placeholder.png", "player", [0, 0, 16, 16]);
Resource.loadTexture("../res/placeholder.png", "grass", [16, 16, 16, 16]);
Resource.loadTexture("../res/placeholder.png", "blue", [16, 0, 16, 16]);

Resource.loadSound("../res/switch_on.mp3", "switch_on");
Resource.loadSound("../res/switch_off.mp3", "switch_off");
Resource.loadSound("../res/gameboy.mp3", "game");

Resource.loadFile("item_list.json", "item_list");
Resource.loadFile("block_list.json", "block_list");

Resource.startLoading();
