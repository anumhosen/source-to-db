const { registerDbIpc } = require('./dbIpc');
const { registerRepoIpc } = require('./repoIpc');
const { registerFileIpc } = require('./fileIpc');
const { registerAiIpc } = require('./aiIpc');
const { registerSettingsIpc } = require('./settingsIpc');
const { registerWindowIpc } = require('./windowIpc');

// Global state shared across all IPC modules
const state = {
  db: null,
  repoManager: null,
  geminiService: null,
  geminiApiKey: null,
  mainWindow: null,
};

function registerAllIpc() {
  // Capture main window reference
  const { BrowserWindow } = require('electron');
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    state.mainWindow = windows[0];
  }

  // Register all IPC handlers
  registerWindowIpc(state);
  registerDbIpc(state);
  registerRepoIpc(state);
  registerFileIpc(state);
  registerAiIpc(state);
  registerSettingsIpc(state);

  console.log('All IPC handlers registered successfully');
}

module.exports = { registerAllIpc, state };
