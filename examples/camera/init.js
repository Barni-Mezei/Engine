window.onresize = _resizeCanvas;

function _resizeCanvas() {
    // Ensure the canvas is pixel perfect
    c.width = round(c.offsetWidth);
    c.height = round(c.offsetHeight);
}

_resizeCanvas();

settings.fpsUpdateInterval = 2000;

settings.camera.slideSpeed = 0.05;
settings.camera.zoomSpeed = 1;

camera.zoom = 0;

//camera.rounded = 0;
//camera.isFinite = true;

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
Resource.loadTexture("../res/placeholder.png", "grass", [0, 16, 16, 16], [2, 0.5]);
Resource.loadTexture("../res/placeholder.png", "blue", [16, 0, 16, 16]);

Resource.loadSound("../res/switch_on.mp3", "switch_on");
Resource.loadSound("../res/switch_off.mp3", "switch_off");

Resource.startLoading();