import {read, plot, renderLayers, renderBoard} from '@tracespace/core';
import svgPanZoom from 'svg-pan-zoom';
// import { parse } from './OLD/parser.js';
// import { getLayers } from './OLD/getLayers.js';
// import { renderLayer} from "./OLD/renderLayer.js";

const gerberInput = document.getElementById('gerber-input');
const svg = document.getElementById('svg');
const viewSettings = svgPanZoom('#svg', {
    zoomScaleSensitivity: 0.3,
    preventMouseEventsDefault: false,
    minZoom: 0.75,
    maxZoom: 100,
});

const viewPort = document.querySelector('.svg-pan-zoom_viewport');

gerberInput.addEventListener('change', async e => {
    const files = Array.from(e.target.files);
    const fileNames = [];

    if (files.length > 0) {
        const readResult = await read(files);
        const plotResult = plot(readResult);
        const renderLayersResult = renderLayers(plotResult);
        const renderBoardResult = renderBoard(renderLayersResult);

        console.log(renderLayersResult);

        // await Promise.all([
        //     // vol.writeFile('top.svg', renderBoardResult.top, catchErr(err)),
        //     // vol.writeFile('bottom.svg', renderBoardResult.bottom, catchErr(err)),
        //     // fs.writeFile('top.svg', renderBoardResult.top),
        //     // fs.writeFile('bottom.svg', renderBoardResult.bottom)
        // ]);
        // Array.from(files).forEach(file => { fileNames.push(file.name); });
        //
        // const filePromises = Array.from(files).map(file => {
        //     return new Promise(resolve => {
        //         const reader = new FileReader();
        //         reader.onload = e => resolve(e.target.result);
        //         reader.readAsText(file);
        //     });
        // });
        //
        // const fileContents = await Promise.all(filePromises);
        // const parsedCommandsArray = fileContents.map(content => {
        //     return parse(content);
        // });
        //
        // const layers = getLayers(parsedCommandsArray, fileNames);
        // for (const layerName in layers) {
        //     const layer = layers[layerName];
        //     console.log(layer);
        //     viewPort.appendChild(renderLayer(layer));
        // }

        viewSettings.updateBBox();
        viewSettings.fit();
        viewSettings.center();
    }
});