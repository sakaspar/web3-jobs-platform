const pdfjsLib = require('pdfjs-dist');

async function extractTextFromPdf(pdfBuffer) {
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
}

function parseProfileFromText(text) {
    // Simple regex-based extraction (can be improved for more accuracy)
    const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
    const profile = {
        name: '',
        email: '',
        experience: [],
        education: []
    };

    // Name: Assume first non-empty line is the name
    if (lines.length > 0) profile.name = lines[0];

    // Email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) profile.email = emailMatch[0];

    // Experience (look for lines containing keywords)
    let expSection = false;
    let eduSection = false;
    let currentExp = null;
    let currentEdu = null;
    for (let line of lines) {
        if (/experience|work history|professional/i.test(line)) {
            expSection = true;
            eduSection = false;
            continue;
        }
        if (/education|diploma|degree/i.test(line)) {
            eduSection = true;
            expSection = false;
            continue;
        }
        if (expSection) {
            // Try to extract job title, company, and duration
            const expMatch = line.match(/(.+?) at (.+?) \((.+?)\)/i);
            if (expMatch) {
                if (currentExp) profile.experience.push(currentExp);
                currentExp = {
                    title: expMatch[1].trim(),
                    company: expMatch[2].trim(),
                    duration: expMatch[3].trim()
                };
            } else if (currentExp && line) {
                currentExp.description = (currentExp.description || '') + ' ' + line;
            }
        }
        if (eduSection) {
            // Try to extract degree, institution, and year
            const eduMatch = line.match(/(.+?), (.+?), (\d{4})/);
            if (eduMatch) {
                if (currentEdu) profile.education.push(currentEdu);
                currentEdu = {
                    degree: eduMatch[1].trim(),
                    institution: eduMatch[2].trim(),
                    year: eduMatch[3].trim()
                };
            } else if (currentEdu && line) {
                currentEdu.description = (currentEdu.description || '') + ' ' + line;
            }
        }
    }
    if (currentExp) profile.experience.push(currentExp);
    if (currentEdu) profile.education.push(currentEdu);

    return profile;
}

module.exports = {
    extractTextFromPdf,
    parseProfileFromText
}; 