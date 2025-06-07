const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const request = require('request');
const pdfConverter = require('./services/pdfConverter');
const pdfProfileExtractor = require('./services/pdfProfileExtractor');
const tgptService = require('./services/tgptService');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// LinkedIn OAuth configuration
const LINKEDIN_CLIENT_ID = '78wnefsdha87mx';
const LINKEDIN_CLIENT_SECRET = 'YOUR_CLIENT_SECRET'; // Replace with your actual client secret
const REDIRECT_URI = 'http://localhost:3000/auth/linkedin/callback';

// LinkedIn OAuth callback endpoint
app.get('/auth/linkedin/callback', (req, res) => {
    const { code } = req.query;
    
    // Exchange code for access token
    request.post({
        url: 'https://www.linkedin.com/oauth/v2/accessToken',
        form: {
            grant_type: 'authorization_code',
            code: code,
            client_id: LINKEDIN_CLIENT_ID,
            client_secret: LINKEDIN_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI
        }
    }, (err, response, body) => {
        if (err) {
            console.error('Error getting access token:', err);
            return res.redirect('/?error=auth_failed');
        }

        const { access_token } = JSON.parse(body);

        // Get user info using the access token
        request.get({
            url: 'https://api.linkedin.com/v2/userinfo',
            headers: { 'Authorization': `Bearer ${access_token}` }
        }, (err, response, body) => {
            if (err) {
                console.error('Error getting user info:', err);
                return res.redirect('/?error=user_info_failed');
            }

            const userInfo = JSON.parse(body);
            // Here you would typically:
            // 1. Save the user info to your database
            // 2. Create a session
            // 3. Redirect to the dashboard

            res.redirect('/?success=true');
        });
    });
});

// PDF to HTML conversion endpoint
app.post('/api/convert-pdf', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        // Convert Buffer to Uint8Array
        const pdfData = new Uint8Array(req.file.buffer);
        const htmlContent = await pdfConverter.convertToHtml(pdfData);
        console.log('--- PDF to HTML Output Start ---');
        console.log(htmlContent);
        console.log('--- PDF to HTML Output End ---');
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ error: 'Error processing PDF file' });
    }
});

// PDF to Profile extraction endpoint
app.post('/api/parse-profile', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }
        const pdfData = new Uint8Array(req.file.buffer);
        const text = await pdfProfileExtractor.extractTextFromPdf(pdfData);
        console.log('--- Extracted PDF Text Start ---');
        console.log(text);
        console.log('--- Extracted PDF Text End ---');

        // Prompt for tgpt
        const prompt = `Please extract the following resume text into a JSON object with fields: name, email, phone, experience (array of {title, company, duration, description}), education (array of {degree, institution, year}), and skills (array). Here is the text:`;
        const tgptJson = await tgptService.callTgpt(prompt, text);
        console.log('--- tgpt JSON Output Start ---');
        console.log(tgptJson);
        console.log('--- tgpt JSON Output End ---');
        res.json({ tgptJson });
    } catch (error) {
        console.error('Error extracting or processing text from PDF:', error);
        res.status(500).json({ error: 'Error extracting or processing text from PDF' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 