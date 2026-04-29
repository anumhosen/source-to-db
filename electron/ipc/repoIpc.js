const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const REPOS_CACHE_DIR = path.join(require('electron').app.getPath('userData'), 'cached_repos');

function registerRepoIpc(state) {
    // Add local repository
    ipcMain.handle('repo:addLocal', async () => {
        if (!state.db || !state.repoManager) {
            throw new Error('No database open');
        }

        const result = await dialog.showOpenDialog({
            title: 'Select Local Repository Folder',
            properties: ['openDirectory'],
        });

        if (result.canceled || result.filePaths.length === 0) return null;

        const folderPath = result.filePaths[0];
        const repoId = await state.repoManager.addLocalRepo(folderPath);
        return state.db.getRepository(repoId);
    });

    // Add git repository
    ipcMain.handle('repo:addGit', async (event, remoteUrl) => {
        if (!state.db || !state.repoManager) {
            throw new Error('No database open');
        }

        if (!remoteUrl || typeof remoteUrl !== 'string') {
            throw new Error('Invalid Git URL');
        }

        // Ensure cache directory exists
        if (!fs.existsSync(REPOS_CACHE_DIR)) {
            fs.mkdirSync(REPOS_CACHE_DIR, { recursive: true });
        }

        const repoId = await state.repoManager.addGitRepo(remoteUrl, REPOS_CACHE_DIR);
        return state.db.getRepository(repoId);
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

    // Get all file contents for repository
    ipcMain.handle('repo:allFileContents', async (event, repoId) => {
        if (!state.db) throw new Error('No database open');
        const sources = state.db.getSourcesByRepo(repoId);
        const fullSources = [];
        for (const src of sources) {
            fullSources.push(state.db.getSource(src.id));
        }
        return fullSources;
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
