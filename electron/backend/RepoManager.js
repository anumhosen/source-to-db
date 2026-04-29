const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const { walkDirectory, isTextFile } = require('./utils/fileUtils');

const DEFAULT_IGNORE = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  '__pycache__',
  '.next',
  'dist',
  'build',
  '.venv',
  'venv',
  'target',
  '.DS_Store',
  'Thumbs.db',
  '.idea',
  '.vscode',
];

class RepoManager {
  constructor(database) {
    this.db = database;
  }

  /**
   * Import a local folder as a repository
   */
  async addLocalRepo(folderPath, version = 'local') {
    console.log('RepoManager: Adding local repo from', folderPath);

    const name = path.basename(folderPath);
    const source = 'local';

    const repoId = this.db.addRepository(name, folderPath, version, source);
    console.log('Repository created with ID:', repoId);

    await this._ingestFiles(repoId, folderPath, version);

    return repoId;
  }

  /**
   * Clone a git repository and import all text files.
   */
  async addGitRepo(remoteUrl, cacheDir) {
    console.log('RepoManager: Adding git repo from', remoteUrl);
    console.log('Cache directory:', cacheDir);

    // Sanitize URL for folder name
    const name = remoteUrl
      .split('/')
      .pop()
      .replace('.git', '')
      .replace(/[^a-zA-Z0-9-_]/g, '_');

    const localDir = path.join(cacheDir, name);
    console.log('Local directory:', localDir);

    const git = simpleGit();

    try {
      // Check if already cloned
      if (fs.existsSync(localDir) && fs.existsSync(path.join(localDir, '.git'))) {
        console.log('Repository already exists, pulling latest...');

        try {
          await git.cwd(localDir).pull(['--ff-only']);
          console.log('Pull successful');
        } catch (pullError) {
          console.warn('Pull failed, using existing clone:', pullError.message);
          // Continue with existing clone
        }
      } else {
        console.log('Cloning repository...');

        // Remove directory if it exists but isn't a git repo
        if (fs.existsSync(localDir)) {
          fs.rmSync(localDir, { recursive: true, force: true });
        }

        // Clone with depth 1 for speed
        await git.clone(remoteUrl, localDir, ['--depth', '1', '--single-branch']);
        console.log('Clone successful');
      }

      // Get version info
      const gitRepo = simpleGit(localDir);
      let version = 'unknown';

      try {
        const commitHash = await gitRepo.revparse(['HEAD']);
        const branch = await gitRepo.revparse(['--abbrev-ref', 'HEAD']);
        version = `${branch.trim()} (${commitHash.trim().substring(0, 7)})`;
        console.log('Version:', version);
      } catch (versionError) {
        console.warn('Failed to get version info:', versionError.message);
        version = 'git';
      }

      // Create repository entry
      const repoId = this.db.addRepository(name, remoteUrl, version, 'git');
      console.log('Repository created with ID:', repoId);

      // Ingest files
      await this._ingestFiles(repoId, localDir, version);

      return repoId;
    } catch (error) {
      console.error('Git operation failed:', error);

      // Clean up failed clone
      if (fs.existsSync(localDir) && !fs.existsSync(path.join(localDir, '.git'))) {
        try {
          fs.rmSync(localDir, { recursive: true, force: true });
        } catch (cleanError) {
          console.warn('Cleanup failed:', cleanError.message);
        }
      }

      throw new Error(`Git clone failed: ${error.message}`);
    }
  }

  /**
   * Walk a directory and insert all text files into the DB.
   */
  async _ingestFiles(repoId, rootDir, version) {
    console.log('Ingesting files from:', rootDir);

    const files = walkDirectory(rootDir, DEFAULT_IGNORE);
    console.log(`Found ${files.length} total files (before text filter)`);

    const sourcesToInsert = [];
    let textFileCount = 0;
    let skippedCount = 0;

    for (const filePath of files) {
      try {
        if (!isTextFile(filePath)) {
          skippedCount++;
          continue;
        }

        const code = fs.readFileSync(filePath, 'utf8');
        const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
        const filename = path.basename(filePath);
        const ext = path.extname(filename).replace('.', '').toLowerCase();

        // Skip empty files
        if (!code.trim()) {
          skippedCount++;
          continue;
        }

        sourcesToInsert.push({
          repo_id: repoId,
          version,
          filename,
          filetype: ext || 'text',
          filepath: relPath,
          code,
          header: null,
          explanation: null,
          footnote: null,
        });

        textFileCount++;
      } catch (fileError) {
        console.warn(`Skipping file ${filePath}:`, fileError.message);
        skippedCount++;
      }
    }

    console.log(`Text files: ${textFileCount}, Skipped: ${skippedCount}`);

    if (sourcesToInsert.length > 0) {
      // Insert all sources in a single transaction
      this.db.addSourcesBatch(sourcesToInsert);
      console.log(`Inserted ${sourcesToInsert.length} files into database`);
    } else {
      console.warn('No text files found to import');
    }
  }

  /**
   * Export selected files from the DB to a directory on disk.
   */
  exportFiles(repoId, outputDir, fileIds = null) {
    let sources;
    if (fileIds && fileIds.length > 0) {
      sources = this.db.getSourcesByIds(fileIds);
    } else {
      const allIds = this.db.db
        .prepare('SELECT id FROM sources WHERE repo_id = ?')
        .all(repoId)
        .map((r) => r.id);
      sources = this.db.getSourcesByIds(allIds);
    }

    for (const src of sources) {
      const fullPath = path.join(outputDir, src.filepath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, src.code, 'utf8');
    }

    return sources.length;
  }
}

module.exports = RepoManager;
