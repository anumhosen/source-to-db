const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Window controls
    minimizeWindow: () => ipcRenderer.send('window:minimize'),
    maximizeWindow: () => ipcRenderer.send('window:maximize'),
    unmaximizeWindow: () => ipcRenderer.send('window:unmaximize'),
    closeWindow: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximizeChange: (callback) => {
        const handler = (event, isMaximized) => callback(isMaximized);
        ipcRenderer.on('window:maximizeChange', handler);
        return () => ipcRenderer.removeListener('window:maximizeChange', handler);
    },

    // Database
    selectDatabase: () => ipcRenderer.invoke('db:select'),
    createDatabase: () => ipcRenderer.invoke('db:create'),
    getRecentDatabases: () => ipcRenderer.invoke('db:getRecent'),
    openDatabase: (path) => ipcRenderer.invoke('db:open', path),
    getRepos: () => ipcRenderer.invoke('db:getRepos'),
    getCurrentDbPath: () => ipcRenderer.invoke('db:getCurrentPath'),

    // Repositories
    addLocalRepo: () => ipcRenderer.invoke('repo:addLocal'),
    addGitRepo: (url) => ipcRenderer.invoke('repo:addGit', url),
    deleteRepo: (id) => ipcRenderer.invoke('repo:delete', id),

    // Files
    getFilesForRepo: (repoId) => ipcRenderer.invoke('repo:files', repoId),
    getFileContent: (fileId) => ipcRenderer.invoke('file:content', fileId),
    updateFile: (fileId, fields) => ipcRenderer.invoke('file:update', fileId, fields),
    getAllFilesContent: (repoId) => ipcRenderer.invoke('repo:allFileContents', repoId),

    // AI
    generateAI: (fileId) => ipcRenderer.invoke('ai:generate', fileId),
    generateAIForRepo: (repoId) => ipcRenderer.invoke('ai:generateAllForRepo', repoId),
    onAIProgress: (callback) => {
        const handler = (event, data) => callback(data);
        ipcRenderer.on('ai:progress', handler);
        return () => ipcRenderer.removeListener('ai:progress', handler);
    },

    // Export
    exportFiles: (repoId, fileIds) => ipcRenderer.invoke('repo:export', repoId, fileIds),

    // Settings
    setApiKey: (apiKey) => ipcRenderer.invoke('settings:setApiKey'),
});
