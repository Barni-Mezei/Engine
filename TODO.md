The Resource class now loads resources,
but when creating a new Texture it clones the resource node, so it has to load it again.

Potential fix: Load in more, from the same resource, and distribute a new instance everytime a Texture class is created from the cache

Fix2: Textures store canvases with images on them, not actual image elements




When resizing a grid, the defaukt values are NOT cloned, but set, so values may oint to the same object