import { VscWand, VscInfo } from 'react-icons/vsc';
import { useNavigate } from 'react-router-dom';

export default function AIPanel({ fields, onChange, onGenerate, modelLoaded }) {
  const navigate = useNavigate();

  const update = (key, value) => {
    if (onChange) {
      onChange({ ...fields, [key]: value });
    }
  };

  return (
    <div className='flex flex-col h-full bg-gray-900 rounded-lg border border-gray-800 overflow-hidden'>
      <div className='flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700'>
        <span className='text-xs text-gray-500 uppercase tracking-wider'>Documentation</span>
        {!modelLoaded ? (
          <button
            onClick={() => navigate('/settings')}
            className='flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition-colors'
          >
            <VscInfo className='w-3 h-3' />
            Load Model
          </button>
        ) : (
          <button
            onClick={onGenerate}
            className='flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors'
          >
            <VscWand className='w-3 h-3' />
            Generate
          </button>
        )}
      </div>

      {!modelLoaded && (
        <div className='m-3 p-3 bg-yellow-900/10 border border-yellow-900/30 rounded-lg'>
          <div className='flex items-start gap-2'>
            <VscInfo className='w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-xs text-yellow-400 font-medium mb-0.5'>No AI Model Loaded</p>
              <p className='text-xs text-gray-500'>
                Download and select a GGUF model in Settings to enable AI documentation
              </p>
            </div>
          </div>
        </div>
      )}

      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        <div>
          <label className='block text-xs text-gray-500 mb-1.5 font-medium'>Header / Title</label>
          <input
            className='w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 
                       focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600'
            value={fields?.header || ''}
            onChange={(e) => update('header', e.target.value)}
            placeholder='File title...'
          />
        </div>

        <div>
          <label className='block text-xs text-gray-500 mb-1.5 font-medium'>Explanation</label>
          <textarea
            className='w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 
                       focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600 resize-none'
            style={{ minHeight: '200px' }}
            value={fields?.explanation || ''}
            onChange={(e) => update('explanation', e.target.value)}
            placeholder={
              modelLoaded
                ? 'Click Generate or type manually...'
                : 'Load a model to enable AI generation...'
            }
          />
        </div>

        <div>
          <label className='block text-xs text-gray-500 mb-1.5 font-medium'>Footnote / Notes</label>
          <textarea
            className='w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 
                       focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600 resize-none'
            style={{ minHeight: '80px' }}
            value={fields?.footnote || ''}
            onChange={(e) => update('footnote', e.target.value)}
            placeholder='Additional notes...'
          />
        </div>
      </div>
    </div>
  );
}
