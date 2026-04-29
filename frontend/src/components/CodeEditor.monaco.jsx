import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { VscCopy, VscCheck, VscChevronDown, VscWordWrap, VscListSelection } from 'react-icons/vsc';

// Monaco editor dark theme
const MONACO_DARK_THEME = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'constant', foreground: '4FC1FF' },
    ],
    colors: {
        'editor.background': '#011627',
        'editor.foreground': '#D6DEEB',
        'editor.lineHighlightBackground': '#0A1F33',
        'editor.selectionBackground': '#1E3A5F',
        'editor.inactiveSelectionBackground': '#0E2A45',
        'editorCursor.foreground': '#80A4C2',
        'editorLineNumber.foreground': '#4A5568',
        'editorLineNumber.activeForeground': '#80A4C2',
    },
};

const languageMap = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
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
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    yml: 'yaml',
    yaml: 'yaml',
    json: 'json',
    xml: 'xml',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    md: 'markdown',
    dockerfile: 'dockerfile',
};

export default function CodeEditor({ code, language, onChange, readOnly = false }) {
    const [copied, setCopied] = useState(false);
    const [wordWrap, setWordWrap] = useState('on');
    const [lineNumbers, setLineNumbers] = useState('on');
    const [currentLanguage, setCurrentLanguage] = useState('plaintext');
    const [lineCount, setLineCount] = useState(0);
    const [columnCount, setColumnCount] = useState(0);
    const editorRef = useRef(null);

    useEffect(() => {
        if (language) {
            setCurrentLanguage(languageMap[language.toLowerCase()] || language.toLowerCase());
        }
    }, [language]);

    useEffect(() => {
        if (code) {
            setLineCount(code.split('\n').length);
        }
    }, [code]);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        // Define custom theme
        monaco.editor.defineTheme('repodocs-dark', MONACO_DARK_THEME);
        monaco.editor.setTheme('repodocs-dark');

        // Track cursor position
        editor.onDidChangeCursorPosition((e) => {
            setLineCount(e.position.lineNumber);
            setColumnCount(e.position.column);
        });
    };

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

    const handleFormat = () => {
        if (editorRef.current) {
            editorRef.current.getAction('editor.action.formatDocument').run();
        }
    };

    return (
        <div className='flex flex-col h-full bg-[#011627] rounded-lg overflow-hidden border border-gray-800'>
            {/* Editor Header */}
            <div className='flex items-center justify-between px-3 py-1.5 bg-[#0a1f33] border-b border-gray-800'>
                <div className='flex items-center gap-2'>
                    <div className='flex items-center gap-1 px-2 py-1 bg-[#011627] border border-gray-700 rounded'>
                        <span className='text-[10px] text-gray-400 uppercase tracking-wider'>
                            {currentLanguage}
                        </span>
                    </div>
                </div>

                <div className='flex items-center gap-1'>
                    <button
                        onClick={handleFormat}
                        className='p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors'
                        title='Format document'
                    >
                        <VscListSelection className='w-3.5 h-3.5' />
                    </button>
                    <button
                        onClick={() => setWordWrap(wordWrap === 'on' ? 'off' : 'on')}
                        className={`p-1 rounded transition-colors ${
                            wordWrap === 'on'
                                ? 'bg-indigo-900/30 text-indigo-400'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                        }`}
                        title='Toggle word wrap'
                    >
                        <VscWordWrap className='w-3.5 h-3.5' />
                    </button>
                    <button
                        onClick={() => setLineNumbers(lineNumbers === 'on' ? 'off' : 'on')}
                        className={`p-1 rounded transition-colors ${
                            lineNumbers === 'on'
                                ? 'bg-indigo-900/30 text-indigo-400'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                        }`}
                        title='Toggle line numbers'
                    >
                        <span className='text-[10px] font-mono'>123</span>
                    </button>
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
            <div className='flex-1 min-h-0'>
                <Editor
                    height='100%'
                    language={currentLanguage}
                    value={code || ''}
                    onChange={(value) => onChange && onChange(value)}
                    onMount={handleEditorDidMount}
                    options={{
                        readOnly,
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineHeight: 20,
                        fontFamily:
                            '"Fira Code", "Fira Mono", "Consolas", "Monaco", "Courier New", monospace',
                        fontLigatures: true,
                        wordWrap,
                        lineNumbers,
                        renderWhitespace: 'selection',
                        bracketPairColorization: { enabled: true },
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        padding: { top: 16, bottom: 16 },
                        tabSize: 2,
                        insertSpaces: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true,
                        folding: true,
                        foldingStrategy: 'indentation',
                        showFoldingControls: 'always',
                        matchBrackets: 'always',
                        autoClosingBrackets: 'always',
                        autoClosingQuotes: 'always',
                        formatOnPaste: true,
                        formatOnType: true,
                        suggest: { showWords: true },
                        contextmenu: true,
                        multiCursorModifier: 'alt',
                        renderLineHighlight: 'all',
                        selectionHighlight: true,
                        occurrencesHighlight: true,
                        codeLens: false,
                        links: true,
                        colorDecorators: true,
                        lightbulb: { enabled: false },
                    }}
                    theme='repodocs-dark'
                    loading={
                        <div className='flex items-center justify-center h-full bg-[#011627]'>
                            <div className='text-gray-500 text-sm'>Loading editor...</div>
                        </div>
                    }
                />
            </div>

            {/* Editor Footer */}
            <div className='flex items-center justify-between px-3 py-1 bg-[#0a1f33] border-t border-gray-800'>
                <div className='flex items-center gap-3'>
                    <span className='text-[10px] text-gray-600'>UTF-8</span>
                    <span className='text-[10px] text-gray-600'>2 Spaces</span>
                </div>
                <div className='flex items-center gap-3 text-[10px] text-gray-600'>
                    <span>
                        Ln {lineCount}, Col {columnCount}
                    </span>
                    <span>{wordWrap === 'on' ? 'Wrap' : 'No Wrap'}</span>
                </div>
            </div>
        </div>
    );
}
