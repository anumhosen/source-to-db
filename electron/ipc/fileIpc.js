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
}

module.exports = { registerFileIpc };
