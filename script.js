import { createParser } from '@tracespace/parser';
import { getLayers, renderLayer } from './getReady.js';

const gerberInput = document.getElementById('gerber-input');
const sceneContainer = document.getElementById('scene-container');

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
            const parser = createParser();
            parser.feed(content);
            return parser.results().children;
        });

        const layers = getLayers(parsedCommandsArray, fileNames);
        for (const layerName in layers) {
            const layer = layers[layerName];
            renderLayer(layer, parsedCommandsArray);
        }
    }
});