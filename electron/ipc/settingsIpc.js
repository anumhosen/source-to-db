const { ipcMain } = require('electron');
const GeminiService = require('../backend/GeminiService');

function registerSettingsIpc(state) {
    // Set Gemini API key
    ipcMain.handle('settings:setApiKey', async (event, apiKey) => {
        if (apiKey && typeof apiKey === 'string' && apiKey.trim()) {
            try {
                state.geminiService = new GeminiService(apiKey.trim());
                state.geminiApiKey = apiKey.trim();
                return true;
            } catch (error) {
                console.error('Failed to initialize Gemini:', error);
                throw new Error(`Failed to initialize Gemini: ${error.message}`);
            }
        }
        state.geminiService = null;
        state.geminiApiKey = null;
        return false;
    });

    // Get API key status
    ipcMain.handle('settings:getApiKeyStatus', () => {
        return { configured: !!state.geminiService, hasKey: !!state.geminiApiKey };
    });
}

module.exports = { registerSettingsIpc };
