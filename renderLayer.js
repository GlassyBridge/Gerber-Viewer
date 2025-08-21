import { svg } from './script.js';
// #region RenderLayer

/**
 *   |\  /|   /\   |¯¯¯¯ |¯¯¯¯\ |¯¯¯¯| |¯¯¯¯\ |¯¯¯¯\ --|-- |\  /| --|-- --|-- --|-- \    / |¯¯¯¯ /¯¯¯¯
 *   | \/ |  /__\  |     |----/ |    | |––––/ |----/   |   | \/ |   |     |     |    \  /  |---- \---\
 *   |    | /    \ |____ |    \ |____| |      |    \ __|__ |    | __|__   |   __|__   \/   |____  ___/ and their modifiers
 * .
 *  | Code  | Name          | Modifiers                                                 |
 *  |-------|---------------|-----------------------------------------------------------|
 *  | 1     | circle        | [exposure, diameter, center-x, center-y]                  |
 *  | 2     | line          | [exposure, start-x, start-y, end-x, end-y, width]         |
 *  | 4     | outline       | [exposure, num-vertices, vert-x1, vert-y1, ..., rotation] |
 *  | 5     | polygon       | [exposure, num-vertices, vert-x1, vert-y1, ..., rotation] |
 *  | 20    | rectangle     | [exposure, x-size, y-size, center-x, center-y, rotation]  |
 *  | 21    | obround       | [exposure, x-size, y-size, center-x, center-y, rotation]  |
 */


const svgNS = "http://www.w3.org/2000/svg";

// A function that handles the rendering of a single layer.
export function renderLayer(layerData) {
    const precision = Math.pow(10, layerData.precision);
    const toolDefinitions = layerData.toolDefinitions;
    const toolMacros = layerData.toolMacros;
    const commands = layerData.commands;
    let currentToolCode = null;
    let lastX = null;
    let lastY = null;

    for (const command of commands) {
        // Handles tool change.
        if (command.type === 'toolChange') {
            currentToolCode = command.code;
        }
        //Handles drawing.
        if (command.type === 'graphic') {
            const x = parseFloat(command.coordinates.x) / precision;
            const y = parseFloat(command.coordinates.y) / precision;
            if (currentToolCode) {
                const tool = toolDefinitions[currentToolCode];
                const graphic = command.graphic;
                if (graphic === 'shape') {
                    if (tool.type === 'macroShape')
                        svg.appendChild(drawShape(tool, x, y, toolMacros[tool.name]));
                    else
                        svg.appendChild(drawShape(tool, x, y, null));
                } else if (graphic === 'move') {
                    lastX = x;
                    lastY = y;
                } else if (graphic === 'segment') {
                    svg.append(drawLine(lastX, lastY, x, y, tool.diameter));
                    lastX = null;
                    lastY = null;
                }
            }
        }
    }
}

function drawShape(tool, x, y, macro = null) {
    switch (tool.type) {
        case 'circle':
            const circle = drawCircle(x, y, tool.diameter);
            return circle;
        case 'rectangle':
            return drawRect(x, y, tool.xSize, tool.ySize, 0);
        case 'obround':
            console.log('you have to draw an obround with:', tool);
            return drawRect(x, y, tool.xSize, tool.ySize, 0);
        case 'macroShape':
            if (macro)
                return drawMacro(x, y, macro);
            else
                console.error('No macro given');
                return null;
        default:
            console.warn(`This shape with code ${tool.code} and name ${tool.type} isn't known:\n ${tool}`);
            return null;
    }
}

function drawMacro(x, y, macro) {
    const macroShape = document.createElementNS(svgNS, 'g');

    if (macro)
        for (const primitive of macro.primitives) {
            const shape = drawPrimitive(primitive, x, y);
            if(shape)
                macroShape.appendChild(shape);
        }

    return macroShape;
}

function drawPrimitive(primitive, x, y) {
    switch (primitive.name) {
        case 'circle':
            const [, diameter, centerX, centerY] = primitive.modifiers;
            return drawCircle(x + centerX, y + centerY, diameter);
        case 'line':
            const [, startX, startY, endX, endY, width] = primitive.modifiers;
            return drawLine(x + startX, y + startY, x + endX, y + endY, width);
        case 'outline':
            const outlineVertices = primitive.modifiers.slice(2, primitive.modifiers.length - 1);
            return drawOutline(x, y, outlineVertices);
        case 'polygon':
            const polygonVertices = primitive.modifiers.slice(2, primitive.modifiers.length - 1);
            return drawPolygon(x, y, polygonVertices);
        case 'rectangle':
            const [exposure, xSize, ySize, rectCenterX, rectCenterY, rotation] = primitive.modifiers;
            return drawRect(x + rectCenterX, y + rectCenterY, xSize, ySize, rotation);           
        case 'obround':
            const [, obroundXSize, obroundYSize, obroundCenterX, obroundCenterY, obroundRotation] = primitive.modifiers;
            return drawObround(x + obroundCenterX, y + obroundCenterY, obroundXSize, obroundYSize, obroundRotation);
        default:
            console.warn(`This primitive with code ${primitive.code} and name ${primitive.name} isn't known:\n`, primitive);
            break;
    }
}

function drawCircle(x, y, diameter, fill = 'black') {
    const circle = document.createElementNS(svgNS, 'circle');

    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', diameter / 2);
    circle.setAttribute('fill', fill);
    circle.setAttribute('stroke', 'none');

    return circle;
}

function drawLine(startX, startY, endX, endY, width, fill = 'black') {
    const line = document.createElementNS(svgNS, 'line');

    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', endX);
    line.setAttribute('y2', endY);
    line.setAttribute('stroke', fill);
    line.setAttribute('stroke-width', width);

    return line;
}

function drawOutline(x, y, vertices) {
    const polyline = document.createElementNS(svgNS, 'polyline');

    // Addiing global x and y offsets to verticies.
    const points = vertices.map((val, i) => (i % 2 === 0 ? x + val : y + val)).join(' ');
    
    polyline.setAttribute('points', points);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', 'black');

    return polyline;
}

function drawPolygon(x, y, vertices, fill = 'black') {
    const polygon = document.createElementNS(svgNS, 'polygon');
    
    // Addiing global x and y offsets to verticies.
    const points = vertices.map((val, i) => i % 2 === 0 ? x + val : y + val).join(' ');
    
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', fill);
    polygon.setAttribute('stroke', 'black');
    return polygon;
}

function drawRect(centerX, centerY, width, height, rotation, fill = 'black') {
    const rect = document.createElementNS(svgNS, 'rect');

    rect.setAttribute('x', centerX - width / 2);
    rect.setAttribute('y', centerY - height / 2);
    rect.setAttribute('width', Math.abs(width));
    rect.setAttribute('height', Math.abs(height));
    rect.setAttribute('transform', `rotate(${rotation}, ${centerX}, ${centerY})`);
    rect.setAttribute('fill', fill);
    rect.setAttribute('stroke', 'none');

    return rect;
}

function drawObround(centerX, centerY, width, height, rotation, fill = 'black') {
    const obroundPath = document.createElementNS(svgNS, 'path');

    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const radius = Math.min(halfWidth, halfHeight);

    // (__OBROUND¯¯)
    const pathData = `
        M ${centerX + halfWidth - radius},${centerY - halfHeight}
        A ${radius},${radius} 0 0,1 ${centerX + halfWidth},${centerY - halfHeight + radius}
        L ${centerX + halfWidth},${centerY + halfHeight - radius}
        A ${radius},${radius} 0 0,1 ${centerX + halfWidth - radius},${centerY + halfHeight}
        L ${centerX - halfWidth + radius},${centerY + halfHeight}
        A ${radius},${radius} 0 0,1 ${centerX - halfWidth},${centerY + halfHeight - radius}
        L ${centerX - halfWidth},${centerY - halfHeight + radius}
        A ${radius},${radius} 0 0,1 ${centerX - halfWidth + radius},${centerY - halfHeight}
        Z
    `;

    obroundPath.setAttribute('d', pathData);
    obroundPath.setAttribute('fill', fill);
    obroundPath.setAttribute('stroke', 'black');
    obroundPath.setAttribute('transform', `rotate(${rotation}, ${centerX}, ${centerY})`);

    return obroundPath;
}