camera.settings.glideSpeed = 0.1;

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

Resource.loadTexture("../res/placeholder.png", "player", [0, 0, 16, 16], [4, 0.1, "loop", 2]);
Resource.loadTexture("../res/placeholder.png", "grass", [0, 16, 16, 16]);
Resource.loadTexture("../res/placeholder.png", "blue", [16, 0, 16, 16]);

Resource.loadSound("../res/switch_on.mp3", "switch_on");
Resource.loadSound("../res/switch_off.mp3", "switch_off");

Resource.startLoading();