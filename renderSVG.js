function renderNode(node) {
    if (node.type === 'element') {
        let attributes = '';
        for (const key in node.properties) {
            const svgKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            attributes += `${svgKey}="${node.properties[key]}" `;
        }

        let childrenContent = '';
        if (node.children && node.children.length > 0) {
            childrenContent = node.children.map(renderNode).join('');
        }

        return `<${node.tagName} ${attributes}>${childrenContent}</${node.tagName}>`;
    }
    
    return '';
}

export function renderSvg(imageTree) {
    return renderNode(imageTree);
}