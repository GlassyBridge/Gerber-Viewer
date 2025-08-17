// A helper function to resolve the modifiers from string place holders like "$1" to actual numbers.
function resolveModifier(modifier, toolParams) {
    // Return number.
    if (!isNaN(modifier)) {
        return modifier;
    }
    // Return number for place holder.
    if (typeof modifier === 'string' && modifier.startsWith('$')) {
        const index = parseInt(modifier.substring(1), 10) - 1;
        return toolParams[index];
    }
    // Return number after operation.
    if (modifier.operator) {
        const left = resolveModifier(modifier.left, toolParams);
        const right = resolveModifier(modifier.right, toolParams);
        
        switch (modifier.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            default: return 'unknown operator';
        }
    }
    // Return null if not handled.
    return null;
}

// A hel[er function to extract file function/ layer type from the comments. (primarily for KiCad)
function extractFileFunction(commentString) {
    // Return an object with function/layer, side and additional attributes.
    // For TF.FileFunction,Copper,L1,Top It should return {function: "Copper", side: "Top", attributes: ["L1"]}.
    if (commentString.startsWith('#@! TF.FileFunction,')) {
        const functionArray = commentString.substring('#@! TF.FileFunction,'.length).split(',');
        const functionObj = {
            function: functionArray[0],
            side: functionArray.at(-1),
            attributes: functionArray.slice(1, functionArray.length - 1)
        }
        return functionObj;
    }
    // Return null if not handled.
    return null;
}

// A function to get layers associated with their rendering data.
export function getLayers(commandsArray, fileNames) {
    const layers = {};

    commandsArray.forEach((commands, index) => {
        const toolDefinitions = {};
        const toolMacros = {};
        let fileFunction = null;

        // First loop to set the values of both variables.
        for (const command of commands) {
            if (command.type === 'comment') {
                const functionObj = extractFileFunction(command.comment);
                if (functionObj) {
                    fileFunction = functionObj;
                }
            } else if (command.type === 'toolDefinition') {
                toolDefinitions[command.code] = command.shape;
            } else if (command.type === 'toolMacro') {
                const macroPrimitives = command.children.filter(child => child.type === 'macroPrimitive');
                toolMacros[command.name] = {
                    primitives: macroPrimitives
                };
            }
        }
        // Second loop on toolDefinitions to resolve the place holders in toolMacros.
        for (const toolCode in toolDefinitions) {
            const tool = toolDefinitions[toolCode];
            if (tool.type === 'macroShape'){
                const macro = toolMacros[tool.name]; // Holds primitives.
                const toolParams = tool.params; // Holds parameters.

                const macroPrimitives = macro.primitives;
                const resolvedPrimitives = macroPrimitives.map(macroPrimitive => {
                    // Return resolved modifiers.
                    const resolvedModifiers = macroPrimitive.modifiers.map(modifier => {
                        return resolveModifier(modifier, toolParams);
                    });
                    // Return object containing the code and resolved modifiers.
                    return {
                        name: macroPrimitive.name,
                        code: macroPrimitive.code,
                        modifiers: resolvedModifiers
                    };
                });
                // Replacing the primitives with the resolved ones.
                macro.primitives = resolvedPrimitives;
            }
        }
        // Layer.
        const fileName = fileNames[index];
        layers[fileName ? fileName : `${fileFunction.function}-${fileFunction.side}`] = {
            fileType: commands.filetype,
            fileFunction: fileFunction,
            commands: commands,
            toolDefinitions: toolDefinitions,
            toolMacros: toolMacros
        };
    });
    // Return layers object.
    console.log(layers);
    return layers;
}

// A function that handles the rendering of a single layer.
export function renderLayer(layerData) {
    let currentToolCode = null;
    const toolDefinitions = layerData.toolDefinitions;
    const toolMacros = layerData.toolMacros;
    const commands = layerData.commands;

    for (const command of commands) {
        // Handles tool change.
        if (command.type === 'toolChange') {
            currentToolCode = command.code;
        }
        //Handles drawing.
        if (command.type === 'graphic') {
            if (currentToolCode) {
                const tool = toolDefinitions[currentToolCode];
                if (tool) {
                    if (tool.type === 'macroShape')
                        drawShape(tool, command.coordinates.x, command.coordinates.y, toolMacros[tool.name]);
                    else
                        drawShape(tool, command.coordinates.x, command.coordinates.y, null);
                }
            }
        }
    }
}

function drawShape(tool, x, y, macro) {
    switch (tool.type) {
        case 'circle':
            drawCircle(); //empty
            break;
        case 'rectangle':
            drawRect(); // empty
            break;
        case 'obround':
            //empty
            break;
        case 'macroShape':
            drawMacro(x, y, macro); //empty
            break;
        default:
            console.warn('IDK this shape.', tool.type);
            break;
    }
}

function drawCircle(x, y, radius) {
    //empty for now
}

function drawRect() {
    //empty for now
}

function drawMacro(x, y, macro) {
    if (macro) {
        for (const primitive of macro.primitives){
            drawPrimitive(primitive, x, y);
        }
    }
}

function drawPrimitive(primitive, x, y) {
    switch (primitive.name) {
        case 'circle': // code 1
            drawCircle(x, y);
            break;
        case 'line': // code 2
            // draw line.
            break;
        case 'outline': // code 4
            // draw outline.
            break;
        case 'polygon': // code 5
            // draw polygon.
            break;
        case 'rectangle': // code 20
            drawRect();
            break;
        case 'obround': // code 21
            // draw polygon?
            break;
        default:
            console.warn(`IDK this primitive: ${primitive}\n`, primitive.code, primitive.name);
            break;
    }
}