/**
 * Dependencies: domManager, resourceManager, resourceLoader, camera, math
 */

/**
 * The canvas DOM element
 */
let c = document.getElementById("maincv");

c.isPixelPerfect = c.classList.contains("pixel-perfect");

/**
 * The rendering context of the canvas
 */
let ctx = c.getContext("2d");

window.onresize = canvasFillScreen;

canvasFillScreen();

buildDebugMenu();

/**
 * Delta time, and fps calculations
 */
let time = {
    elapsed: 0, // Total elapsed time, since start
    _frames: 0, // Number of frames in the measures fps interval
    delta: 0, // Delta time between frames

    buffer: [], // Frame time buffer
    bufferSize: 10, // Maximum length of the buffer

    measureFrame: 0,
    measureDelta: 0,
}

/**
 * Main game settings
 */
let settings = {
    maxNotificationCount: 5,
    enableAudio: true,

    camera: {
        minZoom: 0.25,
        maxZoom: 4,
        zoomSpeed: 1, // Multiplier, for how fast the camera reaches it's target zoom level
        slideSpeed: 0.5, // Multiplier, for how fast the camera reaches it's target position
    },

    debug: {
        fpsUpdateInterval: 1000, // Milliseconds between fps updates, larger intervals are more precise
    },
}

/**
 * Total number of frames
 */
let frameCounter = 0;

/**
 * The current camera in use
 */
let camera = new Camera(new Vector());

let _bodyLoaded = false;

function _mainLoop() {
    frameCounter++;
    time._frames++;
    time.elapsed = performance.now();
    time.delta = time.elapsed - time.measureDelta;

    Resource.update();

    document.getElementById("text").textContent = "";

    // Call user defined update function
    if (typeof(update) === typeof(Function)) update();

    // Call user defined render function
    if (typeof(render) === typeof(Function)) render();

    // Show / hide debug menu
    if (isKeyJustPressed("debug")) {
        document.getElementById("debug").classList.toggle("hidden");
    }

    document.getElementById("text").textContent += "Pressed: " + input.keys.pressed + "\n";
    document.getElementById("text").textContent += "J. pre.: " + input.keys.justPressed + "\n";

    
    updateInputs();

    time.measureDelta = time.elapsed;

    // Update fps counter (literally, count the frames in a time interval)
    if (time.elapsed - time.measureFrame >= settings.debug.fpsUpdateInterval) {
        // Calculate current fps
        let currentFps = makeFinite(time._frames * (1000 / settings.debug.fpsUpdateInterval));

        // Add to rolling buffer
        time.buffer.push(currentFps);
        if (time.buffer.length > time.bufferSize) time.buffer.unshift();

        // Calculate average fps
        time.fps = Math.round(time.buffer.reduce((a, b) => (a + b)) / time.buffer.length);

        document.getElementById("fps").textContent = "FPS: " + time.fps;
        time.measureFrame = time.elapsed;
        time._frames = 0;
    }

    // Synchronise debug settings with the debug menu
    for (let c of document.getElementById("debug").children) {
        if (!c.classList.contains("item")) continue;

        let inputElement = c.querySelector("input,option[selected='']");

        switch (inputElement.getAttribute("type")) {
            case "checkbox":
                settings.debug[inputElement.getAttribute("id")] = inputElement.checked;
                break;

            case "range":
            case "number":
                settings.debug[inputElement.getAttribute("id")] = parseFloat(inputElement.value);
                break;
            
            default:
                settings.debug[inputElement.getAttribute("id")] = inputElement.value;
                break;
        }
    }

    requestAnimationFrame(_mainLoop);
}

// Start script when the body is loaded
document.body.onload = function (e) {
    _bodyLoaded = true;
    _start();
}

function _start() {
    if (!_bodyLoaded) return;
    if ((Resource.maxLoadables - Resource.loaded) != 0) return;
    if (frameCounter != 0) return;

    // Call init function, before starting the main loop
    if (typeof(init) === typeof(Function)) init();

    // Start the main game loop
    _mainLoop();
}