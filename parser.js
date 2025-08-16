import { createParser } from '@tracespace/parser';

function getPrimitiveName(code) {
    const primitiveMap = {
        '1': 'circle',
        '2': 'vectorLine',
        '4': 'outline',
        '5': 'polygon',
        '20': 'rectangle',
        '21': 'obround',
        '22': 'polygon'
    };

    return primitiveMap[code] || unsupported;
}

// I don't think it's best practice but it gets the job done.
function addMacroPrimitiveTypes(children) {
    for (const command in children) {
        if (command.type === 'toolMacro') {
            for (const child of command.children) {
                if (command.type === 'macroPrimitive') {
                    child['name'] = getPrimitiveName(command.code);
                }
            }
        }
    }

    return children;
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
    const parser = createParser();
    parser.feed(content);
    const tree = parser.results();
    tree.children.filetype = tree.filetype;
    return addMacroPrimitiveTypes(tree.children);
}