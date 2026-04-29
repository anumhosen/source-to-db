const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const REPOS_CACHE_DIR = path.join(require('electron').app.getPath('userData'), 'cached_repos');

function registerRepoIpc(state) {
  // Add local repository
  ipcMain.handle('repo:addLocal', async () => {
    console.log('IPC: repo:addLocal called');

    if (!state.db || !state.repoManager) {
      console.error('IPC Error: No database or repoManager', {
        hasDb: !!state.db,
        hasRepoManager: !!state.repoManager,
      });
      throw new Error('No database open');
    }

    const result = await dialog.showOpenDialog({
      title: 'Select Local Repository Folder',
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      console.log('User canceled folder selection');
      return null;
    }

    const folderPath = result.filePaths[0];
    console.log('Adding local repo:', folderPath);

    try {
      const repoId = await state.repoManager.addLocalRepo(folderPath);
      console.log('Local repo added with ID:', repoId);
      return state.db.getRepository(repoId);
    } catch (error) {
      console.error('Failed to add local repo:', error);
      throw error;
    }
  });

  // Add git repository
  ipcMain.handle('repo:addGit', async (event, remoteUrl) => {
    console.log('IPC: repo:addGit called with URL:', remoteUrl);

    if (!state.db || !state.repoManager) {
      console.error('IPC Error: No database or repoManager', {
        hasDb: !!state.db,
        hasRepoManager: !!state.repoManager,
      });
      throw new Error('No database open');
    }

    if (!remoteUrl || typeof remoteUrl !== 'string' || !remoteUrl.trim()) {
      console.error('IPC Error: Invalid Git URL');
      throw new Error('Invalid Git URL');
    }

    // Ensure cache directory exists
    const cacheDir = REPOS_CACHE_DIR;
    console.log('Cache directory:', cacheDir);

    if (!fs.existsSync(cacheDir)) {
      console.log('Creating cache directory');
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    try {
      console.log('Cloning git repo...');
      const repoId = await state.repoManager.addGitRepo(remoteUrl.trim(), cacheDir);
      console.log('Git repo added with ID:', repoId);
      return state.db.getRepository(repoId);
    } catch (error) {
      console.error('Failed to add git repo:', error);
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  });

  // Delete repository
  ipcMain.handle('repo:delete', async (event, repoId) => {
    if (!state.db) throw new Error('No database open');
    state.db.deleteRepository(repoId);
    return true;
  });

  // Get files for repository
  ipcMain.handle('repo:files', async (event, repoId) => {
    if (!state.db) throw new Error('No database open');
    return state.db.getSourcesByRepo(repoId);
  });

  // Export files
  ipcMain.handle('repo:export', async (event, repoId, fileIds) => {
    if (!state.db || !state.repoManager) {
      throw new Error('No database open');
    }

    const result = await dialog.showOpenDialog({
      title: 'Select Export Destination',
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) return null;

    const outputDir = result.filePaths[0];
    const count = state.repoManager.exportFiles(repoId, outputDir, fileIds);
    return { exported: count, outputDir };
  });
}

module.exports = { registerRepoIpc };
