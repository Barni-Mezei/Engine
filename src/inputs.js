/**
 * Dependencies: camera
 * 
 * Variables:
 * let input = {mouse : {}, keys : {}}
 */


/*
Key identifier string format:

Each key is represented by the event.key property's value. Spaces are ingored.
Special characters are "," and "+" these represend OR and AND connection between keys.
If you want to make a bind for those characters, you can escape them with a backslash (\)
ESCAPING:
If you type:
addKeybind("addition", "\+")
the function will receive only "+". To counter this you can type:
addKeybind("addition", "\+") so the function will receive "\+"
OR
addKeybind("addition", String.raw`\+`) (note the backticks)
so the function will receive the exact same text as you type in: "\+"

Examples:
Copy: "Control+c" (Control key plus the c key must be pressed)
Interaction in a game: "e, \\ " (Space bar OR the e key must be pressed)
Searching: "Control+f, F3" (And connections are evaluated first)

*/

let input = {
    mouse: {
        x: 0,
        y: 0,

        prevX: 0,
        prevY: 0,

        motionX: 0,
        motionY: 0,

        down: false,
        oldDown: false,

        right: false,
        oldRight: false,

        middle: false,
        oldMiddle: false,
    },

    keys: {
        justPressed: [],
        pressed: [],
    },

    sensor: {
        acceleration: {
            x: 0,
            y: 0,
            z: 0,
        },
    },

    /**
     *\, means OR (separator)
     *\+ means AND
     */
    controls: {
        debug: "F2", // Show debug menu
    },
}

window.onkeydown = function (e) {
    if (!input.keys.pressed.includes(e.key)) {
        input.keys.pressed.unshift(e.key);
    }

    if (!e.repeat) input.keys.justPressed.unshift(e.key);
}

window.onkeyup = function (e) {
    //e.preventDefault();
    
    input.keys.pressed = input.keys.pressed.filter( a => a != e.key && a != e.key.toLowerCase() && a != e.key.toUpperCase());
}

window.onmousedown = function (e) {
    if (document.getElementById("debug")?.contains(e.target)) return;

    _updateMousePosition(e);
    if (e.button == 0) input.mouse.down = true;
    if (e.button == 1) input.mouse.middle = true;
    if (e.button == 2) input.mouse.right = true;
}

window.onmouseup = function (e) {
    _updateMousePosition(e);
    if (e.button == 0) input.mouse.down = false;
    if (e.button == 1) input.mouse.middle = false;
    if (e.button == 2) input.mouse.right = false;
}

window.onmousemove = function (e) {
    _updateMousePosition(e);
}

window.onwheel = function (e) {
    _updateMousePosition(e);

    camera.targetZoom = clamp(camera.targetZoom - Math.sign(e.deltaY)*0.05, settings.camera.minZoom, settings.camera.maxZoom);
}

window.onblur = _inputLost;
window.onfocus = _inputLost;
window.onmouseleave = _inputLost;

function _inputLost() {
    input.mouse.x = 0;
    input.mouse.y = 0;
    input.mouse.down = false;
    input.mouse.right = false;

    input.keys.pressed = [];
    input.keys.justPressed = [];
}

function _updateMousePosition(e) {
    input.mouse.x = ((e.clientX - c.offsetLeft) / c.offsetWidth) * c.width;
    input.mouse.y = ((e.clientY - c.offsetTop) / c.offsetHeight) * c.height;
}

/**
 * Must be called at the end of mainLoop
 */
function updateInputs() {
    input.keys.justPressed = [];

    input.mouse.motionX =  input.mouse.x - input.mouse.prevX;
    input.mouse.motionY =  input.mouse.y - input.mouse.prevY;

    input.mouse.prevX = input.mouse.x;
    input.mouse.prevY = input.mouse.y;
    
    input.mouse.oldDown = input.mouse.down;
    input.mouse.oldRight = input.mouse.right;
    input.mouse.oldMiddle = input.mouse.middle;
}

function _testKeyId(filterString, array) {
    let parsedString = _parseFilterString(filterString);

    let pressed = false;
    
    parsedString.every(and => {
        pressed = and.every(key => {
            return array.includes(key);
        });

        return !pressed;
    });

    return pressed;
}

/**
 * Returns with an array, representing the conection between the pressed keys
 * @param {String} filterString A filter string (key id) with "," and "+" characters
 * @returns {Array} A 2d array, where the forst dimension is OR and the 2nd dimension is AND, like this: [["Control", "F"], ["F3"]]
 */
function _parseFilterString(filterString) {
    let out = [];

    let isEscape = false;
    let currentKey = "";
    let keys = [];

    for (let i = 0; i < filterString.length; i++) {
        // Add escaped character to the key
        if (isEscape) {
            currentKey += filterString[i];
            isEscape = false;
            continue;
        }

        // Escape next character
        if (filterString[i] == "\\") {
            isEscape = true;
            continue;
        }

        // Discard spaces
        if (filterString[i] == " ") continue;

        // Add key to sub array
        if (filterString[i] == "+") {
            keys.push(currentKey);
            currentKey = "";
            continue;
        };
        
        // Add key to sub array, then to main array
        if (filterString[i] == ",") {
            keys.push(currentKey);
            out.push(keys);
            keys = [];
            currentKey = "";
            continue;
        };

        currentKey += filterString[i];
    }

    if (currentKey != "") {
        keys.push(currentKey);
        out.push(keys);
    }

    return out;
}

/**
 * Registers a new keybind
 * @param {String} bindName The identifier of the keybind (can't contain special characters or spaces)
 * @param {String} boundKeys The key identifier string
 */
function setKeybind(bindName, boundKeys) {
    input.controls[bindName] = boundKeys;
}

/**
 * Removes an already existing keybind
 * @param {String} bindName The identifier of the keybind
 */
function removeKeybind(bindName) {
    if (bindName in input.controls) return;

    delete input.controls[bindName];
}

/**
 * Returns: Is the key currently held down?
 * @param {String} bindName Name of the keybind
 * @returns {Boolean}
 */
function isKeyPressed(bindName) {
    if (!(bindName in input.controls)) {
        console.error(`Unknown keybind '${bindName}'`);
        return false;
    }

    return _testKeyId(input.controls[bindName], input.keys.pressed);
}

/**
 * Returns if the key was just pressed (started in this frame)
 * @param {String} bindName Name of the keybind
 * @returns {Boolean}
 */
function isKeyJustPressed(bindName) {
    if (!(bindName in input.controls)) {
        console.error(`Unknown keybind '${bindName}'`);
        return false;
    }

    return _testKeyId(input.controls[bindName], input.keys.justPressed);
}