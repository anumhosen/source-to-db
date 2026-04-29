import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function Settings() {
    const { apiKey, setApiKey, dbPath } = useAppContext();
    const [inputKey, setInputKey] = useState(apiKey);
    const [saved, setSaved] = useState(false);

    const handleSaveKey = async () => {
        const success = await window.api.setApiKey(inputKey);
        if (success) {
            setApiKey(inputKey);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    return (
        <div className='max-w-xl mx-auto'>
            <h1 className='text-2xl font-bold mb-6 text-gray-100'>Settings</h1>
            <div className='bg-gray-900 rounded-lg p-6 space-y-6'>
                <div>
                    <label className='block text-sm text-gray-400 mb-2'>Database Location</label>
                    <div className='flex items-center gap-2 bg-gray-800 border border-gray-700 rounded px-3 py-2'>
                        <svg
                            className='w-4 h-4 text-gray-500 flex-shrink-0'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                d='M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16'
                            />
                        </svg>
                        <span className='text-gray-400 text-sm truncate'>
                            {dbPath || 'No database selected'}
                        </span>
                    </div>
                </div>

                <div>
                    <label className='block text-sm text-gray-400 mb-2'>Gemini API Key</label>
                    <input
                        type='password'
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder='Enter your Google Gemini API key'
                        className='w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-200 
                       placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors'
                    />
                    <p className='text-xs text-gray-500 mt-1'>
                        Required for AI-powered code explanations. Get your key at{' '}
                        <a
                            href='https://aistudio.google.com/apikey'
                            target='_blank'
                            rel='noreferrer'
                            className='text-indigo-400 hover:text-indigo-300'
                        >
                            Google AI Studio
                        </a>
                    </p>
                </div>

                <button
                    onClick={handleSaveKey}
                    disabled={!inputKey}
                    className={`w-full py-2 rounded font-medium transition-colors ${
                        saved
                            ? 'bg-green-800 text-green-200 hover:bg-green-700'
                            : 'bg-indigo-900 text-gray-200 hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                >
                    {saved ? '✓ API Key Saved' : 'Save API Key'}
                </button>
            </div>
        </div>
    );
}
