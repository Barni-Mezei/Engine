/**
 * Dependencies: objects, math
 */

/*
Textures: {
    "name": {
        image: <img>
        cropData: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        }
            
        animData: {
            length: 15 frames
            currentFrame: 0
            frameLength: 0.5 seconds
            wrap: 15 how many cells in a row, before wrapping to the next row (0 to disable)
            mode: "loop", "pingpong", "stop", "reset"
            playing: true, is the texture animating
            direction: 1, the direction of the next frame (-1 to play in reverse)
            callback: null, A function to be called at the end, has 1 parameter: the name of the animation
        }

        mapData: {
            width: 1, number of tiles on the X axis
            height: 1, number of tiles on the Y axis
            tileWidth: 16, width of a tile in pixels
            tileHeight: 16, height of a tile in pixels
            bitmapName: <name>_bitmap
            tiles: [
                {
                    connections: "0011",
                    cropX: 0,
                    cropY: 0,
                }
            ]
        }
    }
}

Animation modes:
- loop: after the last frame, it resets to the first
- stop: stops animation, freezes on the LAST frame
- reset: stops animation freezes on the FIRST frame
- pingpong: after the last frame it starts playing backwards

Sounds: {
    "name": {
        sound: <sound>, the playable resource
        playData: {
            track: null, the audio track
            gain: null, the gain node in between
            duration: 2s, in seconds
            volume: 100, a value between 0 and 100
            loopCount: 0, number of max loops
            currentLoop: 0, the current loop index
        }
    }
}
*/


//const _parallelCache = {};
const _audioCtx = new AudioContext();

class Resource {
    static maxLoadables = 0;
    static loaded = 0;
    
    static textures = {};
    static sounds = {};
    static files = {};

    static _parallelCache = {};
    static _globalResourceId = 0;

    /**
     * Generates a unique id from the id of the current resource
     * @param {String} resourceId The id of a resource
     * @returns {String} A unique id
     */
    static generateResourceUID(resourceId) {
        Resource._globalResourceId += 1;

        return resourceId + "_" + Resource._globalResourceId + String(Math.random()).substring(2).substring(0, 8);
    }

    /**
     * Schedules a texture for loading, with a unique name
     * @param {String} path The path to the image
     * @param {String} name The name of the resource (MUST BE UNIQUE!)
     * @param {Array} cropData x,y, width,height
     * @param {Array} animData number of frames, frame length (in seconds), mode?, wrap? (0 for disabling), direction?
     */
    static loadTexture(path, name, cropData, animData) {
        Resource.maxLoadables++;

        // Creating new image
        let newImage = document.createElement("img");
        newImage.src = path;

        Resource.textures[name] = {
            image: newImage,
        }

        if (cropData != undefined) {
            Resource.textures[name].cropData = {
                x: cropData[0],
                y: cropData[1],
                width: cropData[2],
                height: cropData[3],
            }
        }

        if (animData != undefined) {
            Resource.textures[name].animData = {
                length: animData[0], // number of frames
                frameLength: animData[1], // Frame duration
                mode: animData[2] ?? "loop", // mode (default to: "loop")
                wrap: animData[3] ?? 0, // wrap (default to: 0)
                direction: animData[4] ?? 1,
                currentFrame: 0,
                lastUpdate: 0,
                playing: true,
                callback: null,
            }

            // Adjust starting frame if reversed
            if (Resource.textures[name].animData.direction < 0) Resource.textures[name].animData.currentFrame = Resource.textures[name].animData.length - 1;
        }
    }

    /**
     * The tilemap uses side and corner mathcing, default tile is the first one
     * @param {String} texture_path The path to the image
     * @param {String} bitmap_path The path to the bitmap image (1 tile = 3*3px, middle is ignored)
     * @param {String} name The name of the resource (MUST BE UNIQUE!)
     * @param {Array} mapData width, height, tile width, tile height
     */
    static loadTileMap(texture_path, bitmap_path, name, mapData = [1,1, 16,16]) {
        console.log("Settings:", settings);
        let bitmapName = `${name}_bitmap`;

        Resource.loadTexture(bitmap_path, bitmapName);
        Resource.loadTexture(texture_path, name);

        Resource.textures[name].mapData = {
            width: mapData[0],
            height: mapData[1],
            tileWidth: mapData[2],
            tileHeight: mapData[3],
            bitmapName: bitmapName,
            tiles: [],
        }
    }

    /**
     * Schedules a sound for loading, with a unique name
     * @param {String} path The path to the audio file
     * @param {String} name The name of the resource (MUST BE UNIQUE!)
     * @param {Array} playData volume(0-100)?, loop count?
     */
    static loadSound(path, name, playData) {
        Resource.maxLoadables++;

        let newAudio = new Audio();
        newAudio.src = path;

        Resource.sounds[name] = {
            audio: new Audio(path),
        }

        Resource.sounds[name].playData = {
            duration: null,
            loopCount: 0,
            volume: 100,
            currentLoop: 0,
            track: _audioCtx.createMediaElementSource(Resource.sounds[name].audio),
            gain: _audioCtx.createGain(),
        }

        // Connect nodes: track -> gain -> OUT
        Resource.sounds[name].playData.track.connect(Resource.sounds[name].playData.gain).connect(_audioCtx.destination);

        // Set values from input
        if (playData != undefined) {
            Resource.sounds[name].playData = {
                volume: playData[0] ?? 100,
                loopCount: playData[1] ?? 0,
            }
        }
    }

    /**
     * Schedules a file for loading
     * @param {String} path The path to the file
     * @param {String} name The name of the resource (MUST BE UNIQUE!)
     */
    static loadFile(path, name) {
        Resource.maxLoadables++;

        Resource.files[name] = {
            data: null,
            metaData: {
                path: path,
            },
        };
    }

    /**
     * Searches the loaded resources, and returns with the requested one
     * @param {String} textureId A unique resource ID
     * @returns {Texture} The resource with the specified ID
     */
    static getTexture(textureId) {
        if (!(textureId in Resource.textures)) throw Error(`(${textureId}) Texture not found!`);

        return Resource.textures[textureId];
    }

    /**
     * Searches the loaded resources, and returns with the requested one
     * @param {String} soundId A unique resource ID
     * @returns {Sound} The resource with the specified ID
     */
    static getSound(soundId) {
        if (!(soundId in Resource.sounds)) throw Error(`(${soundId}) Sound not found!`);

        return Resource.sounds[soundId];
    }

    /**
     * Searches the loaded resources, and returns with the requested one
     * @param {String} fileId A unique resource ID
     * @returns {FileResource} The resource with the specified ID
     */
    static getFile(fileId) {
        if (!(fileId in Resource.files)) throw Error(`(${fileId}) File not found!`);

        return Resource.files[fileId];
    }

    /**
     * Searches the instantiated resources, and returns with the requested one
     * @param {String} fileId A unique resource ID
     * @returns {Texture|Sound|FileResource} The resource with the specified ID
     */
    static getResourceInstance(resourceId) {
        if (!(resourceId in Resource._parallelCache)) throw Error(`(${fileId}) Resource not found!`);

        return Resource._parallelCache[resourceId];
    }

    static onTextureLoad(name) {
        Resource.loaded++;

        //Log the texture is loaded
        console.log(`Texture: %c${name}%c is loaded, total: ${Resource.loaded} / ${Resource.maxLoadables}`,
        "font-weight: bold; color: #0df", "font-weight: normal");

        if (Resource.loaded >= Resource.maxLoadables) Resource._loadingDone();
    }

    static onSoundLoad(name) {
        Resource.loaded++;

        //Log the sound is loaded
        console.log(`Sound: %c${name}%c is loaded, total: ${Resource.loaded} / ${Resource.maxLoadables}`,
        "font-weight: bold; color: #f0d", "font-weight: normal");

        if (Resource.loaded >= Resource.maxLoadables) Resource._loadingDone();
    }
    
    static async onFileLoad(name, blob) {
        Resource.files[name].blob = blob;
        Resource.files[name].metaData.size = blob.size;
        Resource.files[name].metaData.type = blob.type;

        Resource.loaded++;

        //Log the sound is loaded
        console.log(`File: %c${name}%c is loaded, total: ${Resource.loaded} / ${Resource.maxLoadables}`,
        "font-weight: bold; color: #fd0", "font-weight: normal");

        if (Resource.loaded >= Resource.maxLoadables) Resource._loadingDone();
    }

    static _loadingDone() {
        console.groupEnd();
        console.log(`%cAll resources loaded, starting the main loop!`, "font-weight: bold; color: #fff;");

        //Enable playing sounds
        if (_audioCtx.state === "suspended") _audioCtx.resume();

        _start();
    }

    /**
     * Starts loading queued textures, then starts the main loop
     */
    static startLoading() {
        console.groupCollapsed(`Loading %c${Resource.maxLoadables}%c resources... (%c${Object.keys(Resource.textures).length}%c ${Object.keys(Resource.sounds).length}%c ${Object.keys(Resource.files).length}%c)`,
        "font-weight: bold; color: #fff;", "", "color: #0df", "color: #f0d", "color: #fd0", "");

        for (let name in Resource.files) {
            fetch(Resource.files[name].metaData.path)
                .then((response) => response.blob())
                .then((blob) => Resource.onFileLoad(name, blob));
        }

        for (let name in Resource.textures) {
            Resource.textures[name].image.onload = Resource.onTextureLoad(name);
        }
        
        for (let name in Resource.sounds) {
            Resource.sounds[name].audio.onload = Resource.onSoundLoad(name);
        }
    }

    /**
     * Removes finished sounds from the parallel cache
     */
    static _cleanUpParallelCache() {
        let i = 0;

        for (i = 0; i < Object.keys(Resource._parallelCache).length; i++) {
            let resourceId = Object.keys(Resource._parallelCache)[i];
            let resource = Resource._parallelCache[resourceId];

            // Remove finished sounds (only if instances)
            if (resource instanceof Sound && resourceId.includes("i")) {
                if (resource.audio.currentTime == resource.audio.duration) {
                    resource.destroy();
                    //delete Resource._parallelCache[name];
                    delete Resource._parallelCache[resourceId];
                    i--;
                }
                continue;

                // Detect broken time (floating point precision drops)
                let stringTime = resource.audio.currentTime + "";
                let stringArr = stringTime.split(".");

                // Time is not broken, continue
                if (stringArr.length < 2) continue;

                let precision = stringArr[1].length;

                // Time is broken, delete audio
                if (precision < 4) {
                    resource.destroy();
                    delete Resource._parallelCache[resourceId];
                    i--;
                    continue;
                }
            }
        }
    }

    /**
     * Removes all resource instances, leaving only the loaded ones
     */
    static eraseParallelCache() {
        for (let name in Resource._parallelCache) {
            let resource = Resource._parallelCache[name];

            resource.destroy();
            delete Resource._parallelCache[name];
        }
    }

    /**
     * Updates all texture animations and sound properties
     */
    static update() {
        Resource._cleanUpParallelCache();

        for (let name in Resource._parallelCache) {
            Resource._parallelCache[name].update();
        }
    }
}

class Texture extends BaseResource {
    image;

    flipV = false;
    flipH = false;

    cropData = {};
    animData = {};

    #_onAnimationEnd = null;

    get isAnimated() {
        return this.animData && this.animData instanceof Object && Object.keys(this.animData).length != 0;
    }

    get isCropped() {
        return this.cropData && this.cropData instanceof Object && Object.keys(this.cropData).length != 0;
    }

    /**
     * Attaches a function to the "animation finished" event of the texture
     * @param {Function} callback The function wihich gets called, after the last frame, but before looping. Parameters: This texture
     */
    set onAnimationEnd(callback) {
        if (typeof callback != "function") throw Error(`<callback> Must be a callable!`);
        this.#_onAnimationEnd = callback;
    }

    /*
     * Returns with the attached callback function or NULL if none was set
     */
    get onAnimationEnd() {
        return this.#_onAnimationEnd ?? null;
    }

    /**
     * @param {String} resourceId The ID of a loaded resource (texture)
     * @param {null|Object} continer The continer to put this texture into. The continer must be a dictionary.
     * The default value is the `Resource._parallelCache`, so it will be updated in every tick. If set to NULL, it will not be inserted into any container  
     */
    constructor(resourceId, continer = Resource._parallelCache) {
        let textureData = Resource.getTexture(resourceId);
        if ("mapData" in textureData) throw Error(`(${resourceId}) Texture is a tilemap!`);
        if (!("image" in textureData)) throw Error(`(${resourceId}) Texture is missing the image data!`);

        super(resourceId);

        this.image = Texture.canvasFromImage(textureData.image, this.cropData);

        if ("cropData" in textureData) this.cropData = structuredClone(textureData.cropData);
        if ("animData" in textureData) this.animData = structuredClone(textureData.animData);

        if (continer != null) continer[this.uid] = this;
    }

    /* TODO: When cropping, this is not sonsidering the animation, which creates a differently sized area to crop.
    (with wrapping it is more complex) Solutions: do not crop if anmimated OR crop out the whole animation region OR store each frame as a separate image */

    static canvasFromImage(image, cropData = null) {
        let imageWidth = cropData?.width ?? image.width;
        let imageHeight = cropData?.height ?? image.height;

        let imageOffsetX = cropData?.x ?? 0;
        let imageOffsetY = cropData?.y ?? 0;

        let offCanvas = new OffscreenCanvas(imageWidth, imageHeight);
        let offCtx = offCanvas.getContext("2d");

        offCtx.drawImage(
            image,
            imageOffsetX, imageOffsetY, imageWidth, imageHeight,
            0, 0, imageHeight, imageHeight
        );

        return offCanvas;
    }

    /**
     * Returns with the length odf the texture's animation in milliseconds
     * @param {Boolean} inSeconds Whenever to convert the length to seconds, instead of milliseconds
     * @returns The lkength of the animation in milliseconds, or in seconds
     */
    getAnimationLength(inSeconds = false) {
        if (!this.isAnimated) return null;

        if (inSeconds) {
            return this.animData.frameLength * this.animData.length;
        } else {
            return this.animData.frameLength * this.animData.length * 1000;
        }
    }

    /**
     * Temporarily stops the animation
     */
    pause() {
        if (!this.isAnimated) return;

        this.animData.playing = false;
    }

    /*
     * Continues playing the animation, from where it was paused at
    */
    resume() {
        if (!this.isAnimated) return;

        this.animData.playing = true;
    }

    /**
     * Starts playing the animation from the beginning
     */
    restart() {
        if (!this.isAnimated) return;

        this.animData.currentFrame = this.animData.direction > 0 ? 0 : this.animData.length - 1;
        this.animData.lastUpdate = 0;
        this.animData.playing = true;
    }

    /**
     * Renders the texture, at the given coordinates, with scaling and rotating options.
     * Uses SCREEN space coordinates
     * @param {Number} x Screen X
     * @param {Number} y Screen Y
     * @param {Number} width Width of the texture
     * @param {Number} height Height of the texture
     * @param {Number} rotation Angle of rotatin in DEGREES
     * @param {Number} margin Inset from width and height
     */
    render(x, y, width, height, rotation = 0, margin = 0) {
        if (this.isAnimated && this.isCropped) {
            // Draw cropped image, shifted by the animation frames

            let cropData = structuredClone(this.cropData);

            // Apply frame wrapping, only if enabled
            if (this.animData.wrap == 0) {
                cropData.x += this.animData.currentFrame * cropData.width;
            } else {
                cropData.x += (this.animData.currentFrame % this.animData.wrap) * cropData.width;
                cropData.y += Math.floor(this.animData.currentFrame / this.animData.wrap) * cropData.height;
            }

            this.#drawImageRotated(x,y, [cropData.x,cropData.y, cropData.width,cropData.height], width,height, rotation, margin);
        } else if (this.isCropped) {
            // Draw cropped image
            this.#drawImageRotated(x,y, [this.cropData.x,this.cropData.y, this.cropData.width,this.cropData.height], width,height, rotation, margin);
        } else {
            // Draw image normally
            this.#drawImageRotated(x,y, [], width,height, rotation, margin);
        }
    }


    /**
     * Draws the image on to the canvas, with the specified properties
     * @param {Object} image A drawable image object
     * @param {Array} cropData x, y, width, height (null for no cropping)
     * @param {Number} x Screen X
     * @param {Number} y Screen Y
     * @param {Number} width Width of the image
     * @param {Number} height Height of the image
     * @param {Number} rotation Rotation of the image in DEGREES
     * @param {Number} margin Inset of the image
     */
    #drawImageRotated(x, y, cropData = [], width, height, rotation = 0, margin = 0) {
        // Cropping parameters
        let imageCropData = cropData;

        // Defaults
        if (cropData.length == 0) {
            imageCropData = [
                0, // Crop x
                0, // Crop y
                this.image.width, // Crop width
                this.image.height, // Crop height
            ];
        }

        // Only X and Y
        if (cropData.length == 2) {
            imageCropData = [
                cropData[0], // Crop x
                cropData[1], // Crop y
                this.image.width, // Crop width
                this.image.height, // Crop height
            ]
        }

        let imageWidth = width ?? imageCropData[2];
        let imageHeight = height ?? imageCropData[3];

        // Rendering parameters
        let imageRenderData = [
            -imageWidth/2 + margin/2, // x
            -imageHeight/2 + margin/2, // y
            imageWidth - margin, // width
            imageHeight - margin, // height
        ];

        if (this.flipV) {
            imageRenderData[0] += imageRenderData[2];
            imageRenderData[2] *= -1;
        }

        ctx.save();
        
        //Apply rotation
        ctx.setTransform(1, 0, 0, 1, x, y);
        ctx.rotate(rotation * (Math.PI / 180));
        ctx.translate(imageWidth / 2, imageHeight / 2);

        //Draw cropped image
        ctx.imageSmoothingEnabled = !c.isPixelPerfect;
        ctx.drawImage(this.image, ...imageCropData, ...imageRenderData);

        ctx.restore();
    }

    update() {
        if (!this.isAnimated) return;
        if (!this.animData.playing) return;

        let frameInMillis = this.animData.frameLength * 1000;
        let lastUpdateTime = time.elapsed - this.animData.lastUpdate;
        
        if (lastUpdateTime < frameInMillis) return;
        
        this.animData.lastUpdate = time.elapsed;
        this.animData.currentFrame += this.animData.direction;

        // Loop back on end (if mode allows it)
        if (this.animData.direction > 0) {
            // Playing forwards
            if (this.animData.currentFrame >= this.animData.length) {// Animation ended
                if (this.animData.mode == "loop") this.animData.currentFrame = 0;

                if (this.animData.mode == "stop") this.animData.currentFrame = this.animData.length - 1;
                if (this.animData.mode == "reset") this.animData.currentFrame = 0;
                if (["stop", "reset"].includes(this.animData.mode)) this.animData.playing = false;

                if (this.animData.mode == "pingpong") {
                    this.animData.currentFrame = this.animData.length - 2;
                    this.animData.direction *= -1;
                }

                if (this.#_onAnimationEnd != null) this.#_onAnimationEnd(this);
            }
        } else {
            // Playing  backwards
            if (this.animData.currentFrame < 0) { // Animation ended
                if (this.animData.mode == "loop") this.animData.currentFrame = this.animData.length - 1;

                if (this.animData.mode == "stop") this.animData.currentFrame = 0;
                if (this.animData.mode == "reset") this.animData.currentFrame = this.animData.length - 1;
                if (["stop", "reset"].includes(this.animData.mode)) this.animData.playing = false;

                if (this.animData.mode == "pingpong") {
                    this.animData.currentFrame = 1;
                    this.animData.direction *= -1;
                }

                if (this.#_onAnimationEnd != null) this.#_onAnimationEnd(this);
            }
        }
    }

    destroy() {
        this.disabled = true;
    }
}

class Sound extends BaseResource {
    audio;

    playData = {}
    effectData = {}

    #onSoundEnd = null;
    #container;

    get isPlayable() {
        return this.playData != {};
    }

    /**
     * The volume of the sound.
     * @param {Number} value A value between 0 and 100. Greater values amlify the sound.
     */
    set volume(value) {
        this.playData.volume = value;
        this.update();
    }

    get volume() {
        return this.playData.volume;
    }

    /**
     * @param {String} resourceId The ID of a loaded resource (sound)
     * @param {Boolean} isInstance Is this sound a temporary instance of a main sound?
     * @param {null|Object} continer The continer to put this sound into. The continer must be a dictionary.
     * The default value is the `Resource._parallelCache`, so it will be updated in every tick. If set to NULL, it will not be inserted into any container  
     */
    constructor(resourceId, isInstance = false, continer = Resource._parallelCache) {
        if (!settings.enableAudio) return false;

        let soundData = Resource.getSound(resourceId);
        if (!("audio" in soundData)) throw Error(`(${resourceId}) Sound is missing the audio data!`);

        super(isInstance ? resourceId + "_i" : resourceId);

        this.audio = soundData.audio.cloneNode(true);

        if ("playData" in soundData) {
            this.playData = {
                duration: soundData.playData.duration,
                loopCount: soundData.playData.loopCount,
                volume: soundData.playData.volume,
                currentLoop: soundData.playData.currentLoop,
            };

            this.effectData.track = _audioCtx.createMediaElementSource(this.audio);
            this.effectData.gain = _audioCtx.createGain();
            this.effectData.track.connect(this.effectData.gain).connect(_audioCtx.destination);
            this.effectData.gain.gain.value = clamp( (this.playData.volume ?? 1) / 100, 0, Infinity);
        }

        this.audio.play();

        this.#container = continer;
        if (continer != null) continer[this.uid] = this;
    }

    /**
     * Temporarily stops the sound from playing
     */
    pause() {
        this.audio.pause();
    }

    /*
     * Continues playing the sound, from where it was paused at
    */
    resume() {
        this.audio.play();
    }

    /**
     * Starts playing the sound from the beginning
     * @param {Boolean} interrupt Whenever, to interrupt, and restart the sound, or start a new sound, simultaneously with this one.
     * The new sound will be create in the same container as the original sound
     * @returns {Sound|null} The new sound if not in interrupt mode, or NULL if is in interrupt mode
     */
    restart(interrupt = false) {
        if (interrupt) {
            this.audio.stop();
            this.audio.currentTime = 0;
            this.audio.play();

            return null;
        } else {
            let newSound = new Sound(this.resourceId, true, this.#container);

            return newSound;
        }
    }

    update() {
        this.playData.duration = this.audio.duration;
        this.effectData.gain.gain.value = Math.max(0, (this.playData.volume ?? 1) / 100);
    }

    destroy() {
        this.audio.pause();

        this.disabled = true;
    }
}

class FileResource {
    /**
     * Returns the plain text from a previously loaded file
     * @param {String} fileId The ID of a loaded resource
     * @returns {Promise} Returns a promise. Use like this: `await File.getText()`
     */
    static getText(fileId) {
        let fileData = Resource.getFile(fileId);

        return fileData.blob.text();
    }

    /**
     * Returns the parsed JSON data of a previously loaded file
     * @param {String} fileId The ID of a loaded resource
     * @returns {Promise} Returns a promise. Use like this: `await File.getJson()`
     */
    static async getJson(fileId) {
        let fileData = Resource.getFile(fileId);
        
        try {
            return JSON.parse(await fileData.blob.text());
        } catch (e) {
            throw Error(`(${fileId}) File does not contain valid JSON data!\n[${e}]`);
        }
    }
    
    /**
     * Returns the size (in bytes) of a previously loaded file
     * @param {String} fileId The ID of a loaded resource
     * @returns {Number} The size in bytes
    */
    static getSize(fileId) {
        let fileData = Resource.getFile(fileId);

        return fileData.metaData.size;
    }

    /**
     * Returns the MIME type of a previously loaded file
     * @param {String} fileId The ID of a loaded resource
     * @returns {String} The MIME type of the file
    */
    static getType(fileId) {
        let fileData = Resource.getFile(fileId);

        return fileData.metaData.type;
    }
}