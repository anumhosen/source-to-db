// frontend/src/pages/DocView.jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
    VscArrowLeft,
    VscSearch,
    VscListTree,
    VscEye,
    VscCode,
    VscFileCode,
    VscBook,
    VscWand,
    VscChevronRight,
    VscChevronDown,
} from 'react-icons/vsc';

export default function DocView() {
    const { repoId } = useParams();
    const navigate = useNavigate();

    const [files, setFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    const [fileContent, setFileContent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);
    const [expandedDirs, setExpandedDirs] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        loadFiles();
    }, [repoId]);

    const loadFiles = async () => {
        setLoading(true);
        const list = await window.api.getFilesForRepo(Number(repoId));
        setFiles(list || []);
        setLoading(false);
    };

    // Build file tree
    const fileTree = useMemo(() => {
        const tree = {};
        files.forEach((file) => {
            const parts = file.filepath.split('/');
            let current = tree;
            parts.forEach((part, i) => {
                if (i === parts.length - 1) {
                    if (!current._files) current._files = [];
                    current._files.push(file);
                } else {
                    if (!current[part]) current[part] = {};
                    current = current[part];
                }
            });
        });
        return tree;
    }, [files]);

    // Filter files by search
    const filteredFiles = useMemo(() => {
        if (!searchQuery.trim()) return files;
        const query = searchQuery.toLowerCase();
        return files.filter(
            (f) =>
                f.filename.toLowerCase().includes(query) ||
                f.filepath.toLowerCase().includes(query) ||
                (f.header && f.header.toLowerCase().includes(query)),
        );
    }, [files, searchQuery]);

    const handleFileSelect = async (fileId) => {
        setLoading(true);
        setActiveFileId(fileId);
        const content = await window.api.getFileContent(fileId);
        setFileContent(content);
        setLoading(false);
    };

    const handleGenerateAll = async () => {
        setGenerating(true);
        await window.api.generateAIForRepo(Number(repoId));
        await loadFiles();
        setGenerating(false);
        if (activeFileId) {
            const updated = await window.api.getFileContent(activeFileId);
            setFileContent(updated);
        }
    };

    const handleGenerateOne = async () => {
        if (!activeFileId) return;
        setGenerating(true);
        const updated = await window.api.generateAI(activeFileId);
        setFileContent(updated);
        setGenerating(false);
    };

    const toggleDir = (path) => {
        setExpandedDirs((prev) => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    // Build markdown for preview
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

    // Render file tree recursively
    const renderTree = (node, path = '') => {
        const items = [];

        // Render directories
        Object.entries(node).forEach(([key, value]) => {
            if (key === '_files') return;
            const fullPath = path ? `${path}/${key}` : key;
            const isExpanded = expandedDirs.has(fullPath);

            items.push(
                <div key={fullPath}>
                    <button
                        onClick={() => toggleDir(fullPath)}
                        className='w-full flex items-center gap-1 px-2 py-1 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors'
                    >
                        {isExpanded ? (
                            <VscChevronDown className='w-3.5 h-3.5 flex-shrink-0' />
                        ) : (
                            <VscChevronRight className='w-3.5 h-3.5 flex-shrink-0' />
                        )}
                        <VscFileCode className='w-3.5 h-3.5 flex-shrink-0 text-gray-500' />
                        <span className='truncate'>{key}</span>
                    </button>
                    {isExpanded && <div className='ml-3'>{renderTree(value, fullPath)}</div>}
                </div>,
            );
        });

        // Render files
        if (node._files) {
            node._files.forEach((file) => {
                const isActive = activeFileId === file.id;
                const hasAI = file.header;

                items.push(
                    <button
                        key={file.id}
                        onClick={() => handleFileSelect(file.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors
              ${
                  isActive
                      ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-800'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
                    >
                        <VscCode
                            className={`w-3.5 h-3.5 flex-shrink-0 ${hasAI ? 'text-green-500' : 'text-gray-500'}`}
                        />
                        <span className='truncate flex-1 text-left'>{file.filename}</span>
                        {hasAI && <span className='text-xs text-green-500'>AI</span>}
                    </button>,
                );
            });
        }

        return items;
    };

    return (
        <div className='flex flex-col h-[calc(100%-44px)]'>
            {/* Toolbar */}
            <div className='flex h-10 items-center justify-between p-1 flex-shrink-0'>
                <div className='flex items-center gap-2'>
                    <button
                        onClick={() => navigate('/')}
                        className='flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors'
                    >
                        <VscArrowLeft className='w-4 h-4' />
                        Back
                    </button>
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`p-2 rounded transition-colors ${showSidebar ? 'bg-gray-800 text-gray-300' : 'text-gray-500 hover:bg-gray-800'}`}
                    >
                        <VscListTree className='w-4 h-4' />
                    </button>
                </div>

                <div className='flex items-center gap-2'>
                    {activeFileId && (
                        <button
                            onClick={handleGenerateOne}
                            disabled={generating}
                            className='flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 disabled:opacity-50 
                         rounded text-sm transition-colors'
                        >
                            <VscWand className='w-4 h-4' />
                            Explain Current
                        </button>
                    )}
                    <button
                        onClick={handleGenerateAll}
                        disabled={generating}
                        className='flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 disabled:opacity-50 
                       rounded text-sm transition-colors'
                    >
                        <VscWand className='w-4 h-4' />
                        {generating ? 'Generating...' : 'Explain All'}
                    </button>
                    <button
                        onClick={() => navigate(`/doc-builder/${repoId}`)}
                        className='flex items-center gap-1.5 px-3 py-1.5 bg-green-800 hover:bg-green-700 rounded text-sm transition-colors'
                    >
                        <VscBook className='w-4 h-4' />
                        Doc Builder
                    </button>
                </div>
            </div>

            <div className='flex flex-1 gap-1 px-1 h-full'>
                {/* Sidebar */}
                {showSidebar && (
                    <aside className='w-64 flex flex-col bg-gray-900 rounded-lg border border-gray-800 overflow-hidden flex-shrink-0'>
                        {/* Search */}
                        <div className='p-2 border-b border-gray-800'>
                            <div className='relative'>
                                <VscSearch className='absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500' />
                                <input
                                    type='text'
                                    placeholder='Search files...'
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className='w-full pl-7 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 
                             placeholder-gray-500 focus:outline-none focus:border-indigo-500'
                                />
                            </div>
                        </div>

                        {/* File Tree */}
                        <div className='flex-1 overflow-y-auto p-2'>
                            {searchQuery
                                ? // Flat list for search results
                                  filteredFiles.map((file) => (
                                      <button
                                          key={file.id}
                                          onClick={() => handleFileSelect(file.id)}
                                          className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors mb-0.5
                      ${
                          activeFileId === file.id
                              ? 'bg-indigo-900/30 text-indigo-300'
                              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      }`}
                                      >
                                          <VscCode className='w-3.5 h-3.5 flex-shrink-0' />
                                          <span className='truncate'>{file.filepath}</span>
                                      </button>
                                  ))
                                : renderTree(fileTree)}
                        </div>

                        {/* Stats */}
                        <div className='p-2 border-t border-gray-800 text-xs text-gray-500'>
                            {filteredFiles.length} files
                        </div>
                    </aside>
                )}

                {/* Preview Panel */}
                <div className='flex-1 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden flex flex-col min-w-0'>
                    {/* Preview Header */}
                    <div className='flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0'>
                        <div className='flex items-center gap-2'>
                            <VscEye className='w-4 h-4 text-gray-400' />
                            <span className='text-sm text-gray-300'>
                                {fileContent ? fileContent.filename : 'Documentation Preview'}
                            </span>
                        </div>
                        {fileContent && (
                            <span className='text-xs text-gray-500'>
                                {fileContent.filetype?.toUpperCase()}
                            </span>
                        )}
                    </div>

                    {/* Preview Content */}
                    <div className='flex-1 overflow-y-auto'>
                        {!activeFileId ? (
                            <div className='flex items-center justify-center h-full'>
                                <div className='text-center p-8'>
                                    <VscBook className='w-16 h-16 text-gray-700 mx-auto mb-4' />
                                    <p className='text-gray-500 text-lg'>
                                        Select a file to preview documentation
                                    </p>
                                    <p className='text-gray-600 text-sm mt-2'>
                                        Files with <span className='text-green-500'>AI</span> badge
                                        have generated documentation
                                    </p>
                                </div>
                            </div>
                        ) : loading ? (
                            <div className='flex items-center justify-center h-full'>
                                <div className='text-gray-500'>Loading...</div>
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
                                                const match = /language-(\w+)/.exec(
                                                    className || '',
                                                );
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
