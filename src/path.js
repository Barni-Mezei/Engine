/**
 * Dependencies: vector
 */

class Path {
    points = [];
    agents = [];
    finishedAgents = [];

    /**
     * Creates a new path, with the given points.
     * @param {Array} pointList An array of Vectors, as points
     */
    constructor(pointList = []) {
        this.points = pointList;
    }

    /**
     * Retuns with the starting point of this path OR **null**
     * @returns {Vector|null} The starting point OR **null**
     */
    get startPoint() {
        if (this.points.length == 0) return null;
        return this.points[0];
    }

    /**
     * Retuns with the last point of this path OR **null**
     * @returns {Vector|null} The last point OR **null**
     */
    get endPoint() {
        if (this.points.length == 0) return null;
        return this.points[this.points.length - 1];
    }

    /**
     * Assigns the path to the agent and stores the agent into this.agents
     * @param {PathFollow} agent The agent who's path will be set.
     */
    addAgent(agent) {
        if (!(agent instanceof PathFollow)) throw Error("The agent must be an instance of 'PathFollow' !");
        agent.setPath(this);
        this.agents.push(agent);
    }

    /**
     * Inserts a point at the **end of the path**. (After the current end point)
     * @param {Vector} point The point to be inserted. (A coordinate)
     */
    addPointAtEnd(point) {
        if (!(point instanceof Vector)) throw Error("The point must be an instance of 'Vector' !");
        this.points.push(point);
    }

    /**
     * Inserts a point at the **start of the path**. (Before the current starting point)
     * @param {Vector} point The point to be inserted. (A coordinate)
     */
    addPointAtStart(point) {
        if (!(point instanceof Vector)) throw Error("The point must be an instance of 'Vector' !");
        this.points.unshift(point);
    }

    /**
     * Removes the point at the **start of the path**. (Point with index 0)
     */
    removePointFromStart() {
        this.points = this.points.filter((p, index) => index != 0);
    }

    /**
     * Removes the point at the **end of the path**. (Point with index -1)
     */
    removePointFromEnd() {
        this.points = this.points.filter((p, index) => index != this.points.length - 1);
    }

    /**
     * Returns with the point at the given index OR **null**
     * @param {Number} index The point's index OR **null**
     */
    getPoint(index) {
        if (index < 0 || index > this.points.length-1) return null;
        return this.points[index];
    }

    /**
     * Returns whenever the index is in the path's point list
     * @param {Number} pointIndex The index to be tested
     * @returns {Boolean} Is in range?
     */
    isValidPointIndex(pointIndex) {
        return pointIndex > 0 && pointIndex < this.points.length;
    }

    /**
     * Returns if the index is the first point's index
     * @param {Number} pointIndex The index to be tested
     * @returns {Boolean} Is first point's index?
     */
    isFirstPointIndex(pointIndex) {
        return pointIndex == 0;
    }

    /**
     * Returns if the index is the last point's index
     * @param {Number} pointIndex The index to be tested
     * @returns {Boolean} Is last point's index?
     */
    isLastPointIndex(pointIndex) {
        return pointIndex == this.points.length - 1;
    }

    /**
     * Move the agent to this.finishedAgents array
     * @param {PathFollow} agent The agent to be added
     */
    addToFinished(agent) {
        if (!(agent instanceof PathFollow)) throw Error("The agent must be an instance of 'PathFollow' !");

        this.finishedAgents.push(agent);
    }

    /**
     * Removes the agent from this.finishedAgents array
     * @param {PathFollow} agent The agent to be removed
     */
    removeFromFinished(agent) {
        if (!(agent instanceof PathFollow)) throw Error("The agent must be an instance of 'PathFollow' !");

        this.finishedAgents = this.finishedAgents.filter(a => a !== agent);
    }

    /**
     * Checks if the path has any **finished agents**, that are already have been **redirected**, and **removes** them from the `finishedAgents` array.
     */
    clearFinishedAgents() {
        this.finishedAgents = this.finishedAgents.filter(a => a.finished);
    }

    /**
     * Remove the agent from this.agents array
     * @param {PathFollow} agent The agent to be removed
     */
    removeAgent(agent) {
        if (!(agent instanceof PathFollow)) throw Error("The agent must be an instance of 'PathFollow' !");

        this.agents = this.agents.filter(a => a !== agent);
    }


    /**
     * Disconnects the agent from this path (removes from this.agents and nulls the agents reference to this)
     * @param {PathFollow} agent The agent to be disconnected from this path
     */
    disconnectAgent(agent) {
        if (!(agent instanceof PathFollow)) throw Error("The agent must be an instance of 'PathFollow' !");

        agent.path = undefined;
        this.agents = this.agents.filter(a => a !== agent);
    }

    update() {
        // Update all agents
        this.agents.forEach(a => {
            a.update();
        });
    }

    render() {
        //Render points
        this.points.forEach((p, index) => {
            ctx.fillStyle = "#ffff00";
            ctx.beginPath();
            ctx.arc(...camera.w2cXY(p.x, p.y), camera.c2wsX(15), 0, Math.PI * 2);
            ctx.fill();
        });

        //Render path
        ctx.strokeStyle = "#ffff00";
        ctx.lineWidth = camera.c2wsX(10);
        ctx.beginPath();

        this.points.forEach((p, index) => {
            if (index == 0) ctx.moveTo(...camera.w2cXY(p.x, p.y));
            else ctx.lineTo(...camera.w2cXY(p.x, p.y));
        });

        ctx.stroke();
    }
}

class PathConnection {
    inputs = [];
    outputs = [];

    selectedInput = 0;
    selectedOutput = 0;

    inputMode = "all";
    outputMode = "cycle";

    /**
     * @param {String} inputMode
     - Input modes:
     - **all**: Inputs all agents from all inputs (inputs **all finished** agents!)
     - **cycle**: Cycles the inputs in every frame (inputs **all finished** agents!)
     - **cycleSmart**: Only steps to the next input if one input if emptied (inputs **all finished** agents!)
     - **max**: Inputs all of the agents from the input with the most agents in it. (inputs **all finished** agents!)
     - **min**: Inputs all of the agents from the input with the smallest amount of agents in it. (inputs **all finished** agents!)
     - **cycleSingle**: Cycles the inputs in every frame (inputs **only one finished** agent!)
     - **cycleSingleSmart**: Only steps to the next input if one input if emptied (inputs **only one finished** agent!)
     - **maxSingle**: Inputs one of the agents from the input with the most agents in it. (inputs **only one finished** agent!)
     - **minSingle**: Inputs one of the agents from the input with the least agents in it. (inputs **only one finished** agent!)
     - **maxSingleSmart**: Inputs one of the agents from the input with the most agents in it, switches if the input is empty. (inputs **only one finished** agent!)
     - **minSingleSmart**: Inputs one of the agents from the input with the least agents in it, switches if the input is empty. (inputs **only one finished** agent!)
     - **random**: Inputs all the agents from one input (inputs **all finished** agents!) (**Can input from empty path!**)
     - **randomSingle**: Inputs one of the agents from one input (inputs **only one finished** agents!) (**Can input from empty path!**)
     * @param {String} outputMode
     - Output modes:
     - **cycle**: Cycles between the outputs (outputs **all the inputted** agents!)
     - **cycleSingle**: Cycles between the outputs (outputs **only one inputted** agent!)
     - **delete**: Deletes the inputted agents, no matter what!
     - **random**: Distributes the inputted agents (outputs **all the inputted** agents!)
     - **randomSingle**: Distributes the inputted agents (outputs **only one inputted** agent!)
     * @param {Array} inputPaths An array of 'Path' objects
     * @param {Array} outputPaths An array of 'Path' objects
     */
    constructor(inputMode = "all", outputMode = "cycle", inputPaths = [], outputPaths = []) {
        this.inputMode = inputMode;
        this.outputMode = outputMode;
        this.inputs = inputPaths;
        this.outputs = outputPaths;
    }

    /**
     * Returns with a list of **all of the agents** in all of the input's `finishedAgents` arrays.
     */
    get inputBuffer() {
        let inputAgents = [];

        this.inputs.forEach(input => {
            inputAgents = inputAgents.concat( input.finishedAgents );
        });

        return inputAgents;
    }

    /**
     * Adds the path to this connection's inputs
     * @param {Path} inputPath The path to be added **(Must be a `Path` instance!)**
     */
    addInputPath(inputPath) {
        if (!(inputPath instanceof Path)) throw Error("The input must be an instance of 'Path' !");
        this.inputs.push(inputPath);
    }

    /**
     * Adds the path to this connection's outputs
     * @param {Path} inputPath The path to be added **(Must be a `Path` instance!)**
     */
    addOutputPath(outputPath) {
        if (!(outputPath instanceof Path)) throw Error("The output must be an instance of 'Path' !");
        this.outputs.push(outputPath);
    }

    /**
     * Removes the path from this connection's inputs
     * @param {Path} inputPath The path to be removed **(Must be a `Path` instance!)**
     */
    removeInputPath(inputPath) {
        this.inputs = this.inputs.filter(p => p != inputPath);

        if (this.selectedInput > this.inputs.length - 1) this.selectedInput = this.inputs.length - 1;
    }

    /**
     * Removes the path from this connection's outputs
     * @param {Path} inputPath The path to be removed **(Must be a `Path` instance!)**
     */
    removeOutputPath(inputPath) {
        this.outputs = this.outputs.filter(p => p != inputPath);
        if (this.selectedOutput > this.outputs.length - 1) this.selectedOutput = this.outputs.length - 1;
    }

    /**
     * Selectes the given path as an input
     * @param {Path} path The path to be selected **(Must be a `Path` instance!)**
     * @returns {Boolean} Was the operation succesful?
     */
    selectInput(path) {
        if (!(path instanceof Path)) throw Error("The path must be an instance of 'Path' !");

        let inputSelectedIndex = this.inputs.indexOf(path);

        if (inputSelectedIndex < 0 || inputSelectedIndex > this.inputs.length - 1) return false;
        this.selectedInput = inputSelectedIndex;

        return true;
    }

    /**
     * Sets the selected input by index.
     * @param {Number} index The input's index
     * @returns {Boolean} Was the operation succesful?
     */
    selectInputByIndex(index) {
        if (index < 0 || index > this.inputs.length - 1) return false;
        this.selectedInput = index;
        return true;
    }

    /**
    * Selects the given path as the current output
    * @param {Path} path The path to be selected **(Must be a `Path` instance!)**
    * @returns {Boolean} Was the operation succesful?
    */
    selectOutput(path) {
        if (!(path instanceof Path)) throw Error("The path must be an instance of 'Path' !");

        let outputSelectedIndex = this.outputs.indexOf(path);

        if (outputSelectedIndex < 0 || outputSelectedIndex > this.outputs.length - 1) return false;
        this.selectedOutput = outputSelectedIndex;

        return true;
    }

    /**
     * Sets the selected output by index
     * @param {Number} index The output's index
     * @returns {Boolean} Was the operation succesful?
     */
    selectInputByIndex(index) {
        if (index < 0 || index > this.outputs.length - 1) return false;
        this.selectedOutput = index;
        return true;
    }

    #cycleInput() {
        this.selectedInput = (this.selectedInput+1) % this.inputs.length;
    }

    #cycleOutput() {
        this.selectedOutput = (this.selectedOutput+1) % this.outputs.length;
    }

    /**
     * Selects all agents from `finishedAgents` of the input paths, using a rule determined by the `inputMode` and places them to the output paths `startPoint` using a rule determined by the `outputMode`
     * @returns {void}
     */
    update() {
        if (this.inputs.length == 0) return;

        //Gather all input agents
        let inputAgents = [];

        if (this.inputMode == "all") {
            this.inputs.forEach(input => {
                inputAgents = inputAgents.concat( input.finishedAgents );
            });
        }

        if (this.inputMode == "cycle") {
            inputAgents = inputAgents.concat( this.inputs[this.selectedInput].finishedAgents );

            this.#cycleInput();
        }

        if (this.inputMode == "cycleSingle") {
            inputAgents = inputAgents.concat( this.inputs[this.selectedInput].finishedAgents[0] ?? [] );

            this.#cycleInput();
        }

        if (this.inputMode == "cycleSmart") {
            let currentInputAgents = this.inputs[this.selectedInput].finishedAgents;

            if (currentInputAgents.length > 0) {
                inputAgents = inputAgents.concat( currentInputAgents );
            } else {
                this.#cycleInput();
            }
        }

        if (this.inputMode == "cycleSingleSmart") {
            let currentInputAgents = this.inputs[this.selectedInput].finishedAgents;

            if (currentInputAgents.length > 0) {
                inputAgents = inputAgents.concat( currentInputAgents[0] );
            } else {
                this.#cycleInput();
            }
        }

        if (this.inputMode == "max") {
            let numberedInputs = this.inputs.map(function (inputPath, index) {return {"bufferSize": inputPath.finishedAgents.length, "index": index}} );

            numberedInputs.sort((a, b) => b.bufferSize - a.bufferSize);
            this.selectedInput = numberedInputs[0].index;

            inputAgents = inputAgents.concat( this.inputs[this.selectedInput].finishedAgents );
        }

        if (this.inputMode == "maxSingle") {
            let numberedInputs = this.inputs.map(function (inputPath, index) {return {"bufferSize": inputPath.finishedAgents.length, "index": index}} );

            numberedInputs.sort((a, b) => b.bufferSize - a.bufferSize);
            this.selectedInput = numberedInputs[0].index;

            inputAgents = inputAgents.concat( this.inputs[this.selectedInput].finishedAgents[0] ?? [] );
        }

        if (this.inputMode == "maxSingleSmart") {
            let currentInputAgents = this.inputs[this.selectedInput].finishedAgents;

            if (currentInputAgents.length > 0) {
                inputAgents = inputAgents.concat( currentInputAgents[0] );
            } else {
                let numberedInputs = this.inputs.map(function (inputPath, index) {return {"bufferSize": inputPath.finishedAgents.length, "index": index}} );

                numberedInputs.sort((a, b) => b.bufferSize - a.bufferSize);
                this.selectedInput = numberedInputs[0].index;
            }
        }

        if (this.inputMode == "min") {
            let numberedInputs = this.inputs.map(function (inputPath, index) {return {"bufferSize": inputPath.finishedAgents.length, "index": index}} );
            numberedInputs = numberedInputs.filter(a => a.bufferSize > 0);
            if (numberedInputs.length == 0) return;
            numberedInputs.sort((a, b) => a.bufferSize - b.bufferSize);
            this.selectedInput = numberedInputs[0].index;

            inputAgents = inputAgents.concat( this.inputs[this.selectedInput].finishedAgents );
        }

        if (this.inputMode == "minSingle") {
            let numberedInputs = this.inputs.map(function (inputPath, index) {return {"bufferSize": inputPath.finishedAgents.length, "index": index}} );
            numberedInputs = numberedInputs.filter(a => a.bufferSize > 0);
            if (numberedInputs.length == 0) return;
            numberedInputs.sort((a, b) => a.bufferSize - b.bufferSize);
            this.selectedInput = numberedInputs[0].index;

            inputAgents = inputAgents.concat( this.inputs[this.selectedInput].finishedAgents[0] ?? [] );
        }

        if (this.inputMode == "minSingleSmart") {
            let currentInputAgents = this.inputs[this.selectedInput].finishedAgents;

            if (currentInputAgents.length > 0) {
                inputAgents = inputAgents.concat( currentInputAgents[0] );
            } else {
                let numberedInputs = this.inputs.map(function (inputPath, index) {return {"bufferSize": inputPath.finishedAgents.length, "index": index}} );
                numberedInputs = numberedInputs.filter(a => a.bufferSize > 0);
                if (numberedInputs.length == 0) return;
                numberedInputs.sort((a, b) => a.bufferSize - b.bufferSize);
                this.selectedInput = numberedInputs[0].index;
            }
        }

        if (this.inputMode == "random") {
            this.selectedInput = randInt(0, this.inputs.length - 1);
            inputAgents = inputAgents.concat( this.inputs[this.selectedInput].finishedAgents );
        }

        if (this.inputMode == "randomSingle") {
            this.selectedInput = randInt(0, this.inputs.length - 1);
            inputAgents = inputAgents.concat( this.inputs[this.selectedInput].finishedAgents[0] ?? [] );
        }

        //Output the agents

        //...not if the mode is delete mode
        if (this.outputMode == "delete") {
            inputAgents.forEach((agent, index) => {
                agent.path.removeFromFinished(agent);
                agent.disabled = true;
            });
        }

        if (this.outputs.length == 0) return;

        //Distribute agents to the output
        if (this.outputMode == "cycle") {
            inputAgents.forEach((agent, index) => {
                agent.path.removeFromFinished(agent); //Remove from old path
                this.outputs[this.selectedOutput].addAgent(agent); //Add to new path
                this.#cycleOutput();
            });
        }

        if (this.outputMode == "cycleSingle" && inputAgents.length > 0) {
            inputAgents[0].path.removeFromFinished(inputAgents[0]);
            this.outputs[this.selectedOutput].addAgent(inputAgents[0]);
            this.#cycleOutput();
        }

        if (this.outputMode == "random") {
            inputAgents.forEach((agent, index) => {
                this.selectedOutput = randInt(0, this.outputs.length - 1);
                agent.path.removeFromFinished(agent); //Remove from old path
                this.outputs[this.selectedOutput].addAgent(agent); //Add to new path
            });
        }

        if (this.outputMode == "randomSingle" && inputAgents.length > 0) {
            let agentIndex = randInt(0, inputAgents.length - 1);
            this.selectedOutput = randInt(0, this.outputs.length - 1);
            inputAgents[agentIndex].path.removeFromFinished(inputAgents[agentIndex]); //Remove from old path
            this.outputs[this.selectedOutput].addAgent(inputAgents[agentIndex]); //Add to new path
        }
    }

    render() {
        ctx.fillStyle = "#ff000088";
        ctx.beginPath();
        ctx.arc(this.pos?.x ?? 100, this.pos?.y ?? 100, 8, 0, Math.PI * 2);
        ctx.fill();

        if (this.inputs.length == 0) return;

        let endPoint = this.inputs[this.selectedInput].endPoint;

        ctx.fillStyle = "#00ddff88";
        ctx.beginPath();
        ctx.arc(endPoint.x, endPoint.y, 10, 0, Math.PI * 2);
        ctx.fill();
    }
}

class PathFollow {
    pos = new Vector();
    speed = 5;
    color = "#00ff00";

    path;
    lastPointIndex = 0;

    following = false;
    finished = false;
    disabled = false;
    canFinish = true;

    /**
     * Creates a new path following agent
     * @param {Number} speed The agent's speed (*pixels / update*)
     * @param {String} color The agent's color. (for debugging)
     */
    constructor(speed = 5, color = "#00ff00") {
        this.pos = new Vector(0, 0);
        this.speed = speed;
        this.color = color;
        this.following = false;
        this.finished = false;
    }

    /**
     * Sets the followed path. The agent will start from the newly set path's `startPoint`
     * @param {Path} path The new path to be followed. **(Must be a `Path` instance!)**
     * @param {String} startMode
     - The starting mode. Can be:
     - **restart**: Starts the new path from the beginning
     - **closest**: Starts the new path from the closest point to it self.
     */
    setPath(path, startMode = "restart") {
        if (!(path instanceof Path)) throw Error("The path must be an instance of 'Path' !");

        this.path = path;
        this.following = false;

        if (startMode == "restart") this.startPath();
        if (startMode == "closest") {
            let closestpointOnPath = this.path.getClosestPoint(this.pos);
            if (closestpointOnPath == null) return;
            this.pos = closestpointOnPath;
            this.following = true;
            this.finished = false;
            this.lastPointIndex = 0;
        }
    }

    /**
     * Sets it's position to the given path, and initialises the following state variables.
     * @returns {void}
     */
    startPath() {
        let startingPoint = this.path.startPoint;

        if (startingPoint == null) return;

        this.pos = startingPoint.copy();
        this.lastPointIndex = 0;
        this.following = true;
        this.finished = false;
    }

    update() {
        if (!this.following) return;

        let jumpSuccesful = false;
        let currentSpeed = this.speed;

        /*ctx.lineWidth = 2;
        ctx.strokeStyle = "#ff0000";
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);*/

        while (!jumpSuccesful) {
            if (this.path.isLastPointIndex(this.lastPointIndex)) break;

            //Moveitem
            let nextPoint = this.path.getPoint(this.lastPointIndex + 1);
            let diffVec = nextPoint.sub(this.pos);
            let distToPoint = diffVec.length;
            let targetVector = diffVec.unit(Math.min(currentSpeed, distToPoint));

            this.pos = this.pos.add(targetVector);
            //ctx.lineTo(this.pos.x, this.pos.y);

            if (distToPoint < currentSpeed) {
                jumpSuccesful = false;
                currentSpeed = currentSpeed - distToPoint;
            } else {
                jumpSuccesful = true;
            }

            //Advance index if point is reached or if skipped
            if (distToPoint <= currentSpeed || !jumpSuccesful) this.lastPointIndex += 1;

            //Check if at last point if it is: Stop following
            if (this.path.isLastPointIndex(this.lastPointIndex) && this.canFinish) {
                this.following = false;
                this.finished = true;
                this.path.addToFinished(this);
            }
        }

        //ctx.stroke();
    }

    render() {
        ctx.fillStyle = this.following ? this.color : "#ff000088";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.following ? 20 : 3, 0, Math.PI * 2);
        ctx.fill();
    }
}