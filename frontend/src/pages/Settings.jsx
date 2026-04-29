import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import LocalLLMSettings from '../components/LocalLLMSettings';

export default function Settings() {
  const [status, setStatus] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const s = await window.api.getSettingsStatus();
      setStatus(s);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className='h-full mx-auto px-10 lg:px-80 py-4 overflow-auto'>
      <h1 className='text-2xl font-bold text-gray-100 mb-6'>Settings</h1>

      {/* Status Overview */}
      <div className='bg-gray-900 rounded-lg p-5 border border-gray-800 mb-4'>
        <h2 className='text-sm font-semibold text-gray-300 mb-3'>Status</h2>
        <div className='space-y-2'>
          <div className='flex items-center justify-between p-2 bg-gray-800 rounded'>
            <span className='text-sm text-gray-400'>Database</span>
            <span className={`text-sm ${status?.database ? 'text-green-400' : 'text-red-400'}`}>
              {status?.database ? '✓ Connected' : '✗ Not connected'}
            </span>
          </div>
          <div className='flex items-center justify-between p-2 bg-gray-800 rounded'>
            <span className='text-sm text-gray-400'>AI Model</span>
            <span
              className={`text-sm ${status?.modelLoaded ? 'text-green-400' : 'text-yellow-400'}`}
            >
              {status?.modelLoaded ? `✓ ${status.modelName}` : 'Select a model below'}
            </span>
          </div>
        </div>
      </div>

      {/* Local LLM Settings */}
      <div className='bg-gray-900 rounded-lg p-5 border border-gray-800'>
        <h2 className='text-sm font-semibold text-gray-300 mb-4'>Local AI Model</h2>
        <p className='text-xs text-gray-500 mb-4'>
          Runs entirely on your machine. No internet required. No API keys needed.
        </p>
        <LocalLLMSettings />
      </div>
    </div>
  );
}
