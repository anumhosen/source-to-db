import { useState, useRef, useEffect } from 'react';
import { VscCloudDownload, VscWarning, VscCheck } from 'react-icons/vsc';
import Modal from './Modal';

const recentUrls = [];

export default function GitCloneModal({ isOpen, onClose, onClone }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationState, setValidationState] = useState(''); // 'valid' | 'invalid' | ''
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setError('');
      setValidationState('');
      setLoading(false);
      // Focus input after modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const validateUrl = (value) => {
    if (!value.trim()) {
      setValidationState('');
      return false;
    }

    // Basic Git URL validation
    const gitUrlPattern = /^(https?:\/\/|git@|ssh:\/\/)[^\s]+\.git$/i;
    const githubPattern = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/i;
    const gitlabPattern = /^https?:\/\/gitlab\.com\/[\w.-]+\/[\w.-]+(\.git)?$/i;
    const bitbucketPattern = /^https?:\/\/bitbucket\.org\/[\w.-]+\/[\w.-]+(\.git)?$/i;

    if (
      gitUrlPattern.test(value) ||
      githubPattern.test(value) ||
      gitlabPattern.test(value) ||
      bitbucketPattern.test(value)
    ) {
      setValidationState('valid');
      return true;
    }

    // Simple URL check for common patterns
    if (
      value.includes('github.com') ||
      value.includes('gitlab.com') ||
      value.includes('bitbucket.org') ||
      value.endsWith('.git')
    ) {
      setValidationState('valid');
      return true;
    }

    setValidationState('invalid');
    return false;
  };

  const handleUrlChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    setError('');
    validateUrl(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('Please enter a Git repository URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onClone(url.trim());
      // Save to recent URLs
      if (!recentUrls.includes(url.trim())) {
        recentUrls.unshift(url.trim());
        if (recentUrls.length > 5) recentUrls.pop();
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to clone repository');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        validateUrl(text);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Clone Git Repository'>
      <form onSubmit={handleSubmit}>
        {/* URL Input */}
        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-400 mb-1.5'>Repository URL</label>
          <div className='relative'>
            <input
              ref={inputRef}
              type='text'
              value={url}
              onChange={handleUrlChange}
              placeholder='https://github.com/user/repo.git'
              className={`w-full pl-10 pr-10 py-2.5 bg-gray-800 border rounded-lg text-sm text-gray-200 
                         placeholder-gray-500 focus:outline-none transition-colors
                         ${
                           validationState === 'valid'
                             ? 'border-green-700 focus:border-green-500'
                             : validationState === 'invalid'
                               ? 'border-red-700 focus:border-red-500'
                               : 'border-gray-700 focus:border-indigo-500'
                         }`}
              disabled={loading}
            />
            <VscCloudDownload
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 
              ${validationState === 'valid' ? 'text-green-400' : 'text-gray-500'}`}
            />
            {validationState === 'valid' && (
              <VscCheck className='absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400' />
            )}
            <button
              type='button'
              onClick={handlePaste}
              className='absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] 
                         text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600 
                         rounded transition-colors'
              title='Paste from clipboard'
            >
              Paste
            </button>
          </div>
          {validationState === 'invalid' && (
            <p className='mt-1 text-xs text-red-400'>
              URL format might not be valid. Ensure it ends with .git or is a valid Git host URL.
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className='mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-2'>
            <VscWarning className='w-4 h-4 text-red-400 flex-shrink-0 mt-0.5' />
            <p className='text-sm text-red-300'>{error}</p>
          </div>
        )}

        {/* Examples */}
        <div className='mb-4 p-3 bg-gray-800/50 rounded-lg'>
          <p className='text-xs text-gray-500 mb-2'>Examples:</p>
          <div className='space-y-1'>
            {[
              'https://github.com/facebook/react.git',
              'https://gitlab.com/gitlab-org/gitlab.git',
              'git@github.com:user/repo.git',
            ].map((example) => (
              <button
                key={example}
                type='button'
                onClick={() => {
                  setUrl(example);
                  validateUrl(example);
                }}
                className='block w-full text-left text-xs text-gray-400 hover:text-gray-200 
                           hover:bg-gray-700 px-2 py-1 rounded transition-colors truncate'
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Recent URLs */}
        {recentUrls.length > 0 && (
          <div className='mb-4'>
            <p className='text-xs text-gray-500 mb-2'>Recent:</p>
            <div className='space-y-1'>
              {recentUrls.map((recentUrl, index) => (
                <button
                  key={index}
                  type='button'
                  onClick={() => {
                    setUrl(recentUrl);
                    validateUrl(recentUrl);
                  }}
                  className='block w-full text-left text-xs text-gray-400 hover:text-gray-200 
                             hover:bg-gray-700 px-2 py-1 rounded transition-colors truncate'
                >
                  {recentUrl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className='flex items-center justify-end gap-2 pt-2 border-t border-gray-800'>
          <button
            type='button'
            onClick={onClose}
            className='px-4 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 
                       rounded transition-colors'
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={loading || !url.trim()}
            className='flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 
                       disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium 
                       text-white transition-colors'
          >
            {loading ? (
              <>
                <div className='w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                Cloning...
              </>
            ) : (
              <>
                <VscCloudDownload className='w-3.5 h-3.5' />
                Clone Repository
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
