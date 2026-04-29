import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  VscArrowLeft,
  VscEye,
  VscBook,
  VscEdit,
  VscSearch,
  VscClose,
  VscListTree,
  VscLoading,
  VscWand,
} from 'react-icons/vsc';
import FileTree from '../components/FileTree';

export default function DocView() {
  const { repoId } = useParams();
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [modelStatus, setModelStatus] = useState(null);

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
    setLoading(true);
    const list = await window.api.getFilesForRepo(Number(repoId));
    setFiles(list || []);
    setLoading(false);
  };

  const handleFileSelect = async (fileId) => {
    setLoading(true);
    setActiveFileId(fileId);
    const content = await window.api.getFileContent(fileId);
    setFileContent(content);
    setLoading(false);
  };

  const handleGenerateAI = async () => {
    if (!activeFileId) return;

    const status = await window.api.getLLMStatus();
    if (!status.initialized) return;

    setGenerating(true);
    const updated = await window.api.generateAI(activeFileId);
    setFileContent(updated);
    setGenerating(false);
    loadFiles();
  };

  const previewMarkdown = useMemo(() => {
    if (!fileContent) return '';
    const parts = [];

    if (fileContent.header) {
      parts.push(`# ${fileContent.header}\n`);
    }
    parts.push(
      `**File:** \`${fileContent.filepath}\`  |  **Language:** ${fileContent.filetype || 'text'}\n`,
    );
    parts.push(`---\n`);

    if (fileContent.explanation) {
      parts.push(`\n## 📝 Overview\n\n${fileContent.explanation}\n`);
    }

    if (fileContent.code) {
      parts.push(
        `\n## 💻 Source Code\n\n\`\`\`${fileContent.filetype || ''}\n${fileContent.code}\n\`\`\`\n`,
      );
    }

    if (fileContent.footnote) {
      parts.push(`\n## 📌 Notes\n\n${fileContent.footnote}\n`);
    }

    return parts.join('\n');
  }, [fileContent]);

  return (
    <div className='flex flex-col h-[calc(100vh-2rem)] p-1'>
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
            onClick={() => navigate(`/editor/${repoId}`)}
            className='flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors'
          >
            <VscEdit className='w-3.5 h-3.5' />
            Editor
          </button>
          <button
            onClick={() => navigate(`/doc-builder/${repoId}`)}
            className='flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors'
          >
            <VscBook className='w-3.5 h-3.5' />
            Doc Builder
          </button>
        </div>

        <div className='flex items-center gap-2'>
          {activeFileId && modelStatus?.initialized && (
            <button
              onClick={handleGenerateAI}
              disabled={generating}
              className='flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900 rounded hover:bg-indigo-800 
                         disabled:opacity-50 text-sm transition-colors'
            >
              {generating ? (
                <VscLoading className='w-3.5 h-3.5 animate-spin' />
              ) : (
                <VscWand className='w-3.5 h-3.5' />
              )}
              AI Explain
            </button>
          )}
        </div>
      </div>

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
            <div className='flex-1 overflow-hidden'>
              <FileTree
                files={files}
                onSelect={handleFileSelect}
                selectedId={activeFileId}
                searchQuery={searchQuery}
              />
            </div>
          </aside>
        )}

        {/* Preview */}
        <div className='flex-1 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden flex flex-col min-w-0'>
          <div className='flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0'>
            <div className='flex items-center gap-2'>
              <VscEye className='w-4 h-4 text-gray-400' />
              <span className='text-sm text-gray-300'>
                {fileContent ? fileContent.filename : 'Documentation Preview'}
              </span>
            </div>
            {fileContent && (
              <span className='text-xs text-gray-500'>{fileContent.filetype?.toUpperCase()}</span>
            )}
          </div>

          <div className='flex-1 overflow-y-auto'>
            {!activeFileId ? (
              <div className='flex items-center justify-center h-full'>
                <div className='text-center p-8'>
                  <VscEye className='w-16 h-16 text-gray-700 mx-auto mb-4' />
                  <p className='text-gray-500 text-lg'>Select a file to preview</p>
                  <p className='text-gray-600 text-sm mt-2'>
                    Files with <span className='text-green-500'>●</span> have AI documentation
                  </p>
                </div>
              </div>
            ) : loading ? (
              <div className='flex items-center justify-center h-full'>
                <VscLoading className='w-6 h-6 text-gray-500 animate-spin' />
              </div>
            ) : (
              <div className='p-6'>
                <article
                  className='prose prose-invert max-w-none
                  prose-headings:text-gray-100 
                  prose-h1:text-2xl prose-h1:font-bold
                  prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-4
                  prose-p:text-gray-300 prose-p:leading-relaxed
                  prose-a:text-indigo-400
                  prose-code:text-gray-200 prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700
                  prose-strong:text-gray-100
                  prose-hr:border-gray-700
                  break-words
                '
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag='div'
                            showLineNumbers
                            wrapLines
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {previewMarkdown}
                  </ReactMarkdown>
                </article>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
