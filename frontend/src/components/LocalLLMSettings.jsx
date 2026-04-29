import { useState, useEffect } from 'react';
import {
  VscChip,
  VscFolderOpened,
  VscCheck,
  VscLoading,
  VscLink,
  VscTrash,
  VscInfo,
  VscArrowCircleDown,
} from 'react-icons/vsc';
import { useToast } from './Toast';

export default function LocalLLMSettings() {
  const [status, setStatus] = useState(null);
  const [models, setModels] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [s, m, r] = await Promise.all([
        window.api.getLLMStatus(),
        window.api.getModels(),
        window.api.getRecommendedModels(),
      ]);
      setStatus(s);
      setModels(m);
      setRecommended(r);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSelectModel = async () => {
    setLoading(true);
    try {
      const result = await window.api.selectModel();
      if (result?.success) {
        toast.success(`Model loaded: ${result.name}`);
        loadAll();
      } else if (result?.error) {
        toast.error(`Failed: ${result.error}`);
      }
    } catch (e) {
      toast.error('Failed to select model');
    }
    setLoading(false);
  };

  const handleUnloadModel = async () => {
    await window.api.unloadModel();
    toast.info('Model unloaded');
    loadAll();
  };

  const handleOpenModelsFolder = async () => {
    await window.api.openModelsFolder();
    setTimeout(loadAll, 1500);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes > 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
    return `${(bytes / 1e3).toFixed(0)} KB`;
  };

  return (
    <div className='space-y-4'>
      {/* Current Status */}
      <div
        className={`p-3 rounded-lg border ${
          status?.initialized ? 'bg-green-900/20 border-green-800' : 'bg-gray-800 border-gray-700'
        }`}
      >
        <div className='flex items-center gap-2'>
          <VscChip
            className={`w-4 h-4 ${status?.initialized ? 'text-green-400' : 'text-gray-500'}`}
          />
          <span className={`text-sm ${status?.initialized ? 'text-green-300' : 'text-gray-400'}`}>
            {status?.initialized ? `✓ Model loaded: ${status.modelName}` : 'No model loaded'}
          </span>
        </div>
      </div>

      {/* Model Actions */}
      <div className='flex gap-2'>
        <button
          onClick={handleSelectModel}
          disabled={loading}
          className='flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-900/30 
                     hover:bg-indigo-900/50 border border-indigo-800 rounded-lg text-sm
                     disabled:opacity-50 transition-colors'
        >
          {loading ? (
            <VscLoading className='w-4 h-4 animate-spin' />
          ) : (
            <VscFolderOpened className='w-4 h-4' />
          )}
          {status?.initialized ? 'Change Model' : 'Select Model File'}
        </button>

        {status?.initialized && (
          <button
            onClick={handleUnloadModel}
            className='px-3 py-2.5 bg-red-900/20 hover:bg-red-900/30 border border-red-800 
                       rounded-lg text-sm text-red-400 transition-colors'
          >
            <VscTrash className='w-4 h-4' />
          </button>
        )}
      </div>

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
          <h4 className='text-xs text-gray-500 uppercase tracking-wider mb-2'>Installed Models</h4>
          <div className='space-y-1'>
            {models.map((model) => (
              <div
                key={model.path}
                className='flex items-center justify-between p-2.5 bg-gray-800 rounded-lg'
              >
                <div>
                  <span className='text-sm text-gray-300'>{model.name}</span>
                  <span className='text-xs text-gray-500 ml-2'>{formatSize(model.size)}</span>
                </div>
                {status?.modelName === model.name ? (
                  <VscCheck className='w-4 h-4 text-green-400' />
                ) : (
                  <button
                    onClick={() => window.api.loadModel(model.path).then(loadAll)}
                    className='text-xs text-indigo-400 hover:text-indigo-300'
                  >
                    Load
                  </button>
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
          Recommended Models (click to download)
        </h4>
        <div className='space-y-2'>
          {recommended.map((model) => (
            <div key={model.name} className='p-3 bg-gray-800 rounded-lg'>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-sm font-medium text-gray-300'>{model.name}</span>
                <span className='text-xs text-gray-500'>{model.size}</span>
              </div>
              <p className='text-xs text-gray-500 mb-2'>{model.description}</p>
              <div className='flex items-center gap-2'>
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
                <span className='text-xs text-gray-600'>→ Save to Models folder</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
