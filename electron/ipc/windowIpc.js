const { ipcMain, BrowserWindow } = require('electron');

function registerWindowIpc(state) {
    ipcMain.on('window:minimize', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) win.minimize();
    });

    ipcMain.on('window:maximize', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            win.maximize();
            win.webContents.send('window:maximizeChange', true);
        }
    });

    ipcMain.on('window:unmaximize', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            win.unmaximize();
            win.webContents.send('window:maximizeChange', false);
        }
    });

    ipcMain.on('window:close', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) win.close();
    });

    ipcMain.handle('window:isMaximized', () => {
        const win = BrowserWindow.getFocusedWindow();
        return win ? win.isMaximized() : false;
    });
}

module.exports = { registerWindowIpc };
