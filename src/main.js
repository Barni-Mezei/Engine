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

// Create essential HTML elements
buildDebugMenu();
buildLoadingBar();

/**
 * Delta time, fps and ups calculations
 */
let time = {
    scale: 1,

    fps: { // Frames per second
        value: 60,
        delta: 0,

        samples: 0,

        buffer: [],
        bufferSize: 4,

        elapsed: 0,
        lastMeasured: 0,
        lastMeasuredDelta: 0,
    },

    ups: { // Updates per second
        value: 120,
        delta: 0,

        samples: 0,

        buffer: [],
        bufferSize: 1,

        elapsed: 0,
        lastMeasured: 0,
        lastMeasuredDelta: 0,
    },
}

/**
 * Main game settings
 */
let settings = {
    maxNotificationCount: 5,
    enableAudio: true,

    debug: {
        fpsUpdateInterval: 1000, // Milliseconds between fps updates. (Larger intervals are more precise)
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

/**
 * Whenever the document is loaded already
 */
let _bodyLoaded = false;

function _updateTime(timeUnit) {
    // Calculate current fps or ups
    let currentValue = makeFinite(time[timeUnit].samples * (1000 / settings.debug.fpsUpdateInterval));

    // Add to rolling buffer
    time[timeUnit].buffer.push(currentValue);
    if (time[timeUnit].buffer.length > time[timeUnit].bufferSize) {
        time[timeUnit].buffer.shift();
    }

    // Calculate average fps
    time[timeUnit].value = Math.round(time[timeUnit].buffer.reduce((a, b) => (a + b)) / time[timeUnit].buffer.length);

    time[timeUnit].lastMeasured = time[timeUnit].elapsed;
    time[timeUnit].samples = 0;
}

async function _updateLoop() {
    time.ups.samples++;
    time.ups.elapsed = performance.now();
    time.ups.delta = time.ups.elapsed - time.ups.lastMeasuredDelta;

    Resource.update();

    // Call user defined update function
    if (typeof(update) === typeof(Function)) await update(time.ups.delta);

    // Show / hide debug menu
    if (isKeyJustPressed("debug")) {
        document.getElementById("debug").classList.toggle("hidden");
    }

    updateInputs();

    time.ups.lastMeasuredDelta = time.ups.elapsed;

    // Update fps counter (literally, count the frames in a fixed time interval)
    if (time.ups.elapsed - time.ups.lastMeasured >= settings.debug.fpsUpdateInterval) {
        _updateTime("ups");
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

    //setTimeout(_updateLoop, 10);
    setTimeout(() => {_updateLoop()}, 1);
    /*requestAnimationFrame((currentTime) => {
        _updateLoop(currentTime);
    });*/
}

async function _renderLoop(currentTime) {
    frameCounter++;
    time.fps.samples++;
    time.fps.elapsed = Math.floor(currentTime);
    time.fps.delta = time.fps.elapsed - time.fps.lastMeasuredDelta;

    document.getElementById("text").textContent = "";

    if (typeof(render) === typeof(Function)) await render(time.fps.delta);

    document.getElementById("fps").textContent = `FPS: ${time.fps.value}\tUPS: ${time.ups.value}\n`;
    //document.getElementById("fps").textContent += `Fd: ${time.fps.delta}\tUd: ${time.ups.delta}`;

    time.fps.lastMeasuredDelta = time.fps.elapsed;

    if (time.fps.elapsed - time.fps.lastMeasured >= settings.debug.fpsUpdateInterval) {
        _updateTime("fps");
    }

    requestAnimationFrame((currentTime) => {
        _renderLoop(currentTime);
    });
}

// Start script when the body is loaded
window.addEventListener("load", function () {
    _bodyLoaded = true;
    _start();
});

async function _loading() {
    // Update loading bar progress
    setLoadingBarProgress((Resource.loaded / Resource.maxLoadables) * 100);

    if (typeof(loading) === typeof(Function)) await loading(Resource.maxLoadables, Resource.loaded);
}

async function _start() {
    if (!_bodyLoaded) return; // document.body is not loaded
    if (Resource.loaded < Resource.maxLoadables) return; // Not all resources are loaded
    if (frameCounter != 0) return; // Main loop is already running

    // Hide loading bar
    document.querySelector("#loading_overlay").classList.add("hidden");

    // Call init function, before starting the main loop
    if (typeof(init) === typeof(Function)) await init();

    // Start the main game loops (render and update)
    _updateLoop();
    _renderLoop();
}