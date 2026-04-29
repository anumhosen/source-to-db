const { ipcMain, BrowserWindow } = require('electron');

function registerAiIpc(state) {
  // Generate AI for single file
  ipcMain.handle('ai:generate', async (event, fileId) => {
    if (!state.db) throw new Error('No database open');
    if (!state.llmService || !state.llmService.initialized) {
      throw new Error('No AI model loaded. Please load a model in Settings first.');
    }

    const source = state.db.getSource(fileId);
    if (!source) throw new Error('Source not found');

    try {
      console.log(`Generating AI for: ${source.filename}`);

      const doc = await state.llmService.generateDocumentation(
        source.filepath,
        source.filetype,
        source.code,
      );

      if (doc && (doc.header || doc.explanation || doc.footnote)) {
        state.db.updateSource(fileId, doc);
        console.log(`✓ AI generated for: ${source.filename}`);
      } else {
        console.warn(`⚠ Empty AI response for: ${source.filename}`);
        // Save empty placeholder so we don't retry
        state.db.updateSource(fileId, {
          header: source.header || 'No title',
          explanation: source.explanation || 'AI could not generate explanation for this file.',
          footnote: source.footnote || '',
        });
      }

      return state.db.getSource(fileId);
    } catch (error) {
      console.error('AI generation failed:', error);
      // Don't throw, return current state
      return state.db.getSource(fileId);
    }
  });

  // Generate AI for all files
  ipcMain.handle('ai:generateAllForRepo', async (event, repoId) => {
    if (!state.db) throw new Error('No database open');
    if (!state.llmService || !state.llmService.initialized) {
      throw new Error('No AI model loaded');
    }

    const sources = state.db.db
      .prepare('SELECT * FROM sources WHERE repo_id = ? AND header IS NULL')
      .all(repoId);

    if (sources.length === 0) {
      return { processed: 0, total: 0 };
    }

    let processed = 0;
    const total = sources.length;

    for (const source of sources) {
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
        const doc = await state.llmService.generateDocumentation(
          source.filepath,
          source.filetype,
          source.code,
        );

        if (doc && (doc.header || doc.explanation || doc.footnote)) {
          state.db.updateSource(source.id, doc);
        } else {
          state.db.updateSource(source.id, {
            header: source.filename,
            explanation: 'No explanation generated',
            footnote: '',
          });
        }
      } catch (error) {
        console.error(`Failed for ${source.filename}:`, error.message);
        // Update with error placeholder so we don't retry indefinitely
        state.db.updateSource(source.id, {
          header: source.filename,
          explanation: `Error: ${error.message}`,
          footnote: '',
        });
      }

      processed++;
    }

    return { processed, total };
  });
}

module.exports = { registerAiIpc };
