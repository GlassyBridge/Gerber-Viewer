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
const viewPort = document.querySelector('.svg-pan-zoom_viewport');

let renderMethod = 'top';
let renderBoardResult;
let layers;

let topLayer = document.createElementNS("http://www.w3.org/2000/svg", 'g');
topLayer.id = 'topLayer';
let bottomLayer = document.createElementNS("http://www.w3.org/2000/svg", 'g');
bottomLayer.id = 'bottomLayer';
let allLayers = document.createElementNS("http://www.w3.org/2000/svg", 'g');
allLayers.id = 'allLayers';

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
    viewSettings.fit();
    viewSettings.center();
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

        topLayer.innerHTML = renderSvg(renderBoardResult.top);
        bottomLayer.innerHTML = renderSvg(renderBoardResult.bottom);
        for (const layerName in layers) {
            console.log(layerName);
            const layerData = layers[layerName];
            const layer = renderLayer(layerData);
            allLayers.appendChild(layer);
        }
        allLayers.style.transform = 'scale(1,-1)';
        
        viewPort.appendChild(topLayer);
        viewPort.appendChild(bottomLayer);
        viewPort.appendChild(allLayers);

        bottomLayer.classList.add('hidden');
        allLayers.classList.add('hidden');
        
        viewSettings.updateBBox();
        viewSettings.fit();
        viewSettings.center();
    }
});