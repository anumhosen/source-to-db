// src/pages/EditorView.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FileTree from '../components/FileTree';
import CodeEditor from '../components/CodeEditor';
import AIPanel from '../components/AIPanel';
import { PanelGroup, PanelResizeHandle, Panel } from 'react-resizable-panels';
import { VscArrowLeft, VscListTree, VscSave, VscWand } from 'react-icons/vsc';
import { TbFileExport, TbPackageExport } from 'react-icons/tb';

export default function EditorView() {
  const { repoId } = useParams();
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [aiFields, setAiFields] = useState({ header: '', explanation: '', footnote: '' });
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    loadFiles();
  }, [repoId]);

  const loadFiles = async () => {
    const list = await window.api.getFilesForRepo(Number(repoId));
    setFiles(list);
  };

  const handleSelectFile = async (fileId) => {
    setSelectedFile(fileId);
    const full = await window.api.getFileContent(fileId);
    setFileContent(full);
    setAiFields({
      header: full.header || '',
      explanation: full.explanation || '',
      footnote: full.footnote || '',
    });
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    await window.api.updateFile(selectedFile, { code: fileContent.code, ...aiFields });
    alert('Saved.');
  };

  const handleRegenerateAI = async () => {
    if (!selectedFile) return;
    const updated = await window.api.generateAI(selectedFile);
    setAiFields({
      header: updated.header,
      explanation: updated.explanation,
      footnote: updated.footnote,
    });
  };

  const handleExport = async (exportAll = false) => {
    let fileIds = exportAll ? null : [selectedFile];
    const result = await window.api.exportFiles(Number(repoId), fileIds);
    if (result) alert(`Exported ${result.exported} files to ${result.outputDir}`);
  };

  return (
    <div className='flex flex-col h-[calc(100%-44px)]'>
      {/* Toolbar */}
      <div className='flex items-center justify-between p-1 flex-shrink-0'>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => navigate('/')}
            className='flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors'
          >
            <VscArrowLeft className='w-4 h-4' />
            Back
          </button>
          <button
            onClick={() => {
              selectedFile ? setShowSidebar(!showSidebar) : setShowSidebar(true);
            }}
            className={`p-2 rounded transition-colors ${showSidebar ? 'bg-gray-800 text-gray-300' : 'text-gray-500 hover:bg-gray-800'}`}
          >
            <VscListTree className='w-4 h-4' />
          </button>
        </div>
        {selectedFile && (
          <div className='flex gap-1 items-center'>
            <button
              onClick={handleSave}
              className='flex items-center gap-1.5 px-3 py-1 bg-green-800 rounded hover:bg-green-700'
            >
              <VscSave className='w-4 h-4' />
              Save
            </button>
            <button
              onClick={handleRegenerateAI}
              className='flex items-center gap-1.5 px-3 py-1 bg-indigo-900 rounded hover:bg-indigo-800'
            >
              <VscWand className='w-4 h-4' />
              AI Explain
            </button>
            <button
              onClick={() => handleExport(false)}
              className='flex items-center gap-1.5 px-3 py-1 bg-gray-800 rounded hover:bg-gray-700'
            >
              <TbFileExport className='w-4 h-4' />
              Export Current
            </button>
            <button
              onClick={() => handleExport(true)}
              className='flex items-center gap-1.5 px-3 py-1 bg-gray-800 rounded hover:bg-gray-700'
            >
              <TbPackageExport className='w-4 h-4' />
              Export All
            </button>
          </div>
        )}
      </div>

      <div className='flex flex-1 h-full gap-1 px-1'>
        {/* Sidebar */}
        {showSidebar && (
          <aside className='w-64 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0'>
            <FileTree files={files} onSelect={handleSelectFile} selectedId={selectedFile} />
          </aside>
        )}
        {selectedFile ? (
          <PanelGroup direction='horizontal'>
            <Panel defaultSize={50}>
              <CodeEditor
                code={fileContent.code}
                language={fileContent.filetype}
                onChange={(newCode) => setFileContent({ ...fileContent, code: newCode })}
              />
            </Panel>
            <PanelResizeHandle className='bg-gray-800' />
            <Panel defaultSize={50}>
              <AIPanel fields={aiFields} onChange={setAiFields} />
            </Panel>
          </PanelGroup>
        ) : (
          <p className='h-full w-full flex items-center justify-center text-gray-500'>
            Select a file to edit
          </p>
        )}
      </div>
    </div>
  );
}
