const pdfjsLib = require('pdfjs-dist');
const fs = require('fs');

async function convertPdfToHtml(pdfPath, outputPath) {
    try {
        // Load the PDF file
        const data = new Uint8Array(fs.readFileSync(pdfPath));
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;
        
        let htmlContent = '<!DOCTYPE html>\n<html>\n<head>\n';
        htmlContent += '<meta charset="UTF-8">\n';
        htmlContent += '<style>\n';
        htmlContent += 'body { font-family: Arial, sans-serif; }\n';
        htmlContent += '.page { margin: 20px; padding: 20px; border: 1px solid #ccc; }\n';
        htmlContent += '</style>\n</head>\n<body>\n';

        // Process each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            htmlContent += `<div class="page" id="page-${i}">\n`;
            
            // Process text items
            const textItems = textContent.items;
            for (const item of textItems) {
                const text = item.str;
                if (text.trim()) {
                    htmlContent += `<p style="position: absolute; left: ${item.transform[4]}px; top: ${item.transform[5]}px;">${text}</p>\n`;
                }
            }
            
            htmlContent += '</div>\n';
        }

        htmlContent += '</body>\n</html>';

        // Write the HTML file
        fs.writeFileSync(outputPath, htmlContent);
        console.log(`PDF successfully converted to HTML. Output saved to: ${outputPath}`);
    } catch (error) {
        console.error('Error converting PDF to HTML:', error);
    }
}

// Example usage
const pdfPath = 'input.pdf';  // Replace with your PDF file path
const outputPath = 'output.html';  // Replace with desired output HTML file path

convertPdfToHtml(pdfPath, outputPath); 