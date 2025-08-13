import { createParser } from '@tracespace/parser';
import { getReady } from './getReady.js';
// import { render } from '@tracespace/renderer';
// import { plot } from '@tracespace/plotter';

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
        
        getReady(parsedCommandsArray, fileNames);
    }
});