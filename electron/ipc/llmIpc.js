const { ipcMain, dialog, app, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const LocalLLMService = require('../backend/LocalLLMService');

function registerLLMIpc(state) {
  // Select and load a model
  ipcMain.handle('llm:selectModel', async () => {
    const modelsDir = path.join(app.getPath('userData'), 'models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    const result = await dialog.showOpenDialog({
      title: 'Select GGUF Model File',
      filters: [
        { name: 'GGUF Model', extensions: ['gguf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      defaultPath: modelsDir,
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) return null;

    const modelPath = result.filePaths[0];
    console.log('Selected model:', modelPath);

    try {
      // Create new service instance with the selected model
      state.llmService = new LocalLLMService({ modelPath, context: 4096, threads: 4 });

      const success = await state.llmService.initialize();

      if (success) {
        console.log('Model loaded successfully');
        return { path: modelPath, name: path.basename(modelPath, '.gguf'), success: true };
      }

      return { success: false, error: 'Failed to load model' };
    } catch (error) {
      console.error('Model loading error:', error);
      return { success: false, error: error.message };
    }
  });

  // Get LLM status
  ipcMain.handle('llm:getStatus', () => {
    return {
      initialized: state.llmService?.initialized || false,
      modelName: state.llmService?.modelName || null,
    };
  });

  // Test the model with a simple prompt
  ipcMain.handle('llm:test', async () => {
    if (!state.llmService?.initialized) {
      return { success: false, error: 'No model loaded' };
    }

    try {
      const response = await state.llmService.testPrompt('Say "Hello World"');
      return { success: true, response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get installed models
  ipcMain.handle('llm:getModels', () => {
    return LocalLLMService.getAvailableModels();
  });

  // Get recommended models
  ipcMain.handle('llm:getRecommendedModels', () => {
    return LocalLLMService.getRecommendedModels();
  });

  // Open models folder
  ipcMain.handle('llm:openModelsFolder', () => {
    const modelsDir = path.join(app.getPath('userData'), 'models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }
    shell.openPath(modelsDir);
    return true;
  });

  // Unload model
  ipcMain.handle('llm:unloadModel', () => {
    if (state.llmService) {
      state.llmService = new LocalLLMService();
    }
    return true;
  });
}

module.exports = { registerLLMIpc };
