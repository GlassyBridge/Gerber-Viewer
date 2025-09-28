import {read, plot, renderLayers, renderBoard} from '@tracespace/core';
import svgPanZoom from 'svg-pan-zoom';
import { renderSvg } from './renderSVG.js';
import { parse } from './tst/parser.js';
import { getLayers } from './tst/getLayers.js';
import { renderLayer } from "./tst/renderLayer.js";

const gerberInput = document.getElementById('gerber-input');
const svg = document.getElementById('svg');
const viewSettings = svgPanZoom('#svg', {
    zoomScaleSensitivity: 0.3,
    preventMouseEventsDefault: false,
    minZoom: 0.75,
    maxZoom: 100,
    beforePan: function (oldPan, newPan){
                    const stopHorizontal = false
                    , stopVertical = false
                    , gutterWidth = 100
                    , gutterHeight = 100
                    , sizes = this.getSizes()
                    , leftLimit = -((sizes.viewBox.x + sizes.viewBox.width) * sizes.realZoom) + gutterWidth
                    , rightLimit = sizes.width - gutterWidth - (sizes.viewBox.x * sizes.realZoom)
                    , topLimit = -((sizes.viewBox.y + sizes.viewBox.height) * sizes.realZoom) + gutterHeight
                    , bottomLimit = sizes.height - gutterHeight - (sizes.viewBox.y * sizes.realZoom)

                    const customPan = {}
                    customPan.x = Math.max(leftLimit, Math.min(rightLimit, newPan.x))
                    customPan.y = Math.max(topLimit, Math.min(bottomLimit, newPan.y))

                    return customPan
                }
});
window.addEventListener('resize', () => { 
    if (svg.clientWidth > 0 && svg.clientHeight > 0) {
        viewSettings.resize();
        viewSettings.center();
        viewSettings.fit();
    } 
});
const viewPort = document.querySelector('.svg-pan-zoom_viewport');
const layersList = document.getElementById('layers-list');

let renderMethod = 'top';
let renderBoardResult;
let layers;
const layerObjs = {};

let topLayer = document.createElementNS("http://www.w3.org/2000/svg", 'g');
topLayer.id = 'topLayer';
viewPort.appendChild(topLayer);
let bottomLayer = document.createElementNS("http://www.w3.org/2000/svg", 'g');
bottomLayer.id = 'bottomLayer';
viewPort.appendChild(bottomLayer);
let allLayers = document.createElementNS("http://www.w3.org/2000/svg", 'g');
allLayers.id = 'allLayers';
viewPort.appendChild(allLayers);

const bt1 = document.getElementById('bt1');
bt1.addEventListener('click', () => {
    renderMethod = 'top';

    topLayer.classList.remove('hidden');
    bottomLayer.classList.add('hidden');
    allLayers.classList.add('hidden');

    viewSettings.updateBBox();
    // viewSettings.fit();
    // viewSettings.center();
});
const bt2 = document.getElementById('bt2');
bt2.addEventListener('click', () => {
    renderMethod = 'bottom';

    topLayer.classList.add('hidden');
    bottomLayer.classList.remove('hidden');
    allLayers.classList.add('hidden');

    viewSettings.updateBBox();
    // viewSettings.fit();
    // viewSettings.center();
});
const bt3 = document.getElementById('bt3');
bt3.addEventListener('click', () => {
    renderMethod = 'layers';
    
    topLayer.classList.add('hidden');
    bottomLayer.classList.add('hidden');
    allLayers.classList.remove('hidden');

    viewSettings.updateBBox();
    // viewSettings.fit();
    // viewSettings.center();
});

gerberInput.addEventListener('change', async e => {
    const files = Array.from(e.target.files);

    if (files.length > 0) {
        const readResult = await read(files);
        const plotResult = plot(readResult);
        const renderLayersResult = renderLayers(plotResult);
        renderBoardResult = renderBoard(renderLayersResult);

        const parsedCommands = parse(readResult);
        layers = getLayers(parsedCommands);
        layersList.innerHTML = '';
        allLayers.innerHTML = '';

        topLayer.innerHTML = renderSvg(renderBoardResult.top);
        bottomLayer.innerHTML = renderSvg(renderBoardResult.bottom);
        for (const layerID in layers) {
            const layerData = layers[layerID];
            const layer = renderLayer(layerData);
            layerObjs[layerID] = {
                    layer: layer,
                    color: layerData.color,
                    updateColor: function(newColor) {
                        this.color = newColor;
                        this.layer.setAttribute('fill', newColor);
                        this.layer.setAttribute('stroke', newColor);
                    },
                    id: layerData.id,
                    type: layerData.type,
                    side: layerData.side,
                    filename: layerData.filename
            };
            layersList.appendChild(createLayerControl(layerObjs[layerID]));
            allLayers.appendChild(layer);
        }
        allLayers.style.transform = 'scale(1,-1)';
        
        topLayer.classList.add('hidden');
        bottomLayer.classList.add('hidden');
        allLayers.classList.add('hidden');

        if (renderMethod === 'top')
            topLayer.classList.remove('hidden');
        else if (renderMethod === 'bottom')
            bottomLayer.classList.remove('hidden');
        else if (renderMethod === 'layers')
            allLayers.classList.remove('hidden');
        
        viewSettings.updateBBox();
        viewSettings.resize();
        viewSettings.fit();
        viewSettings.center();
    }
});

function createLayerControl(layerObj) {
    const layerControl = document.createElement('div');
    layerControl.classList.add('layer-control');

    const visibilityCheckbox = document.createElement('input');
    visibilityCheckbox.type = 'checkbox';
    visibilityCheckbox.checked = true;
    visibilityCheckbox.addEventListener('change', () => {
        if (visibilityCheckbox.checked) {
            layerObj.layer.classList.remove('hidden');
        } else {
            layerObj.layer.classList.add('hidden');
        }
    });

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = layerObj.color;
    colorInput.addEventListener('change', () => {
        layerObj.updateColor(colorInput.value);
    });

    const name = document.createElement('span');
    name.textContent = layerObj.type + ' - ' + layerObj.side;

    layerControl.appendChild(colorInput);
    layerControl.appendChild(name);
    layerControl.appendChild(visibilityCheckbox);

    return layerControl;
}