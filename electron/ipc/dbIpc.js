const { ipcMain, dialog, app } = require('electron');
const path = require('path');
const fs = require('fs');
const AppDatabase = require('../backend/Database');
const RepoManager = require('../backend/RepoManager');

const RECENT_DBS_FILE = path.join(app.getPath('userData'), 'recent_databases.json');

function getRecentDatabases() {
    try {
        if (fs.existsSync(RECENT_DBS_FILE)) {
            const data = fs.readFileSync(RECENT_DBS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Failed to read recent databases:', e);
    }
    return [];
}

function saveRecentDatabases(dbs) {
    try {
        fs.writeFileSync(RECENT_DBS_FILE, JSON.stringify(dbs, null, 2));
    } catch (e) {
        console.error('Failed to save recent databases:', e);
    }
}

function openDatabase(dbPath, state) {
    try {
        // Close existing database connection if any
        if (state.db) {
            state.db.close();
        }

        // Create new database connection
        state.db = new AppDatabase(dbPath);
        state.repoManager = new RepoManager(state.db);

        // Initialize Gemini if API key exists
        if (state.geminiApiKey) {
            state.geminiService = new GeminiService(state.geminiApiKey);
        }

        // Update recent databases list
        const recent = getRecentDatabases();
        const updated = [
            {
                path: dbPath,
                name: path.basename(dbPath, '.db'),
                timestamp: new Date().toISOString(),
            },
            ...recent.filter((r) => r.path !== dbPath),
        ].slice(0, 10);

        saveRecentDatabases(updated);

        return { path: dbPath, name: path.basename(dbPath, '.db'), success: true };
    } catch (error) {
        console.error('Failed to open database:', error);
        throw new Error(`Failed to open database: ${error.message}`);
    }
}

function registerDbIpc(state) {
    // Get recent databases list
    ipcMain.handle('db:getRecent', () => {
        return getRecentDatabases();
    });

    // Create new database
    ipcMain.handle('db:create', async () => {
        const result = await dialog.showSaveDialog({
            title: 'Create New Database',
            defaultPath: 'repodocs.db',
            filters: [{ name: 'SQLite Database', extensions: ['db'] }],
        });

        if (result.canceled) return null;

        const dbPath = result.filePath;

        try {
            // Create new empty database
            const newDb = new AppDatabase(dbPath);
            newDb.close();
        } catch (error) {
            console.error('Failed to create database:', error);
            throw new Error(`Failed to create database: ${error.message}`);
        }

        // Open the newly created database
        return openDatabase(dbPath, state);
    });

    // Select existing database file
    ipcMain.handle('db:select', async () => {
        const result = await dialog.showOpenDialog({
            title: 'Open Database',
            filters: [{ name: 'SQLite Database', extensions: ['db'] }],
            properties: ['openFile'],
        });

        if (result.canceled || result.filePaths.length === 0) return null;

        return openDatabase(result.filePaths[0], state);
    });

    // Open database by path
    ipcMain.handle('db:open', async (event, dbPath) => {
        if (!fs.existsSync(dbPath)) {
            throw new Error('Database file not found');
        }
        return openDatabase(dbPath, state);
    });

    // Get all repositories
    ipcMain.handle('db:getRepos', () => {
        if (!state.db) throw new Error('No database open');
        return state.db.listRepositories();
    });

    // Get current database path
    ipcMain.handle('db:getCurrentPath', () => {
        return state.db ? state.db.dbPath : null;
    });
}

module.exports = { registerDbIpc };
