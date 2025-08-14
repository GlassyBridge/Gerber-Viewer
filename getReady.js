function resolveModifier(modifier, toolParams) {
    if (!isNaN(modifier)) {
        return modifier;
    }
    
    if (typeof modifier === 'string' && modifier.startsWith('$')) {
        const index = parseInt(modifier.substring(1), 10) - 1;
        return toolParams[index];
    }
    
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

    return null;
}

export function getLayers(commandsArray, fileNames) {
    const layers = {};

    commandsArray.forEach((commands, index) => {
        const toolDefinitions = {};
        const toolMacros = {};

        // First loop to set the values of both variables.
        for (const command of commands) {
            if (command.type === 'toolDefinition') {
                toolDefinitions[command.code] = command.shape;
            }
            if (command.type === 'toolMacro') {
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
                const macro = toolMacros[tool.name];
                const toolParams = tool.params;

                const macroPrimitives = macro.primitives;
                const resolvedPrimitives = macroPrimitives.map(primitive => {
                    const resolvedModifiers = primitive.modifiers.map(modifier => {
                        return resolveModifier(modifier, toolParams);
                    });

                    return {
                        code: primitive.code,
                        modifiers: resolvedModifiers
                    };
                });

                macro.primitives = resolvedPrimitives;
            }
        }
        
        const fileName = fileNames[index];
        layers[fileName ? fileName : `layer ${index}`] = {
            toolDefinitions: toolDefinitions,
            toolMacros: toolMacros
        };
    });

    return layers;
}