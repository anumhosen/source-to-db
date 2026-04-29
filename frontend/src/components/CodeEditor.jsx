import { useState, useEffect, useRef, useCallback } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import Editor from 'react-simple-code-editor';
import {
    VscCopy,
    VscCheck,
    VscSearch,
    VscReplace,
    VscChevronDown,
    VscWordWrap,
    VscListSelection,
    VscSymbolColor,
} from 'react-icons/vsc';

// Language mapping for Prism
const languageMap = {
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    r: 'r',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    json: 'json',
    xml: 'xml',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    md: 'markdown',
    markdown: 'markdown',
    txt: 'text',
    text: 'text',
    plaintext: 'text',
    graphql: 'graphql',
    dockerfile: 'docker',
    toml: 'toml',
    ini: 'ini',
    conf: 'nginx',
    nginx: 'nginx',
};

const getPrismLanguage = (filetype) => {
    if (!filetype) return 'text';
    return languageMap[filetype.toLowerCase()] || filetype.toLowerCase();
};

export default function CodeEditor({ code, language, onChange, readOnly = false }) {
    const [copied, setCopied] = useState(false);
    const [wordWrap, setWordWrap] = useState(true);
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [lineCount, setLineCount] = useState(0);
    const [currentLanguage, setCurrentLanguage] = useState(language || 'text');
    const editorRef = useRef(null);

    // Update line count when code changes
    useEffect(() => {
        if (code) {
            setLineCount(code.split('\n').length);
        } else {
            setLineCount(0);
        }
    }, [code]);

    // Update language when prop changes
    useEffect(() => {
        if (language) {
            setCurrentLanguage(language);
        }
    }, [language]);

    const handleCopy = async () => {
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const highlight = useCallback(
        (code) => {
            const prismLang = getPrismLanguage(currentLanguage);

            return (
                <Highlight theme={themes.nightOwl} code={code || ''} language={prismLang}>
                    {({ tokens, getLineProps, getTokenProps }) => (
                        <>
                            {tokens.map((line, i) => (
                                <div
                                    key={i}
                                    {...getLineProps({ line })}
                                    style={{ display: 'table-row' }}
                                >
                                    {/* Line number */}
                                    <span
                                        style={{
                                            display: 'table-cell',
                                            textAlign: 'right',
                                            paddingRight: '16px',
                                            userSelect: 'none',
                                            color: '#4a5568',
                                            fontSize: '12px',
                                            minWidth: '40px',
                                            width: '40px',
                                            borderRight: '1px solid #1e293b',
                                            marginRight: '12px',
                                        }}
                                    >
                                        {i + 1}
                                    </span>
                                    {/* Line content */}
                                    <span
                                        style={{
                                            display: 'table-cell',
                                            paddingLeft: '16px',
                                            wordBreak: wordWrap ? 'break-word' : 'normal',
                                            whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                                        }}
                                    >
                                        {line.map((token, key) => (
                                            <span key={key} {...getTokenProps({ token })} />
                                        ))}
                                    </span>
                                </div>
                            ))}
                        </>
                    )}
                </Highlight>
            );
        },
        [currentLanguage, wordWrap],
    );

    const availableLanguages = [
        { label: 'JavaScript', value: 'js' },
        { label: 'TypeScript', value: 'ts' },
        { label: 'JSX', value: 'jsx' },
        { label: 'TSX', value: 'tsx' },
        { label: 'Python', value: 'py' },
        { label: 'Ruby', value: 'rb' },
        { label: 'Go', value: 'go' },
        { label: 'Rust', value: 'rs' },
        { label: 'Java', value: 'java' },
        { label: 'C', value: 'c' },
        { label: 'C++', value: 'cpp' },
        { label: 'C#', value: 'cs' },
        { label: 'PHP', value: 'php' },
        { label: 'Swift', value: 'swift' },
        { label: 'Kotlin', value: 'kt' },
        { label: 'SQL', value: 'sql' },
        { label: 'HTML', value: 'html' },
        { label: 'CSS', value: 'css' },
        { label: 'SCSS', value: 'scss' },
        { label: 'JSON', value: 'json' },
        { label: 'YAML', value: 'yaml' },
        { label: 'XML', value: 'xml' },
        { label: 'Markdown', value: 'md' },
        { label: 'Bash/Shell', value: 'sh' },
        { label: 'Dockerfile', value: 'dockerfile' },
        { label: 'GraphQL', value: 'graphql' },
        { label: 'TOML', value: 'toml' },
        { label: 'Plain Text', value: 'txt' },
    ];

    return (
        <div className='flex flex-col h-full bg-[#011627] rounded-lg overflow-hidden border border-gray-800'>
            {/* Editor Header */}
            <div className='flex h-8 items-center justify-between px-3 py-1 bg-[#0a1f33] border-b border-gray-800 flex-shrink-0'>
                <div className='flex items-center gap-2'>
                    {/* Language Selector */}
                    <div className='relative'>
                        <button
                            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                            className='flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 
                         bg-[#011627] border border-gray-700 rounded transition-colors'
                        >
                            <span>{currentLanguage?.toUpperCase() || 'TEXT'}</span>
                            <VscChevronDown className='w-3 h-3' />
                        </button>

                        {showLanguageDropdown && (
                            <>
                                <div
                                    className='fixed inset-0 z-10'
                                    onClick={() => setShowLanguageDropdown(false)}
                                />
                                <div
                                    className='absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto bg-[#011627] 
                                border border-gray-700 rounded-lg shadow-xl z-20'
                                >
                                    {availableLanguages.map((lang) => (
                                        <button
                                            key={lang.value}
                                            onClick={() => {
                                                setCurrentLanguage(lang.value);
                                                setShowLanguageDropdown(false);
                                            }}
                                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors
                        ${
                            currentLanguage === lang.value
                                ? 'bg-indigo-900/30 text-indigo-300'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                        }`}
                                        >
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* File info */}
                    <span className='text-xs text-gray-600'>{lineCount} lines</span>
                </div>

                <div className='flex items-center gap-1'>
                    {/* Word Wrap Toggle */}
                    <button
                        onClick={() => setWordWrap(!wordWrap)}
                        className={`p-1 rounded transition-colors ${
                            wordWrap
                                ? 'bg-indigo-900/30 text-indigo-400'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                        }`}
                        title={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
                    >
                        <VscWordWrap className='w-3.5 h-3.5' />
                    </button>

                    {/* Copy Button */}
                    <button
                        onClick={handleCopy}
                        className='p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors'
                        title='Copy code'
                    >
                        {copied ? (
                            <VscCheck className='w-3.5 h-3.5 text-green-400' />
                        ) : (
                            <VscCopy className='w-3.5 h-3.5' />
                        )}
                    </button>
                </div>
            </div>

            {/* Editor Body */}
            <div className='flex-1 overflow-auto'>
                <Editor
                    ref={editorRef}
                    value={code || ''}
                    onValueChange={onChange}
                    highlight={highlight}
                    padding={0}
                    disabled={readOnly}
                    tabSize={2}
                    insertSpaces={true}
                    ignoreTabKey={false}
                    style={{
                        fontFamily:
                            '"Fira Code", "Fira Mono", "Consolas", "Monaco", "Courier New", monospace',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        minHeight: '100%',
                        background: '#011627',
                        color: '#d6deeb',
                    }}
                    textareaId='code-editor'
                    className='code-editor'
                />
            </div>

            {/* Editor Footer */}
            <div className='flex items-center justify-between px-3 py-1 bg-[#0a1f33] border-t border-gray-800 flex-shrink-0'>
                <div className='flex items-center gap-3'>
                    <span className='text-[10px] text-gray-600'>
                        {currentLanguage?.toUpperCase() || 'TEXT'}
                    </span>
                    <span className='text-[10px] text-gray-600'>UTF-8</span>
                    <span className='text-[10px] text-gray-600'>
                        {wordWrap ? 'Word Wrap' : 'No Wrap'}
                    </span>
                </div>
                <div className='flex items-center gap-2 text-[10px] text-gray-600'>
                    <span>Ln {lineCount}</span>
                </div>
            </div>

            {/* Custom Styles */}
            <style>{`
        .code-editor textarea {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .code-editor textarea:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        .code-editor pre {
          padding: 16px 0 !important;
        }
        /* Scrollbar styling */
        .code-editor::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .code-editor::-webkit-scrollbar-track {
          background: #011627;
        }
        .code-editor::-webkit-scrollbar-thumb {
          background: #1e3a5f;
          border-radius: 4px;
        }
        .code-editor::-webkit-scrollbar-thumb:hover {
          background: #2d5a8e;
        }
        /* Cursor color */
        .code-editor textarea {
          caret-color: #80a4c2 !important;
        }
        /* Selection color */
        .code-editor textarea::selection {
          background: rgba(128, 164, 194, 0.3) !important;
        }
      `}</style>
        </div>
    );
}
