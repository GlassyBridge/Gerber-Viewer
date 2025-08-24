//#region GetLayer
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
        let precision = null;

        // First loop to set the values of both variables.
        for (const command of commands) {
            if (command.type === 'toolDefinition') {
                toolDefinitions[command.code] = command.shape;
            } else if (command.type === 'toolMacro') {
                const macroPrimitives = command.children.filter(child => child.type === 'macroPrimitive');
                toolMacros[command.name] = {
                    primitives: macroPrimitives
                };
            } else if (command.type === 'comment') {
                const functionObj = extractFileFunction(command.comment);
                if (functionObj) {
                    fileFunction = functionObj;
                }
            } else if (command.type === 'coordinateFormat') {
                precision = command.format[1];
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
            precision: precision,
            fileType: commands.filetype,
            fileFunction: fileFunction,
            commands: commands,
            toolDefinitions: toolDefinitions,
            toolMacros: toolMacros
        };
    });
    // Return layers object.
    return layers;
}
// #endregion