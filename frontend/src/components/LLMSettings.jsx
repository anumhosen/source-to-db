import { useState, useEffect } from 'react';
import {
  VscChip,
  VscCloud,
  VscFolderOpened,
  VscCheck,
  VscLoading,
  VscLink,
  VscInfo,
  VscArrowCircleDown,
} from 'react-icons/vsc';

export default function LLMSettings() {
  const [provider, setProvider] = useState('local');
  const [status, setStatus] = useState(null);
  const [models, setModels] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatus();
    loadModels();
    loadRecommended();
  }, []);

  const loadStatus = async () => {
    try {
      const s = await window.api.getLLMStatus();
      setStatus(s);
      if (s.provider) setProvider(s.provider);
    } catch (e) {
      console.warn(e);
    }
  };

  const loadModels = async () => {
    try {
      const m = await window.api.getLLMModels();
      setModels(m);
    } catch (e) {
      console.warn(e);
    }
  };

  const loadRecommended = async () => {
    try {
      const r = await window.api.getRecommendedModels();
      setRecommended(r);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSelectModel = async () => {
    setLoading(true);
    try {
      const result = await window.api.selectLocalModel();
      if (result?.success) {
        setStatus({ provider: 'local', initialized: true, model: result.name });
        loadModels();
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleOpenModelsFolder = async () => {
    await window.api.openModelsFolder();
    // Refresh after a delay
    setTimeout(loadModels, 2000);
  };

  return (
    <div className='space-y-4'>
      {/* Provider Selection */}
      <div>
        <h3 className='text-sm font-semibold text-gray-300 mb-2'>LLM Provider</h3>
        <div className='flex gap-2'>
          <button
            onClick={() => setProvider('local')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors
              ${
                provider === 'local'
                  ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-700'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
              }`}
          >
            <VscChip className='w-4 h-4' />
            Local (llama.cpp)
          </button>
          <button
            onClick={() => setProvider('gemini')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors
              ${
                provider === 'gemini'
                  ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-700'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
              }`}
          >
            <VscCloud className='w-4 h-4' />
            Gemini API
          </button>
        </div>
      </div>

      {/* Status */}
      <div className='p-3 bg-gray-800 rounded-lg'>
        <p className='text-sm text-gray-400'>
          Status:{' '}
          <span className={status?.initialized ? 'text-green-400' : 'text-red-400'}>
            {status?.initialized
              ? `✓ Connected (${status.model || status.provider})`
              : '✗ Not configured'}
          </span>
        </p>
      </div>

      {/* Local Model Section */}
      {provider === 'local' && (
        <>
          <button
            onClick={handleSelectModel}
            disabled={loading}
            className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-900/20 
                       hover:bg-indigo-900/30 border border-indigo-800 rounded-lg text-sm
                       disabled:opacity-50 transition-colors'
          >
            {loading ? (
              <VscLoading className='w-4 h-4 animate-spin' />
            ) : (
              <VscFolderOpened className='w-4 h-4' />
            )}
            {loading ? 'Loading...' : 'Select GGUF Model File'}
          </button>

          <button
            onClick={handleOpenModelsFolder}
            className='w-full flex items-center justify-center gap-2 px-4 py-2 
                       bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-400 transition-colors'
          >
            <VscFolderOpened className='w-4 h-4' />
            Open Models Folder
          </button>

          {/* Installed Models */}
          {models.length > 0 && (
            <div>
              <h4 className='text-xs text-gray-500 uppercase tracking-wider mb-2'>
                Installed Models
              </h4>
              <div className='space-y-1'>
                {models.map((model) => (
                  <div
                    key={model.path}
                    className='flex items-center justify-between p-2 bg-gray-800 rounded'
                  >
                    <div>
                      <span className='text-sm text-gray-300'>{model.name}</span>
                      <span className='text-xs text-gray-500 ml-2'>
                        {(model.size / 1024 / 1024 / 1024).toFixed(1)} GB
                      </span>
                    </div>
                    {status?.model === model.name && (
                      <VscCheck className='w-4 h-4 text-green-400' />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Models */}
          <div>
            <h4 className='text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1'>
              <VscInfo className='w-3 h-3' />
              Recommended Models
            </h4>
            <div className='space-y-2'>
              {recommended.map((model) => (
                <div key={model.name} className='p-3 bg-gray-800 rounded-lg'>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-sm font-medium text-gray-300'>{model.name}</span>
                    <span className='text-xs text-gray-500'>{model.size}</span>
                  </div>
                  <p className='text-xs text-gray-500 mb-1'>{model.description}</p>
                  <a
                    href={model.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1'
                  >
                    <VscArrowCircleDown className='w-3 h-3' />
                    Download
                    <VscLink className='w-3 h-3' />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
