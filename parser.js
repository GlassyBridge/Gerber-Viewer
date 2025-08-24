import { createParser } from '@tracespace/parser';

function primitiveName(code) {
    const primitiveMap = {
        '1': 'circle',
        '2': 'line',
        '4': 'outline',
        '5': 'polygon',
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
function temporaryFix(gerberString) {
    if (gerberString.includes('%T')) {
        const lines = gerberString.split('\n');
        const modifiedLines = [];
        for (const line of lines) {
            if (line.startsWith('%T')) {
                // Replace '%' with 'G04 #@! '.
                let modifiedLine = line.replace('%', 'G04 #@! ');
                
                // Replace '*%' at the end with '*'.
                if (modifiedLine.endsWith('*%')) {
                    modifiedLine = modifiedLine.slice(0, -1);
                }
                
                modifiedLines.push(modifiedLine);
            } else {
                // Don't change the other lines.
                modifiedLines.push(line);
            }
        }
        // Return modified string.
        return modifiedLines.join('\n');
    }
    // Return original string/file.
    return gerberString;
}

/**
 * Simple parser function from @ tracespace/parser with added support for macroPrimitive names.
 *
 * @example
 * ```ts
 * import { parse } from 'parser.js';
 *
 * //Get the parsed file:
 * parse('GO4 gerber file contents');
 * ```
 *
 * @category Parser
 */
export function parse(content) {
    // The newer gerber format isn't supported by @tracespace/parser so changing them to commands.
    content = temporaryFix(content);

    const parser = createParser();
    parser.feed(content);
    const tree = parser.results();

    tree.children.filetype = tree.filetype;
    const parsedData = macroPrimitiveTypes(tree.children);

    return parsedData;
}