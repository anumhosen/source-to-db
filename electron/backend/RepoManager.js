const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const { walkDirectory, isTextFile, sanitizeForXml } = require('./utils/fileUtils');
const AppDatabase = require('./Database');

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
];

class RepoManager {
    constructor(database) {
        this.db = database;
    }

    /**
     * Import a local folder as a repository.
     * @param {string} folderPath absolute path
     * @returns {number} repoId
     */
    async addLocalRepo(folderPath) {
        const name = path.basename(folderPath);
        const repoPath = folderPath; // absolute local path
        const version = 'local';
        const source = 'local';

        const repoId = this.db.addRepository(name, repoPath, version, source);
        await this._ingestFiles(repoId, folderPath, version);
        return repoId;
    }

    /**
     * Clone a git repository and import all text files.
     * @param {string} remoteUrl e.g. https://github.com/user/repo.git
     * @param {string} cacheDir base directory where repos are stored
     * @returns {number} repoId
     */
    async addGitRepo(remoteUrl, cacheDir) {
        // Sanitize URL for folder name
        const name = remoteUrl.split('/').pop().replace('.git', '');
        const localDir = path.join(cacheDir, name);
        const git = simpleGit();

        if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
            await git.clone(remoteUrl, localDir, ['--depth', '1']);
        } else {
            // If already cloned, pull latest changes
            await git.cwd(localDir).pull();
        }

        // Get version info
        const gitRepo = simpleGit(localDir);
        const commitHash = await gitRepo.revparse(['HEAD']);
        const branch = await gitRepo.revparse(['--abbrev-ref', 'HEAD']);
        const version = `${branch.trim()} (${commitHash.trim().substring(0, 7)})`;

        const repoId = this.db.addRepository(name, remoteUrl, version, 'git');
        await this._ingestFiles(repoId, localDir, version);
        return repoId;
    }

    /**
     * Walk a directory and insert all text files into the DB.
     */
    async _ingestFiles(repoId, rootDir, version) {
        const files = walkDirectory(rootDir, DEFAULT_IGNORE);
        const sourcesToInsert = [];

        for (const filePath of files) {
            if (!isTextFile(filePath)) continue;
            const rawCode = fs.readFileSync(filePath, 'utf8');
            const code = sanitizeForXml(rawCode); // Clean before insert
            const relPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
            const filename = path.basename(filePath);
            const filetype = path.extname(filename).replace('.', '').toLowerCase();

            sourcesToInsert.push({
                repo_id: repoId,
                version,
                filename,
                filetype,
                filepath: relPath,
                code,
                header: null,
                explanation: null,
                footnote: null,
            });
        }

        // Insert all sources in a single transaction
        this.db.addSourcesBatch(sourcesToInsert);
    }

    /**
     * Export selected files from the DB to a directory on disk.
     */
    exportFiles(repoId, outputDir, fileIds = null) {
        let sources;
        if (fileIds && fileIds.length > 0) {
            sources = this.db.getSourcesByIds(fileIds);
        } else {
            // All files of this repo
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
