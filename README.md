In this engine, each file has it's dependencies listed at the top of it and in [this]("dependencies.md") file. The core of this engine are the `resourceLoader.js`, `resourceManager.js` and the `inputs.js` files:
- *engine/resourceLoader.js* Allows the loading of resources, both `textures`, `sounds` and json files.
- *engine/resourceManager.js* It provides a lot of useful functions, for interacting with loaded resources. For example: `rendering` the loaded textures, starting and stopping `animations`, playing the loaded sounds, etc.
- *engine/inputs.js* Provides a great interface for the keyboard and mouse, through the `input` object. It can handle, `keypresses`, `single-frame` presses, and `multi-key` pressses, while also being fast and fully configurable.

Other features build on top of these. Because each file has it's own dependencies, ***the include order matters!*** Here is the correct one if you want all of the features:
- *engine/vector.js* Implements a Vector class, capable of doing vector math. (Like `dot product`, `normalisation`, creating `unit vectors`, etc.)
- *engine/pid.js* Implements a simple PID controller. (`current value`, `setpoint` and the control values: `P` `I` `D`)
- *engine/path.js* Allows the use of `Path` objects to be created, and then walked by agents, in the form of the `PathFollow` class. It also has support for junctions, via the `PathConnection`
- *engine/grid.js* Provides lots of functions, for manipulating any 2D arays, like grids. (It adds: `copying`, `cutting`, `merging`, `filtering` operations.)

If you want to have all of functionalities, you can include thye obfuscated version: `engine/engine.min.js`, but if you want to include, onjly specific features, you can also do that, but pay attention to the dependency tree!