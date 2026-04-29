const { ipcMain } = require('electron');

function registerFileIpc(state) {
  // Get file content
  ipcMain.handle('file:content', async (event, fileId) => {
    if (!state.db) throw new Error('No database open');

    const source = state.db.getSource(fileId);
    if (!source) throw new Error('File not found');

    return source;
  });

  // Update file content
  ipcMain.handle('file:update', async (event, fileId, fields) => {
    if (!state.db) throw new Error('No database open');

    state.db.updateSource(fileId, fields);
    return state.db.getSource(fileId);
  });

  // Save file dialog
  ipcMain.handle('dialog:saveFile', async (event, options) => {
    const result = await dialog.showSaveDialog({
      title: 'Save Documentation',
      defaultPath: options.defaultName || 'documentation.md',
      filters: options.filters || [{ name: 'Markdown', extensions: ['md'] }],
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    try {
      fs.writeFileSync(result.filePath, options.content, 'utf8');
      return { success: true, path: result.filePath };
    } catch (error) {
      console.error('Failed to save file:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerFileIpc };
