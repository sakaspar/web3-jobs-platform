const { spawn } = require('child_process');

/**
 * Calls tgpt CLI with a prompt and input text, returns the output as a Promise.
 * @param {string} prompt - The prompt/question to ask tgpt.
 * @param {string} inputText - The resume or input text to send to tgpt.
 * @returns {Promise<string>} - The output from tgpt.
 */
async function callTgpt(prompt, inputText) {
    return new Promise((resolve, reject) => {
        // Compose the full prompt
        const fullPrompt = `${prompt}\n\n${inputText}`;
        // Call tgpt with the prompt as a single argument (no flags)
        const tgpt = spawn('tgpt', [fullPrompt], {
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let output = '';
        let error = '';

        tgpt.stdout.on('data', (data) => {
            output += data.toString();
        });
        tgpt.stderr.on('data', (data) => {
            error += data.toString();
        });
        tgpt.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(new Error(`tgpt exited with code ${code}: ${error}`));
            }
        });
    });
}

module.exports = { callTgpt }; 