/**
 * Dependencies: vector
 */

/**
 * Settings:
 * notificationContainer
 */

function canvasFillScreen() {
    c.width = c.offsetWidth;
    c.height = c.offsetHeight;

    c.size = new Vector(c.width, c.height);
    c.center = c.size.mult(0.5);
}

/**
 * Pushes a notification, waits [delay] seconds, then removes it.
 * @param {String} message The message to be displayed
 * @param {Number} delay The notification's screen time in SECONDS
 * @param {String} class The class of the notification
 */
function pushNotification(message, delay = 1 + message.length * 0.08, type = "normal") {
    let container = document.getElementById("notContainer");

    // No notification container found
    if (container == null) {
        container = document.createElement("div");
        container.id = "notContainer";
        document.body.appendChild(container);
    }

    if (container.children.length >= settings.maxNotificationCount) {
        let childIndex = 0;
        container.children[childIndex].remove();
    }

    let newNot = document.createElement("div");
    newNot.classList.add("notification");
    newNot.classList.add(type);
    newNot.onanimationend = function (e) {
        if (e.animationName == "pop-in") {
            e.target.style.animationName = "pop-out";
            e.target.style.animationDelay = delay + "s";
        }

        if (e.animationName == "pop-out") {
            e.target.remove();
        }
    }

    let newP = document.createElement("p");
    newP.textContent = message;

    newNot.appendChild(newP);
    container.appendChild(newNot);
}

/**
 * Sets the class of an element based on a boolean value
 * @param {HTMLElement} element The element whose class will be toggled
 * @param {String} calssName The class name
 * @param {Boolean} state The state of the class
 */
function setClass(element, calssName, state) {
    if (!element) return;
    if (element.classList.contains(calssName) != state) element.classList.toggle(calssName);
}

function buildDebugMenu() {
    let container = document.getElementById("debug");

    // No debug container found
    if (container != null) return;

    container = document.createElement("div");
    container.id = "debug";
    container.innerHTML = `<pre id="fps">FPS: ---</pre><pre id="text"></pre>`;
    document.body.appendChild(container);
}

/**
 * Creates a new debug option inside the debug container
 * @param {String} id The ID fo the setting to be created, and the ID of the element
 * @param {String} title The title to display in the debug menu
 * @param {String} type The input type can be: "bool" "range" "number" "text" "list"
 * @param {*} defaultValue The defualt value
 * @param {*} value Values for range: {min: 0, max: 5, step: 1}, for list: {key: "title"}
 */
function addDebugOption(id, title, type, defaultValue, value) {
    let container = document.getElementById("debug");

    let newOptionContainer = document.createElement("div");
    newOptionContainer.classList.add("item");
    newOptionContainer.innerHTML = `<label>${title}</label>`;

    switch (type) {
        case "bool":
            newOptionContainer.innerHTML += `<input id="${id}" type="checkbox"${defaultValue ? " checked" : ""}>`;
            break;

        case "range":
            newOptionContainer.innerHTML += `<input id="${id}" type="range" value="${defaultValue}" min="${value?.min}" max="${value?.max}" step="${value?.step}">`;
            break;
        
        case "number":
            newOptionContainer.innerHTML += `<input id="${id}" type="number" value="${defaultValue}">`;
            break;
        
        case "text":
            newOptionContainer.innerHTML += `<input id="${id}" type="text">`;
            break;

        case "list":
            let selectElement = `<select id="${id}">`;
            for (let key in value) {
                console.log(key, newOptionContainer.innerHTML);
                selectElement += `<option value="${key}"${defaultValue == key ? " selected" : ""}>${value[key]}</option>`;
            };
            selectElement += `</select>`;
            newOptionContainer.innerHTML += selectElement;
            break;
    }

    container.appendChild(newOptionContainer);
    
    settings.debug[id] = defaultValue;
}