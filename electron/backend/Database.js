const Database = require('better-sqlite3');
const path = require('path');

class AppDatabase {
    constructor(dbPath) {
        this.db = new Database(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        this.initSchema();
    }

    initSchema() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS repositories (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        repo       TEXT NOT NULL,
        version    TEXT NOT NULL,
        source     TEXT NOT NULL CHECK(source IN ('git','local')),
        timestamp  TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS sources (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_id     INTEGER NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        version     TEXT,
        filename    TEXT NOT NULL,
        filetype    TEXT,
        filepath    TEXT NOT NULL,
        code        TEXT NOT NULL,
        header      TEXT,
        explanation TEXT,
        footnote    TEXT,
        timestamp   TEXT DEFAULT (datetime('now'))
      );
    `);
    }

    // --- Repository methods ---
    addRepository(name, repo, version, source) {
        const stmt = this.db.prepare(
            'INSERT INTO repositories (name, repo, version, source) VALUES (?, ?, ?, ?)',
        );
        const info = stmt.run(name, repo, version, source);
        return info.lastInsertRowid;
    }

    getRepository(id) {
        return this.db.prepare('SELECT * FROM repositories WHERE id = ?').get(id);
    }

    listRepositories() {
        return this.db.prepare('SELECT * FROM repositories ORDER BY timestamp DESC').all();
    }

    deleteRepository(id) {
        this.db.prepare('DELETE FROM repositories WHERE id = ?').run(id);
        // CASCADE deletes related sources automatically
    }

    // --- Source methods ---
    addSourcesBatch(sources) {
        const insert = this.db.prepare(`
      INSERT INTO sources 
        (repo_id, version, filename, filetype, filepath, code, header, explanation, footnote)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const transaction = this.db.transaction((rows) => {
            for (const s of rows) {
                insert.run(
                    s.repo_id,
                    s.version,
                    s.filename,
                    s.filetype,
                    s.filepath,
                    s.code,
                    s.header,
                    s.explanation,
                    s.footnote,
                );
            }
        });
        transaction(sources);
    }

    getSourcesByRepo(repoId) {
        return this.db
            .prepare(
                'SELECT id, filepath, filename, filetype FROM sources WHERE repo_id = ? ORDER BY filepath',
            )
            .all(repoId);
    }

    getSource(id) {
        return this.db.prepare('SELECT * FROM sources WHERE id = ?').get(id);
    }

    updateSource(id, { code, header, explanation, footnote }) {
        const fields = [];
        const params = [];
        if (code !== undefined) {
            fields.push('code = ?');
            params.push(code);
        }
        if (header !== undefined) {
            fields.push('header = ?');
            params.push(header);
        }
        if (explanation !== undefined) {
            fields.push('explanation = ?');
            params.push(explanation);
        }
        if (footnote !== undefined) {
            fields.push('footnote = ?');
            params.push(footnote);
        }
        if (fields.length === 0) return;
        params.push(id);
        this.db.prepare(`UPDATE sources SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    }

    getSourcesByIds(ids) {
        if (!ids.length) return [];
        const placeholders = ids.map(() => '?').join(',');
        return this.db.prepare(`SELECT * FROM sources WHERE id IN (${placeholders})`).all(...ids);
    }

    close() {
        this.db.close();
    }
}

module.exports = AppDatabase;
