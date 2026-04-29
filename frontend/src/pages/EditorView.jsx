import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FileTree from '../components/FileTree';
import CodeEditor from '../components/CodeEditor';
import AIPanel from '../components/AIPanel';
import { PanelGroup, PanelResizeHandle, Panel } from 'react-resizable-panels';
import {
  VscArrowLeft,
  VscSave,
  VscWand,
  VscCloudDownload,
  VscWarning,
  VscLoading,
  VscSearch,
  VscClose,
  VscListTree,
  VscEye,
  VscBook,
} from 'react-icons/vsc';

export default function EditorView() {
  const { repoId } = useParams();
  const navigate = useNavigate();

  // State
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [aiFields, setAiFields] = useState({ header: '', explanation: '', footnote: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modelStatus, setModelStatus] = useState(null);

  // Load files and model status
  useEffect(() => {
    loadFiles();
    checkModelStatus();
  }, [repoId]);

  const checkModelStatus = async () => {
    try {
      const status = await window.api.getLLMStatus();
      setModelStatus(status);
    } catch (e) {
      console.warn('Could not check model status');
    }
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await window.api.getFilesForRepo(Number(repoId));
      setFiles(list || []);
    } catch (err) {
      setError('Failed to load files: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = async (fileId) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedFileId(fileId);

      const full = await window.api.getFileContent(fileId);
      setFileContent(full || null);
      setAiFields({
        header: full?.header || '',
        explanation: full?.explanation || '',
        footnote: full?.footnote || '',
      });
    } catch (err) {
      setError('Failed to load file: ' + err.message);
      setFileContent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFileId || !fileContent) return;

    try {
      setSaving(true);
      setError(null);

      await window.api.updateFile(selectedFileId, { code: fileContent.code, ...aiFields });

      setSaving(false);
    } catch (err) {
      setError('Failed to save: ' + err.message);
      setSaving(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedFileId) return;

    // Check if model is loaded
    const status = await window.api.getLLMStatus();
    if (!status.initialized) {
      setError('No AI model loaded. Please load a model in Settings first.');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const updated = await window.api.generateAI(selectedFileId);
      if (updated) {
        setAiFields({
          header: updated.header || '',
          explanation: updated.explanation || '',
          footnote: updated.footnote || '',
        });
      }
    } catch (err) {
      setError('AI generation failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (exportAll = false) => {
    try {
      setError(null);
      let fileIds = exportAll ? null : [selectedFileId].filter(Boolean);
      const result = await window.api.exportFiles(Number(repoId), fileIds);
      if (result) {
        alert(`Exported ${result.exported} files to ${result.outputDir}`);
      }
    } catch (err) {
      setError('Export failed: ' + err.message);
    }
  };

  const handleCodeChange = useCallback((newCode) => {
    setFileContent((prev) => (prev ? { ...prev, code: newCode } : null));
  }, []);

  const handleAiFieldsChange = useCallback((newFields) => {
    setAiFields(newFields);
  }, []);

  return (
    <div className='flex flex-col h-[calc(100vh-2rem)] p-1'>
      {/* Error Banner */}
      {error && (
        <div className='mb-1 p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center justify-between flex-shrink-0'>
          <div className='flex items-center gap-2'>
            <VscWarning className='w-4 h-4 text-red-400 flex-shrink-0' />
            <p className='text-red-300 text-sm'>{error}</p>
          </div>
          <button onClick={() => setError(null)} className='text-red-400 hover:text-red-300'>
            <VscClose className='w-4 h-4' />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className='flex items-center justify-between mb-1 flex-shrink-0'>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => navigate('/')}
            className='flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded hover:bg-gray-700 text-gray-300 text-sm transition-colors'
          >
            <VscArrowLeft className='w-4 h-4' />
            Back
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-2 rounded transition-colors ${showSidebar ? 'bg-gray-800 text-gray-300' : 'text-gray-500 hover:bg-gray-800'}`}
          >
            <VscListTree className='w-3.5 h-3.5' />
          </button>
          <button
            onClick={() => navigate(`/docs/${repoId}`)}
            className='flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors'
          >
            <VscEye className='w-3.5 h-3.5' />
            Doc View
          </button>
          <button
            onClick={() => navigate(`/doc-builder/${repoId}`)}
            className='flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors'
          >
            <VscBook className='w-3.5 h-3.5' />
            Doc Builder
          </button>
        </div>

        {selectedFileId && (
          <div className='flex items-center gap-2'>
            <button
              onClick={handleSave}
              disabled={saving || !fileContent}
              className='flex items-center gap-1.5 px-3 py-1.5 bg-green-800 rounded hover:bg-green-700 
                         disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors'
            >
              <VscSave className='w-3.5 h-3.5' />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleGenerateAI}
              disabled={generating || !fileContent}
              className='flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900 rounded hover:bg-indigo-800 
                         disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors'
              title={!modelStatus?.initialized ? 'No model loaded' : 'Generate AI explanation'}
            >
              {generating ? (
                <VscLoading className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <VscWand className='w-3.5 h-3.5' />
              )}
              AI Explain
            </button>
            <button
              onClick={() => handleExport(false)}
              disabled={!fileContent}
              className='flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded hover:bg-gray-700 
                         disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors'
            >
              <VscCloudDownload className='w-3.5 h-3.5' />
              Export
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className='flex flex-1 gap-1 min-h-0'>
        {/* Sidebar */}
        {showSidebar && (
          <aside className='w-64 bg-gray-900 rounded-lg border border-gray-800 flex flex-col overflow-hidden flex-shrink-0'>
            <div className='p-2 border-b border-gray-800'>
              <div className='relative'>
                <VscSearch className='absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500' />
                <input
                  type='text'
                  placeholder='Search files...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-7 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs 
                             text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500'
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300'
                  >
                    <VscClose className='w-3 h-3' />
                  </button>
                )}
              </div>
            </div>
            <FileTree
              files={files}
              onSelect={handleSelectFile}
              selectedId={selectedFileId}
              searchQuery={searchQuery}
            />
          </aside>
        )}

        {/* Editor Area */}
        <div className='flex-1 flex flex-col min-w-0'>
          {!selectedFileId ? (
            <div className='flex-1 flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800'>
              <div className='text-center'>
                <VscSearch className='w-12 h-12 text-gray-700 mx-auto mb-3' />
                <p className='text-gray-500'>Select a file to edit</p>
              </div>
            </div>
          ) : loading ? (
            <div className='flex-1 flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800'>
              <VscLoading className='w-6 h-6 text-gray-500 animate-spin' />
            </div>
          ) : (
            <PanelGroup direction='horizontal' className='gap-0.5'>
              <Panel defaultSize={50}>
                <CodeEditor
                  code={fileContent?.code || ''}
                  language={fileContent?.filetype || 'text'}
                  onChange={handleCodeChange}
                />
              </Panel>
              <PanelResizeHandle className='bg-gray-800' />
              <Panel defaultSize={50}>
                <AIPanel
                  fields={aiFields}
                  onChange={handleAiFieldsChange}
                  onGenerate={handleGenerateAI}
                  modelLoaded={modelStatus?.initialized}
                />
              </Panel>
            </PanelGroup>
          )}
        </div>
      </div>
    </div>
  );
}
