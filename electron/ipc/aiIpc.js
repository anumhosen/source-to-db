const { ipcMain, BrowserWindow } = require('electron');

function registerAiIpc(state) {
    // Generate AI for single file
    ipcMain.handle('ai:generate', async (event, fileId) => {
        if (!state.db) throw new Error('No database open');
        if (!state.geminiService) throw new Error('Gemini API not configured');

        const source = state.db.getSource(fileId);
        if (!source) throw new Error('Source not found');

        try {
            const doc = await state.geminiService.generateDocumentation(
                source.filepath,
                source.filetype,
                source.code,
            );

            if (doc) {
                state.db.updateSource(fileId, doc);
            }

            return state.db.getSource(fileId);
        } catch (error) {
            console.error('AI generation failed:', error);
            throw new Error(`AI generation failed: ${error.message}`);
        }
    });

    // Generate AI for all files in repository
    ipcMain.handle('ai:generateAllForRepo', async (event, repoId) => {
        if (!state.db) throw new Error('No database open');
        if (!state.geminiService) throw new Error('Gemini API not configured');

        const sources = state.db.db
            .prepare('SELECT * FROM sources WHERE repo_id = ? AND header IS NULL')
            .all(repoId);

        if (sources.length === 0) {
            return { processed: 0, total: 0 };
        }

        let processed = 0;
        const total = sources.length;

        for (const source of sources) {
            // Send progress to renderer
            const windows = BrowserWindow.getAllWindows();
            if (windows.length > 0) {
                windows[0].webContents.send('ai:progress', {
                    repoId,
                    fileId: source.id,
                    fileName: source.filename,
                    processed: processed + 1,
                    total,
                });
            }

            try {
                const doc = await state.geminiService.generateDocumentation(
                    source.filepath,
                    source.filetype,
                    source.code,
                );

                if (doc) {
                    state.db.updateSource(source.id, doc);
                }
            } catch (error) {
                console.error(`AI failed for ${source.filename}:`, error.message);
                // Continue with next file
            }

            processed++;
        }

        return { processed, total };
    });
}

module.exports = { registerAiIpc };
