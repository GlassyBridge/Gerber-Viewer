import { parse } from './parser.js';
import { getLayers } from './getReady.js';
import { renderLayer } from "./renderLayer.js";

const gerberInput = document.getElementById('gerber-input');
const sceneContainer = document.getElementById('scene-container');
export const svg = document.getElementById('svg');

gerberInput.addEventListener('change', async e => {
    const files = e.target.files;
    const fileNames = [];

    if (files.length > 0) {
        Array.from(files).forEach(file => { fileNames.push(file.name); });

        const filePromises = Array.from(files).map(file => {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsText(file);
            });
        });

        const fileContents = await Promise.all(filePromises);
        const parsedCommandsArray = fileContents.map(content => {
            return parse(content);
        });

        const layers = getLayers(parsedCommandsArray, fileNames);
        for (const layerName in layers) {
            const layer = layers[layerName];
            renderLayer(layer, parsedCommandsArray);
        }
    }
});