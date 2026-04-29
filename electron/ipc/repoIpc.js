const { ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const REPOS_CACHE_DIR = path.join(require('electron').app.getPath('userData'), 'cached_repos');

function registerRepoIpc(state) {
  // Select folder dialog
  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select Repository Folder',
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) return null;

    return { path: result.filePaths[0] };
  });

  // Get folder info (detect version, language, etc.)
  ipcMain.handle('repo:getFolderInfo', async (event, folderPath) => {
    try {
      const info = {
        fileCount: 0,
        hasPackageJson: false,
        hasGit: false,
        language: null,
        suggestedVersion: null,
      };

      // Check for package.json
      const packageJsonPath = path.join(folderPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        info.hasPackageJson = true;
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          if (packageJson.version) {
            info.suggestedVersion = packageJson.version;
          }
          info.language = 'JavaScript/TypeScript';
        } catch (e) {}
      }

      // Check for setup.py
      const setupPyPath = path.join(folderPath, 'setup.py');
      if (fs.existsSync(setupPyPath)) {
        info.language = 'Python';
        try {
          const content = fs.readFileSync(setupPyPath, 'utf8');
          const versionMatch = content.match(/version\s*=\s*['"]([^'"]+)['"]/);
          if (versionMatch && !info.suggestedVersion) {
            info.suggestedVersion = versionMatch[1];
          }
        } catch (e) {}
      }

      // Check for Cargo.toml
      const cargoPath = path.join(folderPath, 'Cargo.toml');
      if (fs.existsSync(cargoPath)) {
        info.language = 'Rust';
        try {
          const content = fs.readFileSync(cargoPath, 'utf8');
          const versionMatch = content.match(/version\s*=\s*['"]([^'"]+)['"]/);
          if (versionMatch && !info.suggestedVersion) {
            info.suggestedVersion = versionMatch[1];
          }
        } catch (e) {}
      }

      // Check for .git
      const gitPath = path.join(folderPath, '.git');
      if (fs.existsSync(gitPath)) {
        info.hasGit = true;
      }

      // Count files (quick, limited to top level)
      try {
        const entries = fs.readdirSync(folderPath, { withFileTypes: true });
        info.fileCount = entries.length;
      } catch (e) {}

      return info;
    } catch (error) {
      console.error('Failed to get folder info:', error);
      return null;
    }
  });

  // Add local repository
  ipcMain.handle('repo:addLocal', async (event, folderPath, version) => {
    console.log('IPC: repo:addLocal called', { folderPath, version });

    if (!state.db || !state.repoManager) {
      console.error('IPC Error: No database or repoManager');
      throw new Error('No database open');
    }

    // If folderPath is provided directly, use it; otherwise show dialog
    let finalPath = folderPath;
    let finalVersion = version;

    if (!finalPath) {
      // Show folder dialog
      const result = await dialog.showOpenDialog({
        title: 'Select Local Repository Folder',
        properties: ['openDirectory'],
      });

      if (result.canceled || result.filePaths.length === 0) return null;
      finalPath = result.filePaths[0];
    }

    if (!finalVersion) {
      finalVersion = 'local';
    }

    console.log('Adding local repo:', finalPath, 'version:', finalVersion);

    try {
      const repoId = await state.repoManager.addLocalRepo(finalPath, finalVersion);
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
