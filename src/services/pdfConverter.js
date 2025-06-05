const pdfjsLib = require('pdfjs-dist');
const path = require('path');

// Suppress PDF.js warnings
const originalConsoleWarn = console.warn;
console.warn = function(msg) {
    if (msg.includes('TT: undefined function')) {
        return; // Suppress TrueType font warnings
    }
    originalConsoleWarn.apply(console, arguments);
};

class PdfConverter {
    constructor() {
        // Set up the worker source
        const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.entry');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

        // Configure PDF.js to be more lenient with font handling
        pdfjsLib.StandardFontDataFactory = {
            fetch: async (fontName) => {
                try {
                    // Try to load from standard fonts first
                    const fontPath = path.join(__dirname, '../../node_modules/pdfjs-dist/standard_fonts/', fontName);
                    const response = await fetch(fontPath);
                    if (response.ok) {
                        return await response.arrayBuffer();
                    }
                } catch (error) {
                    // If standard font loading fails, return null to use fallback fonts
                    return null;
                }
            }
        };
    }

    async convertToHtml(pdfBuffer) {
        try {
            // Load the PDF document with more lenient options
            const loadingTask = pdfjsLib.getDocument({ 
                data: pdfBuffer,
                standardFontDataUrl: path.join(__dirname, '../../node_modules/pdfjs-dist/standard_fonts/'),
                cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true,
                disableFontFace: true, // Disable custom font loading
                useSystemFonts: true, // Use system fonts as fallback
                standardFontDataUrl: path.join(__dirname, '../../node_modules/pdfjs-dist/standard_fonts/')
            });
            
            const pdf = await loadingTask.promise;
            let htmlContent = this.getHtmlHeader();
            
            // Process each page
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent({
                    normalizeWhitespace: true,
                    disableCombineTextItems: false
                });
                
                htmlContent += `<div class="page" id="page-${i}">\n`;
                
                // Group text items by their vertical position to maintain paragraph structure
                const textItems = textContent.items;
                const lines = this.groupTextItemsByLine(textItems);
                
                // Process each line
                for (const line of lines) {
                    if (line.text.trim()) {
                        htmlContent += this.formatTextLine(line);
                    }
                }
                
                htmlContent += '</div>\n';
            }

            htmlContent += this.getHtmlFooter();
            return htmlContent;
        } catch (error) {
            console.error('Error converting PDF to HTML:', error);
            throw error;
        }
    }

    groupTextItemsByLine(textItems) {
        const lines = [];
        let currentLine = { text: '', items: [] };
        let lastY = null;

        textItems.forEach(item => {
            const y = Math.round(item.transform[5]);
            
            if (lastY === null) {
                lastY = y;
            }

            // If Y position changes significantly, start a new line
            if (Math.abs(y - lastY) > 5) {
                if (currentLine.text.trim()) {
                    lines.push(currentLine);
                }
                currentLine = { text: '', items: [], y };
                lastY = y;
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

    formatTextLine(line) {
        const firstItem = line.items[0];
        const fontSize = Math.round(firstItem.height);
        const isBold = firstItem.fontName.toLowerCase().includes('bold');
        
        // Determine if this might be a heading based on font size and position
        const isHeading = fontSize > 12 || line.text.length < 50;
        
        let style = `style="position: absolute; left: ${firstItem.transform[4]}px; top: ${firstItem.transform[5]}px;`;
        style += ` font-size: ${fontSize}px;`;
        if (isBold) style += ' font-weight: bold;';
        style += '"';
        
        const tag = isHeading ? 'h2' : 'p';
        return `<${tag} ${style}>${line.text}</${tag}>\n`;
    }

    getHtmlHeader() {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resume</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
        }
        .page {
            position: relative;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #ccc;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            background: white;
        }
        h2 {
            color: #2c3e50;
            margin-top: 0;
        }
        p {
            margin: 5px 0;
        }
    </style>
</head>
<body>`;
    }

    getHtmlFooter() {
        return `</body>
</html>`;
    }
}

module.exports = new PdfConverter(); 