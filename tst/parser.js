function primitiveName(code) {
    const primitiveMap = {
        '1': 'circle',
        '2': 'line',
        '4': 'polygon',
        '20': 'rectangle',
        '21': 'obround',
        '22': 'polygon'
    };

    return primitiveMap[code] || unsupported;
}

function macroPrimitiveTypes(children) {
    children.forEach((command) => {
        if (command.type === 'toolMacro') {
            command.children.forEach((child) => {
                if (child.type === 'macroPrimitive') {
                    child.name = primitiveName(child.code);
                }
            });
        }
    });

    return children;
}

// Temporary fix for X3 format.
// function temporaryFix(gerberString) {
//     if (gerberString.includes('%T')) {
//         const lines = gerberString.split('\n');
//         const modifiedLines = [];
//         for (const line of lines) {
//             if (line.startsWith('%T')) {
//                 // Replace '%' with 'G04 #@! '.
//                 let modifiedLine = line.replace('%', 'G04 #@! ');
                
//                 // Replace '*%' at the end with '*'.
//                 if (modifiedLine.endsWith('*%')) {
//                     modifiedLine = modifiedLine.slice(0, -1);
//                 }
                
//                 modifiedLines.push(modifiedLine);
//             } else {
//                 // Don't change the other lines.
//                 modifiedLines.push(line);
//             }
//         }
//         // Return modified string.
//         return modifiedLines.join('\n');
//     }
//     // Return original string/file.
//     return gerberString;
// }

/**
 * Simple parser function from @ tracespace/parser with added support for macroPrimitive names.
 *
 * @example
 * ```ts
 * import { parse } from 'parser.js';
 *
 * //Get the parsed file:
 * parse('GO4 gerber file readResults');
 * ```
 *
 * @category Parser
 */
export function parse(readResult) {
    const parsedData = {};
    for (const layer in readResult.layers) {
        const layerObject = readResult.layers[layer];
        const parsedObject = readResult.parseTreesById[layerObject.id];
        parsedData[layerObject.id] = {
            fileData: { id: layerObject.id,
                        filename: layerObject.filename,
                        type: layerObject.type,
                        side: layerObject.side,
                        filetype: parsedObject.filetype
                    },
            children: parsedObject.children
        };
    }
    for (const layerID in parsedData) {
        const layerChildrenData = parsedData[layerID].children;
        parsedData[layerID].children = macroPrimitiveTypes(layerChildrenData);
    }
    return parsedData;
}