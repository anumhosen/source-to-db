import { useState, useRef, useEffect } from 'react';
import {
  VscFolderOpened,
  VscFolder,
  VscAdd,
  VscRefresh,
  VscWarning,
  VscInfo,
  VscVersions,
  VscRootFolder,
  VscFileDirectory,
  VscFiles,
  VscSymbolField,
} from 'react-icons/vsc';
import Modal from './Modal';

export default function LocalRepoModal({ isOpen, onClose, onAdd }) {
  const [folderPath, setFolderPath] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [folderStats, setFolderStats] = useState(null);
  const [defaultVersion, setDefaultVersion] = useState('1.0.0');
  const versionInputRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFolderPath('');
      setVersion(defaultVersion);
      setError('');
      setLoading(false);
      setFolderStats(null);
    }
  }, [isOpen, defaultVersion]);

  // Parse folder info when path changes
  useEffect(() => {
    if (folderPath && window.electronAPI) {
      getFolderInfo(folderPath);
    } else {
      setFolderStats(null);
    }
  }, [folderPath]);

  const getFolderInfo = async (path) => {
    try {
      // Try to detect version from package.json, setup.py, etc.
      const info = await window.api.getFolderInfo?.(path);
      if (info) {
        setFolderStats(info);
        if (info.suggestedVersion && !version) {
          setVersion(info.suggestedVersion);
          setDefaultVersion(info.suggestedVersion);
        }
      }
    } catch (err) {
      console.warn('Could not get folder info:', err);
    }
  };

  // Handle folder selection via Electron dialog
  const handleBrowseFolder = async () => {
    try {
      const result = await window.api.selectFolder();
      if (result && result.path) {
        setFolderPath(result.path);
        setError('');
      }
    } catch (err) {
      setError('Failed to select folder: ' + err.message);
    }
  };

  // Validate version string
  const validateVersion = (ver) => {
    if (!ver.trim()) return 'Version is required';

    // Semantic versioning validation
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/;
    const relaxedRegex = /^[a-zA-Z0-9._-]+$/;

    if (!semverRegex.test(ver) && !relaxedRegex.test(ver)) {
      return 'Version format is invalid (e.g., 1.0.0, 2.1.3-beta)';
    }

    return null;
  };

  // Common version suggestions
  const versionSuggestions = [
    '1.0.0',
    '2.0.0',
    '1.0.0-alpha',
    '0.1.0',
    '3.0.0',
    'latest',
    'main',
    'develop',
  ];

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate folder
    if (!folderPath.trim()) {
      setError('Please select a folder');
      return;
    }

    // Validate version
    const versionError = validateVersion(version);
    if (versionError) {
      setError(versionError);
      versionInputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onAdd(folderPath.trim(), version.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add local repository');
    } finally {
      setLoading(false);
    }
  };

  // Get folder name from path
  const folderName = folderPath ? folderPath.split(/[/\\]/).pop() : '';

  // Get parent path
  const parentPath = folderPath
    ? folderPath.substring(
        0,
        folderPath.lastIndexOf(/[/\\]/.test(folderPath) ? folderPath.match(/[/\\]/g).pop() : '/'),
      )
    : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Add Local Repository' maxWidth='max-w-xl'>
      <form onSubmit={handleSubmit}>
        {/* Folder Selection */}
        <div className='mb-5'>
          <label className='block text-sm font-medium text-gray-400 mb-2'>Repository Folder</label>

          {/* Browse Button */}
          <button
            type='button'
            onClick={handleBrowseFolder}
            className='w-full flex items-center gap-3 px-4 py-3 bg-gray-800 border border-gray-700 
                       rounded-lg hover:border-indigo-600 transition-all group'
          >
            <div
              className='w-10 h-10 rounded-lg bg-indigo-900/30 flex items-center justify-center 
                            group-hover:bg-indigo-900/50 transition-colors'
            >
              <VscFolderOpened className='w-5 h-5 text-indigo-400' />
            </div>
            <div className='flex-1 text-left'>
              <p className='text-sm text-gray-300 font-medium'>
                {folderPath ? 'Change Folder' : 'Browse for Folder'}
              </p>
              <p className='text-xs text-gray-500 mt-0.5'>
                Select the root directory of your repository
              </p>
            </div>
            <VscFolderOpened className='w-4 h-4 text-gray-500 group-hover:text-indigo-400 transition-colors' />
          </button>

          {/* Selected Folder Info */}
          {folderPath && (
            <div className='mt-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg'>
              <div className='flex items-start gap-3'>
                <VscRootFolder className='w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5' />
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h4 className='text-sm font-medium text-gray-200 truncate'>{folderName}</h4>
                    <span className='text-[10px] px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded font-medium flex-shrink-0'>
                      SELECTED
                    </span>
                  </div>
                  <p className='text-xs text-gray-500 truncate'>{parentPath}</p>

                  {/* Folder Stats */}
                  {folderStats && (
                    <div className='flex items-center gap-3 mt-2 pt-2 border-t border-gray-700'>
                      <div className='flex items-center gap-1 text-xs text-gray-500'>
                        <VscFiles className='w-3.5 h-3.5' />
                        {folderStats.fileCount || '?'} files
                      </div>
                      {folderStats.language && (
                        <div className='flex items-center gap-1 text-xs text-gray-500'>
                          <VscSymbolField className='w-3.5 h-3.5' />
                          {folderStats.language}
                        </div>
                      )}
                      {folderStats.hasPackageJson && (
                        <span className='text-[10px] px-1.5 py-0.5 bg-blue-900/20 text-blue-400 rounded'>
                          NPM
                        </span>
                      )}
                      {folderStats.hasGit && (
                        <span className='text-[10px] px-1.5 py-0.5 bg-orange-900/20 text-orange-400 rounded'>
                          GIT
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* No folder selected */}
          {!folderPath && (
            <p className='mt-2 text-xs text-gray-500 flex items-center gap-1'>
              <VscInfo className='w-3 h-3' />
              No folder selected. Click the button above to browse.
            </p>
          )}
        </div>

        {/* Version Input */}
        <div className='mb-5'>
          <label className='block text-sm font-medium text-gray-400 mb-2'>
            Version / Branch Tag
          </label>

          <div className='relative'>
            <VscVersions className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
            <input
              ref={versionInputRef}
              type='text'
              value={version}
              onChange={(e) => {
                setVersion(e.target.value);
                setError('');
              }}
              placeholder='e.g., 1.0.0, 2.1.3-beta, main'
              className='w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm 
                         text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500
                         transition-colors'
              disabled={loading}
            />
          </div>

          {/* Version Suggestions */}
          <div className='mt-2 flex flex-wrap gap-1.5'>
            {versionSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type='button'
                onClick={() => {
                  setVersion(suggestion);
                  setError('');
                }}
                className={`px-2.5 py-1 text-[11px] rounded transition-colors
                  ${
                    version === suggestion
                      ? 'bg-indigo-900/30 text-indigo-300 border border-indigo-700'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-700 border border-gray-700'
                  }`}
              >
                {suggestion}
              </button>
            ))}
            {folderStats?.suggestedVersion &&
              !versionSuggestions.includes(folderStats.suggestedVersion) && (
                <button
                  type='button'
                  onClick={() => {
                    setVersion(folderStats.suggestedVersion);
                    setError('');
                  }}
                  className='px-2.5 py-1 text-[11px] rounded bg-green-900/20 text-green-400 
                           border border-green-800 hover:bg-green-900/30 transition-colors'
                >
                  {folderStats.suggestedVersion} (detected)
                </button>
              )}
          </div>

          {/* Version format info */}
          <p className='mt-2 text-xs text-gray-600'>
            Use semantic versioning (e.g., 1.0.0) or descriptive tags (e.g., main, develop,
            release-2.0)
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className='mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-2'>
            <VscWarning className='w-4 h-4 text-red-400 flex-shrink-0 mt-0.5' />
            <p className='text-sm text-red-300'>{error}</p>
          </div>
        )}

        {/* Info Box */}
        <div className='mb-4 p-3 bg-gray-800/30 border border-gray-700 rounded-lg'>
          <div className='flex items-start gap-2'>
            <VscInfo className='w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-xs text-gray-400'>
                The repository will be imported with all text files. Binary files,
                <code className='mx-1 px-1 py-0.5 bg-gray-700 rounded text-gray-300'>
                  node_modules
                </code>
                , and hidden directories will be excluded automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center justify-end gap-2 pt-3 border-t border-gray-800'>
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
            disabled={loading || !folderPath || !version.trim()}
            className='flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 
                       disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium 
                       text-white transition-colors'
          >
            {loading ? (
              <>
                <div className='w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                Importing...
              </>
            ) : (
              <>
                <VscAdd className='w-3.5 h-3.5' />
                Import Repository
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
