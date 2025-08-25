// #region RenderLayer
/*
 * ███╗░░░███╗░█████╗░░█████╗░██████╗░░█████╗░██████╗░██████╗░██╗███╗░░░███╗██╗████████╗██╗██╗░░░██╗███████╗░██████╗
 * ████╗░████║██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗██║████╗░████║██║╚══██╔══╝██║██║░░░██║██╔════╝██╔════╝
 * ██╔████╔██║███████║██║░░╚═╝██████╔╝██║░░██║██████╔╝██████╔╝██║██╔████╔██║██║░░░██║░░░██║╚██╗░██╔╝█████╗░░╚█████╗░
 * ██║╚██╔╝██║██╔══██║██║░░██╗██╔══██╗██║░░██║██╔═══╝░██╔══██╗██║██║╚██╔╝██║██║░░░██║░░░██║░╚████╔╝░██╔══╝░░░╚═══██╗
 * ██║░╚═╝░██║██║░░██║╚█████╔╝██║░░██║╚█████╔╝██║░░░░░██║░░██║██║██║░╚═╝░██║██║░░░██║░░░██║░░╚██╔╝░░███████╗██████╔╝
 * ╚═╝░░░░░╚═╝╚═╝░░╚═╝░╚════╝░╚═╝░░╚═╝░╚════╝░╚═╝░░░░░╚═╝░░╚═╝╚═╝╚═╝░░░░░╚═╝╚═╝░░░╚═╝░░░╚═╝░░░╚═╝░░░╚══════╝╚═════╝░ and their modifiers.
 *  ___________________________________________________________________________________________________
 *  | Code  | Name          | Modifiers                                                               |
 *  |-------|---------------|-------------------------------------------------------------------------|
 *  | 1     | circle        | [exposure, diameter, center-x, center-y]                                |
 *  | 2     | line          | [exposure, start-x, start-y, end-x, end-y, width]                       |
 *  | 4     | polygon       | [exposure, num-vertices, vert-x1, vert-y1, ..., rotation]               |
 *  | 20    | rectangle     | [exposure, x-size, y-size, center-x, center-y, rotation]                |
 *  | 21    | obround       | [exposure, x-size, y-size, center-x, center-y, rotation]                |
 *  ---------------------------------------------------------------------------------------------------
 */

const svgNS = "http://www.w3.org/2000/svg";

// A function that handles the rendering of a single layer.
export function renderLayer(layerData) {
    // Constant values from the layer Data.
    const precision = Math.pow(10, layerData.precision);
    const toolDefinitions = layerData.toolDefinitions;
    const toolMacros = layerData.toolMacros;
    const commands = layerData.commands;
    const name = `${layerData.fileFunction.layer} ${layerData.fileFunction.side}`;
    // Variable variables for drawing shapes.
    let currentToolCode = null;
    let lastX = null;
    let lastY = null;
    // Layer html object.
    const layer = document.createElementNS(svgNS, 'g');
    layer.setAttribute('class', 'layer');
    layer.setAttribute('fill', 'black');
    layer.setAttribute('stroke', 'black');
    layer.setAttribute('id', name);

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
                        layer.appendChild(drawShape(tool, x, y, toolMacros[tool.name]));
                    else
                        layer.appendChild(drawShape(tool, x, y, null));
                } else if (graphic === 'move') {
                    lastX = x;
                    lastY = y;
                } else if (graphic === 'segment') {
                    layer.appendChild(drawLine(lastX, lastY, x, y, tool.diameter));
                    lastX = x;
                    lastY = y;
                }
            }
        }
    }
    // Return layer object.
    return layer;
}

function drawShape(tool, x, y, macro = null) {
    switch (tool.type) {
        case 'circle':
            return  drawCircle(x, y, tool.diameter);
        case 'rectangle':
            return drawRect(x, y, tool.xSize, tool.ySize, 0);
        case 'obround':
            return drawObround(x, y, tool.xSize, tool.ySize, 0);
        case 'macroShape':
            if (macro)
                return drawMacro(x, y, macro);
            else {
                throw new Error('No macro given');
            }
        default:
            throw new Error(`This shape with code ${tool.code} and name ${tool.type} isn't implemented:\n ${tool}`);
    }
}

function drawMacro(x, y, macro) {
    const macroShape = document.createElementNS(svgNS, 'g');
    macroShape.setAttribute('data-gv-name', macro.macroName);
    if (macro) {
        for (const primitive of macro.primitives) {
            const shape = drawPrimitive(primitive, x, y);
            if (shape) {
                shape.setAttribute('data-gv-name', primitive.name);
                macroShape.appendChild(shape);
            }
        }
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
        case 'polygon':
            const polygonVertices = primitive.modifiers.slice(2, primitive.modifiers.length - 1);
            return drawPolygon(x, y, polygonVertices);
        case 'rectangle':
            if (primitive.modifiers.length == 7) {
                const [, strokeWidth, startX, startY, endX, endY] = primitive.modifiers;
                return drawLine(x + startX, y + startY, x + endX, y + endY, strokeWidth);
            } else {
                throw new Error('Other definition for the primitive rectangle not implemented.');
            }
        case 'obround':
            const [, obroundXSize, obroundYSize, obroundCenterX, obroundCenterY, obroundRotation] = primitive.modifiers;
            return drawObround(x + obroundCenterX, y + obroundCenterY, obroundXSize, obroundYSize, obroundRotation);
        default:
            throw new Error(`This primitive with code ${primitive.code} and name ${primitive.name} isn't known:\n ${primitive}`);
    }
}

function drawCircle(x, y, diameter) {
    const circle = document.createElementNS(svgNS, 'circle');

    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', diameter / 2);
    circle.setAttribute('fill', 'inherit');
    circle.setAttribute('stroke', 'none');

    return circle;
}

function drawLine(startX, startY, endX, endY, width) {
    const line = document.createElementNS(svgNS, 'line');

    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', endX);
    line.setAttribute('y2', endY);
    line.setAttribute('fill', 'inherit');
    line.setAttribute('stroke', 'inherit');
    line.setAttribute('stroke-width', width);

    return line;
}

function drawPolygon(x, y, vertices) {
    const polygon = document.createElementNS(svgNS, 'polygon');
    
    // Addiing local x and y offsets to verticies.
    const points = vertices.map((val, i) => i % 2 === 0 ? x + val : y + val).join(' ');
    
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'inherit');
    polygon.setAttribute('stroke', 'none');

    return polygon;
}

function drawRect(centerX, centerY, width, height, rotation) {
    const rect = document.createElementNS(svgNS, 'rect');

    rect.setAttribute('x', centerX - width / 2);
    rect.setAttribute('y', centerY - height / 2);
    rect.setAttribute('width', Math.abs(width));
    rect.setAttribute('height', Math.abs(height));
    rect.setAttribute('transform', `rotate(${rotation}, ${centerX}, ${centerY})`);
    rect.setAttribute('fill', 'inherit');
    rect.setAttribute('stroke', 'none');

    return rect;
}

function drawObround(centerX, centerY, width, height, rotation) {
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
    obroundPath.setAttribute('fill', 'inherit');
    obroundPath.setAttribute('stroke', 'none');
    obroundPath.setAttribute('transform', `rotate(${rotation}, ${centerX}, ${centerY})`);

    return obroundPath;
}