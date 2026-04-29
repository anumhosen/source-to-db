// electron/preload.js
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
  addLocalRepo: (folderPath, version) => ipcRenderer.invoke('repo:addLocal', folderPath, version),
  addGitRepo: (url) => ipcRenderer.invoke('repo:addGit', url),
  deleteRepo: (id) => ipcRenderer.invoke('repo:delete', id),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  getFolderInfo: (folderPath) => ipcRenderer.invoke('repo:getFolderInfo', folderPath),

  // Files
  getFilesForRepo: (repoId) => ipcRenderer.invoke('repo:files', repoId),
  getFileContent: (fileId) => ipcRenderer.invoke('file:content', fileId),
  updateFile: (fileId, fields) => ipcRenderer.invoke('file:update', fileId, fields),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),

  // AI (Local LLM only)
  generateAI: (fileId) => ipcRenderer.invoke('ai:generate', fileId),
  generateAIForRepo: (repoId) => ipcRenderer.invoke('ai:generateAllForRepo', repoId),
  onAIProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('ai:progress', handler);
    return () => ipcRenderer.removeListener('ai:progress', handler);
  },

  // LLM
  selectModel: () => ipcRenderer.invoke('llm:selectModel'),
  getModels: () => ipcRenderer.invoke('llm:getModels'),
  getRecommendedModels: () => ipcRenderer.invoke('llm:getRecommendedModels'),
  getLLMStatus: () => ipcRenderer.invoke('llm:getStatus'),
  openModelsFolder: () => ipcRenderer.invoke('llm:openModelsFolder'),
  unloadModel: () => ipcRenderer.invoke('llm:unloadModel'),
  testLLM: () => ipcRenderer.invoke('llm:test'),

  // Export
  exportFiles: (repoId, fileIds) => ipcRenderer.invoke('repo:export', repoId, fileIds),

  // Settings
  getSettingsStatus: () => ipcRenderer.invoke('settings:getStatus'),
});
