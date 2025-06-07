const pdfjsLib = require('pdfjs-dist');

// Suppress PDF.js warnings
const originalConsoleWarn = console.warn;
console.warn = function(msg) {
    if (msg.includes('TT: undefined function') || msg.includes('fetchStandardFontData')) {
        return; // Suppress font-related warnings
    }
    originalConsoleWarn.apply(console, arguments);
};

async function extractTextFromPdf(pdfBuffer) {
    const loadingTask = pdfjsLib.getDocument({ 
        data: pdfBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        disableFontFace: true, // Disable custom font loading
        useSystemFonts: true, // Use system fonts as fallback
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
    });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent({
            normalizeWhitespace: false,
            disableCombineTextItems: false
        });
        
        // Group text items by their vertical position to maintain paragraph structure
        const textItems = textContent.items;
        const lines = groupTextItemsByLine(textItems);
        
        // Process each line
        for (const line of lines) {
            if (line.text.trim()) {
                fullText += line.text + '\n';
            }
        }
        
        // Add page separator
        fullText += '\n--- Page ' + i + ' ---\n\n';
    }
    
    return fullText;
}

function groupTextItemsByLine(textItems) {
    const lines = [];
    let currentLine = { text: '', items: [] };
    let lastY = null;
    const LINE_HEIGHT_THRESHOLD = 5; // Adjust this value based on your needs

    // Sort items by vertical position (top to bottom)
    textItems.sort((a, b) => b.transform[5] - a.transform[5]);

    textItems.forEach(item => {
        const y = Math.round(item.transform[5]);
        
        if (lastY === null) {
            lastY = y;
        }

        // If Y position changes significantly, start a new line
        if (Math.abs(y - lastY) > LINE_HEIGHT_THRESHOLD) {
            if (currentLine.text.trim()) {
                lines.push(currentLine);
            }
            currentLine = { text: '', items: [], y };
            lastY = y;
        }

        // Add space between items on the same line if they're not adjacent
        if (currentLine.items.length > 0) {
            const lastItem = currentLine.items[currentLine.items.length - 1];
            const lastX = lastItem.transform[4] + lastItem.width;
            const currentX = item.transform[4];
            
            if (currentX - lastX > 5) { // Add space if items are not adjacent
                currentLine.text += ' ';
            }
        }

        currentLine.text += item.str;
        currentLine.items.push(item);
    });

    // Add the last line
    if (currentLine.text.trim()) {
        lines.push(currentLine);
    }

    return lines;
}

module.exports = {
    extractTextFromPdf
}; 
