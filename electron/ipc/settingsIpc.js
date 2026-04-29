// electron/ipc/settingsIpc.js (minimal)
const { ipcMain } = require('electron');

function registerSettingsIpc(state) {
  ipcMain.handle('settings:getStatus', () => {
    return {
      database: !!state.db,
      modelLoaded: state.llmService?.initialized || false,
      modelName: state.llmService?.modelName || null,
    };
  });
}

module.exports = { registerSettingsIpc };
