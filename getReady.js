export function getReady(commandsArray, fileNames) {
    const layers = {};

    commandsArray.forEach((commands, index) => {
        const toolDefinitions = {};
        const toolMacros = {};

        for (const command of commands) {
            if (command.type === 'toolDefinition') {
                toolDefinitions[command.code] = {
                    shape: command.shape,
                };
            }
            if (command.type === 'toolMacro') {
                toolMacros[command.name] = command.children;
            }
        }

        const fileName = fileNames[index];
        layers[fileName ? fileNames : `layer ${index}`] = {
            toolDefinitions,
            toolMacros
        };
    });

    return layers;
}
