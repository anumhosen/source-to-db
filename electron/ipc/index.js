const { registerDbIpc } = require('./dbIpc');
const { registerRepoIpc } = require('./repoIpc');
const { registerFileIpc } = require('./fileIpc');
const { registerAiIpc } = require('./aiIpc');
const { registerSettingsIpc } = require('./settingsIpc');
const { registerLLMIpc } = require('./llmIpc');
const { registerWindowIpc } = require('./windowIpc');
const LocalLLMService = require('../backend/LocalLLMService');

const state = { db: null, repoManager: null, llmService: null, mainWindow: null };

function registerAllIpc() {
  // Initialize LLM Service
  state.llmService = new LocalLLMService();

  const { BrowserWindow } = require('electron');
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    state.mainWindow = windows[0];
  }

  // Register ALL IPC handlers - including settings
  registerWindowIpc(state);
  registerDbIpc(state);
  registerRepoIpc(state);
  registerFileIpc(state);
  registerAiIpc(state);
  registerSettingsIpc(state); // <-- This was missing!
  registerLLMIpc(state);

  console.log('✓ All IPC handlers registered');
}

module.exports = { registerAllIpc, state };
