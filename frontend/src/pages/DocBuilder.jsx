// frontend/src/pages/DocBuilder.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
    VscArrowLeft,
    VscSearch,
    VscListTree,
    VscEye,
    VscCode,
    VscFileCode,
    VscFilePdf,
    VscChecklist,
    VscLayout,
    VscZoomIn,
    VscZoomOut,
    VscSettings,
    VscChevronRight,
    VscChevronDown,
    VscCircleFilled,
} from 'react-icons/vsc';

export default function DocBuilder() {
    const { repoId } = useParams();
    const navigate = useNavigate();
    const printRef = useRef(null);

    const [files, setFiles] = useState([]);
    const [contents, setContents] = useState({});
    const [selectedIds, setSelectedIds] = useState([]);
    const [allSelected, setAllSelected] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'source' | 'split'
    const [fontSize, setFontSize] = useState(14);
    const [showLineNumbers, setShowLineNumbers] = useState(true);
    const [showFilePaths, setShowFilePaths] = useState(true);
    const [includeTOC, setIncludeTOC] = useState(true);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadFiles();
    }, [repoId]);

    const loadFiles = async () => {
        setLoading(true);
        const list = await window.api.getFilesForRepo(Number(repoId));
        setFiles(list || []);

        // Load all file contents for selected files
        const contentsMap = {};
        for (const file of list) {
            if (file.header || file.explanation) {
                const full = await window.api.getFileContent(file.id);
                contentsMap[file.id] = full;
            }
        }
        setContents(contentsMap);
        setLoading(false);
    };

    const handleToggle = async (id) => {
        setSelectedIds((prev) => {
            const newSelection = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
            setAllSelected(newSelection.length === files.length);
            return newSelection;
        });

        // Load content if not already loaded
        if (!contents[id]) {
            const full = await window.api.getFileContent(id);
            setContents((prev) => ({ ...prev, [id]: full }));
        }
    };

    const handleSelectAll = async () => {
        if (allSelected) {
            setSelectedIds([]);
            setAllSelected(false);
        } else {
            const allIds = files.map((f) => f.id);
            setSelectedIds(allIds);
            setAllSelected(true);

            // Load all contents
            const contentsMap = { ...contents };
            for (const file of files) {
                if (!contentsMap[file.id]) {
                    const full = await window.api.getFileContent(file.id);
                    contentsMap[file.id] = full;
                }
            }
            setContents(contentsMap);
        }
    };

    const selectedFiles = useMemo(() => {
        return files.filter((f) => selectedIds.includes(f.id)).map((f) => contents[f.id] || f);
    }, [files, selectedIds, contents]);

    // Generate documentation markdown
    const docMarkdown = useMemo(() => {
        let md = '';

        // Title page
        md += `<div class="title-page">\n\n`;
        md += `# Repository Documentation\n\n`;
        md += `*Generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })}*\n\n`;
        md += `</div>\n\n`;
        md += `<div style="page-break-after: always;"></div>\n\n`;

        // Table of Contents
        if (includeTOC && selectedFiles.length > 0) {
            md += `## 📑 Table of Contents\n\n`;
            selectedFiles.forEach((file, index) => {
                md += `${index + 1}. [${file.header || file.filename}](#section-${index + 1})\n`;
            });
            md += `\n<div style="page-break-after: always;"></div>\n\n`;
        }

        // File sections
        selectedFiles.forEach((file, index) => {
            md += `<div id="section-${index + 1}" class="file-section">\n\n`;

            // Header
            md += `## ${index + 1}. ${file.header || file.filename}\n\n`;

            if (showFilePaths && file.filepath) {
                md += `*File: \`${file.filepath}\`*\n\n`;
            }

            // Explanation
            if (file.explanation) {
                md += `### Overview\n\n${file.explanation}\n\n`;
            }

            // Code
            if (file.code) {
                md += `### Source Code\n\n`;
                const lang = file.filetype || '';
                md += `\`\`\`${lang}\n${file.code}\n\`\`\`\n\n`;
            }

            // Footnote
            if (file.footnote) {
                md += `### Notes\n\n${file.footnote}\n\n`;
            }

            md += `</div>\n\n`;
            md += `<div style="page-break-after: always;"></div>\n\n`;
        });

        return md;
    }, [selectedFiles, includeTOC, showFilePaths]);

    const handlePrint = () => {
        window.print();
    };

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

    return (
        <div className='h-full flex flex-col bg-white'>
            {/* Header */}
            <header className='flex items-center justify-between px-4 h-12 bg-white border-b border-gray-200 flex-shrink-0 print:hidden'>
                <div className='flex items-center gap-4'>
                    <button
                        onClick={() => navigate('/')}
                        className='flex items-center gap-1.5 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors'
                    >
                        <VscArrowLeft className='w-4 h-4' />
                        Back
                    </button>
                    <h1 className='text-lg font-semibold text-gray-900'>Documentation Builder</h1>
                </div>

                <div className='flex items-center gap-2'>
                    {/* Sidebar Toggle */}
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`p-2 rounded transition-colors ${
                            showSidebar
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-500 hover:bg-gray-100'
                        }`}
                        title='Toggle sidebar'
                    >
                        <VscListTree className='w-4 h-4' />
                    </button>

                    {/* View Mode */}
                    <div className='flex bg-gray-100 rounded-lg p-0.5'>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                                viewMode === 'preview'
                                    ? 'bg-white shadow text-gray-900'
                                    : 'text-gray-500'
                            }`}
                            title='Preview'
                        >
                            <VscEye className='w-4 h-4 inline' />
                        </button>
                        <button
                            onClick={() => setViewMode('source')}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                                viewMode === 'source'
                                    ? 'bg-white shadow text-gray-900'
                                    : 'text-gray-500'
                            }`}
                            title='Source'
                        >
                            <VscCode className='w-4 h-4 inline' />
                        </button>
                        <button
                            onClick={() => setViewMode('split')}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                                viewMode === 'split'
                                    ? 'bg-white shadow text-gray-900'
                                    : 'text-gray-500'
                            }`}
                            title='Split view'
                        >
                            <VscLayout className='w-4 h-4 inline' />
                        </button>
                    </div>

                    {/* Font Size */}
                    <div className='flex items-center gap-1 bg-gray-100 rounded-lg p-0.5'>
                        <button
                            onClick={() => setFontSize((prev) => Math.max(10, prev - 2))}
                            className='p-1 text-gray-500 hover:text-gray-900'
                        >
                            <VscZoomOut className='w-3.5 h-3.5' />
                        </button>
                        <span className='text-xs text-gray-500 w-8 text-center'>{fontSize}px</span>
                        <button
                            onClick={() => setFontSize((prev) => Math.min(20, prev + 2))}
                            className='p-1 text-gray-500 hover:text-gray-900'
                        >
                            <VscZoomIn className='w-3.5 h-3.5' />
                        </button>
                    </div>

                    {/* Settings */}
                    <div className='flex items-center gap-1'>
                        <button
                            onClick={() => setShowLineNumbers(!showLineNumbers)}
                            className={`p-1.5 rounded text-xs ${showLineNumbers ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            title='Toggle line numbers'
                        >
                            <VscChecklist className='w-3.5 h-3.5' />
                        </button>
                        <button
                            onClick={() => setShowFilePaths(!showFilePaths)}
                            className={`p-1.5 rounded text-xs ${showFilePaths ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            title='Toggle file paths'
                        >
                            <VscFileCode className='w-3.5 h-3.5' />
                        </button>
                        <button
                            onClick={() => setIncludeTOC(!includeTOC)}
                            className={`p-1.5 rounded text-xs ${includeTOC ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            title='Toggle table of contents'
                        >
                            <VscSettings className='w-3.5 h-3.5' />
                        </button>
                    </div>

                    {/* Print Button */}
                    <button
                        onClick={handlePrint}
                        className='flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm 
                       rounded-lg transition-colors font-medium shadow-sm'
                    >
                        <VscFilePdf className='w-4 h-4' />
                        Print / Save PDF
                    </button>
                </div>
            </header>

            <div className='flex-1 flex min-h-0'>
                {/* Sidebar */}
                {showSidebar && (
                    <aside className='w-72 border-r border-gray-200 bg-gray-50 flex flex-col flex-shrink-0 print:hidden'>
                        <div className='p-3 border-b border-gray-200'>
                            <div className='relative'>
                                <VscSearch className='absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400' />
                                <input
                                    type='text'
                                    placeholder='Search files...'
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className='w-full pl-7 pr-3 py-1.5 bg-white border border-gray-300 rounded text-sm 
                             text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                />
                            </div>
                        </div>

                        <div className='flex items-center justify-between p-3 border-b border-gray-200'>
                            <h2 className='text-sm font-semibold text-gray-700'>Files</h2>
                            <button
                                onClick={handleSelectAll}
                                className='text-xs text-blue-600 hover:text-blue-700 font-medium'
                            >
                                {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className='flex-1 overflow-y-auto p-2 space-y-1'>
                            {filteredFiles.map((file) => {
                                const isSelected = selectedIds.includes(file.id);
                                const hasContent = !!contents[file.id];

                                return (
                                    <label
                                        key={file.id}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors
                      ${
                          isSelected
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                      }`}
                                    >
                                        <input
                                            type='checkbox'
                                            checked={isSelected}
                                            onChange={() => handleToggle(file.id)}
                                            className='rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0'
                                        />
                                        <VscFileCode
                                            className={`w-3.5 h-3.5 flex-shrink-0 ${hasContent ? 'text-blue-500' : 'text-gray-400'}`}
                                        />
                                        <span className='truncate flex-1'>{file.filename}</span>
                                        {file.header && (
                                            <VscCircleFilled
                                                className='w-2 h-2 text-green-500 flex-shrink-0'
                                                title='Has AI documentation'
                                            />
                                        )}
                                    </label>
                                );
                            })}
                        </div>

                        <div className='p-3 border-t border-gray-200 bg-white'>
                            <div className='flex items-center justify-between text-sm text-gray-500'>
                                <span>{selectedIds.length} selected</span>
                                <span>{filteredFiles.length} total</span>
                            </div>
                        </div>
                    </aside>
                )}

                {/* Document Content */}
                <div className='flex-1 overflow-auto bg-white' ref={printRef}>
                    {viewMode === 'split' ? (
                        <div className='grid grid-cols-2 h-full divide-x divide-gray-200'>
                            {/* Source */}
                            <div className='overflow-auto'>
                                <pre
                                    className='p-6 text-sm text-gray-700 font-mono whitespace-pre-wrap'
                                    style={{ fontSize: `${fontSize}px` }}
                                >
                                    {docMarkdown}
                                </pre>
                            </div>
                            {/* Preview */}
                            <div className='overflow-auto'>
                                <div className='p-6' style={{ fontSize: `${fontSize}px` }}>
                                    <ReactMarkdownContent
                                        markdown={docMarkdown}
                                        showLineNumbers={showLineNumbers}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : viewMode === 'source' ? (
                        <pre
                            className='p-6 text-sm text-gray-700 font-mono whitespace-pre-wrap'
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            {docMarkdown}
                        </pre>
                    ) : (
                        <div
                            className='max-w-4xl mx-auto p-8 print:max-w-full'
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            {selectedFiles.length === 0 ? (
                                <div className='flex items-center justify-center min-h-[400px]'>
                                    <div className='text-center'>
                                        <VscFileCode className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                                        <h2 className='text-xl font-semibold text-gray-700 mb-2'>
                                            No files selected
                                        </h2>
                                        <p className='text-gray-500'>
                                            Select files from the sidebar to build documentation
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <ReactMarkdownContent
                                    markdown={docMarkdown}
                                    showLineNumbers={showLineNumbers}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Print-specific styles */}
            <style>{`
        @media print {
          @page {
            size: A4;
            margin: 2cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .file-section {
            page-break-before: always;
          }
          .file-section:first-of-type {
            page-break-before: auto;
          }
          .title-page {
            page-break-after: always;
          }
          pre, code {
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
          }
        }
      `}</style>
        </div>
    );
}

// Helper component for rendering markdown
function ReactMarkdownContent({ markdown, showLineNumbers }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                        <div className='my-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm'>
                            <div className='flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200'>
                                <span className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                                    {match[1]}
                                </span>
                            </div>
                            <SyntaxHighlighter
                                style={oneLight}
                                language={match[1]}
                                PreTag='div'
                                customStyle={{
                                    margin: 0,
                                    padding: '1.25rem',
                                    background: '#ffffff',
                                    fontSize: '13px',
                                    lineHeight: '1.6',
                                }}
                                showLineNumbers={showLineNumbers}
                                wrapLines={true}
                                {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        </div>
                    ) : (
                        <code
                            className='bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono'
                            {...props}
                        >
                            {children}
                        </code>
                    );
                },
                h1: ({ children }) => (
                    <h1 className='text-3xl font-bold text-gray-900 mb-8 pb-4 border-b-2 border-gray-300'>
                        {children}
                    </h1>
                ),
                h2: ({ children }) => (
                    <h2 className='text-2xl font-semibold text-gray-800 mt-10 mb-5 pb-2 border-b border-gray-200'>
                        {children}
                    </h2>
                ),
                h3: ({ children }) => (
                    <h3 className='text-xl font-semibold text-gray-700 mt-8 mb-3'>{children}</h3>
                ),
                p: ({ children }) => (
                    <p className='text-gray-700 leading-relaxed mb-4'>{children}</p>
                ),
                em: ({ children }) => <em className='text-gray-500 italic'>{children}</em>,
                strong: ({ children }) => (
                    <strong className='font-semibold text-gray-900'>{children}</strong>
                ),
                hr: () => <hr className='my-8 border-gray-200' />,
                ul: ({ children }) => (
                    <ul className='list-disc pl-6 mb-4 text-gray-700 space-y-1'>{children}</ul>
                ),
                ol: ({ children }) => (
                    <ol className='list-decimal pl-6 mb-4 text-gray-700 space-y-1'>{children}</ol>
                ),
                li: ({ children }) => <li className='leading-relaxed'>{children}</li>,
                blockquote: ({ children }) => (
                    <blockquote className='border-l-4 border-blue-300 pl-4 my-4 text-gray-600 italic'>
                        {children}
                    </blockquote>
                ),
                a: ({ children, href }) => (
                    <a
                        href={href}
                        className='text-blue-600 hover:text-blue-800 underline'
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        {children}
                    </a>
                ),
            }}
        >
            {markdown}
        </ReactMarkdown>
    );
}
