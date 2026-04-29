import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import GitCloneModal from '../components/GitCloneModal';
import {
  VscDatabase,
  VscNewFile,
  VscFolderOpened,
  VscRepo,
  VscAdd,
  VscCloudDownload,
  VscEdit,
  VscEye,
  VscBook,
  VscTrash,
  VscSearch,
  VscClose,
  VscArrowRight,
  VscHistory,
  VscRefresh,
  VscWarning,
} from 'react-icons/vsc';

export default function Home() {
  const { dbPath, setDbPath, repos, refreshRepos } = useAppContext();
  const navigate = useNavigate();

  // State
  const [recentDbs, setRecentDbs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGitModal, setShowGitModal] = useState(false);

  // Load recent databases on mount
  useEffect(() => {
    loadRecentDbs();
  }, []);

  // Refresh when dbPath changes
  useEffect(() => {
    if (dbPath) {
      loadRecentDbs();
      refreshRepos();
    }
  }, [dbPath]);

  const loadRecentDbs = async () => {
    try {
      const recent = await window.api.getRecentDatabases();
      setRecentDbs(recent || []);
    } catch (error) {
      console.error('Failed to load recent databases:', error);
    }
  };

  const handleCreateDb = async () => {
    try {
      const result = await window.api.createDatabase();
      if (result) {
        setDbPath(result.path);
        await refreshRepos();
      }
    } catch (error) {
      setError('Failed to create database: ' + error.message);
    }
  };

  const handleOpenDb = async () => {
    try {
      const result = await window.api.selectDatabase();
      if (result) {
        setDbPath(result.path);
        await refreshRepos();
      }
    } catch (error) {
      setError('Failed to open database: ' + error.message);
    }
  };

  const handleSelectRecentDb = async (path) => {
    try {
      setLoading(true);
      const result = await window.api.openDatabase(path);
      if (result) {
        setDbPath(result.path);
        await refreshRepos();
      }
    } catch (error) {
      setError('Failed to open database: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocal = async () => {
    try {
      setLoading(true);
      const repo = await window.api.addLocalRepo();
      if (repo) {
        await refreshRepos();
        navigate(`/editor/${repo.id}`);
      }
    } catch (error) {
      setError('Failed to add local repo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Opens modal instead of using prompt()
  const handleAddGit = () => {
    if (!dbPath) {
      setError('Please open a database first');
      return;
    }
    setShowGitModal(true);
  };

  // UPDATED: Handles the actual clone from modal
  const handleGitClone = async (url) => {
    try {
      setLoading(true);
      const repo = await window.api.addGitRepo(url);
      if (repo) {
        await refreshRepos();
        navigate(`/editor/${repo.id}`);
      }
      return repo;
    } catch (error) {
      setError('Failed to add git repo: ' + error.message);
      throw error; // Re-throw for modal to handle
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRepo = async (id, name) => {
    if (
      !confirm(
        `Delete repository "${name}"?\nThis will remove all associated files and documentation.`,
      )
    )
      return;
    try {
      await window.api.deleteRepo(id);
      await refreshRepos();
    } catch (error) {
      setError('Failed to delete repository: ' + error.message);
    }
  };

  // Filter repos by search
  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className='h-full flex flex-col'>
      {/* Git Clone Modal */}
      <GitCloneModal
        isOpen={showGitModal}
        onClose={() => setShowGitModal(false)}
        onClone={handleGitClone}
      />

      {/* Error Banner */}
      {error && (
        <div className='mx-4 mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center justify-between flex-shrink-0'>
          <div className='flex items-center gap-2'>
            <VscWarning className='w-4 h-4 text-red-400 flex-shrink-0' />
            <p className='text-red-300 text-sm'>{error}</p>
          </div>
          <button onClick={() => setError(null)} className='text-red-400 hover:text-red-300 ml-4'>
            <VscClose className='w-4 h-4' />
          </button>
        </div>
      )}

      {!dbPath ? (
        /* ... No Database Selected State (same as before) ... */
        <div className='flex-1 flex items-center justify-center p-8'>
          <div className='max-w-2xl w-full'>
            {/* Welcome Section */}
            <div className='text-center mb-12'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-2xl mb-6'>
                <VscDatabase className='w-8 h-8 text-indigo-400' />
              </div>
              <h1 className='text-3xl font-bold text-gray-100 mb-3'>Welcome to RepoDocs</h1>
              <p className='text-gray-400 text-lg max-w-md mx-auto'>
                Import code repositories, generate AI documentation, and build polished docs
              </p>
            </div>

            {/* Quick Actions */}
            <div className='grid grid-cols-2 gap-4 mb-8'>
              <button
                onClick={handleCreateDb}
                className='flex flex-col items-center gap-3 p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-indigo-700 transition-all group'
              >
                <div className='w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center group-hover:bg-green-900/50 transition-colors'>
                  <VscNewFile className='w-6 h-6 text-green-400' />
                </div>
                <div className='text-center'>
                  <h3 className='text-gray-200 font-medium mb-1'>Create New Database</h3>
                  <p className='text-gray-500 text-sm'>Start fresh with a new database</p>
                </div>
              </button>
              <button
                onClick={handleOpenDb}
                className='flex flex-col items-center gap-3 p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-indigo-700 transition-all group'
              >
                <div className='w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-900/50 transition-colors'>
                  <VscFolderOpened className='w-6 h-6 text-blue-400' />
                </div>
                <div className='text-center'>
                  <h3 className='text-gray-200 font-medium mb-1'>Open Database File</h3>
                  <p className='text-gray-500 text-sm'>Browse for an existing database</p>
                </div>
              </button>
            </div>

            {/* Recent Databases */}
            {recentDbs.length > 0 && (
              <div className='bg-gray-900 border border-gray-800 rounded-xl overflow-hidden'>
                <div className='flex items-center justify-between px-5 py-3 border-b border-gray-800'>
                  <div className='flex items-center gap-2'>
                    <VscHistory className='w-4 h-4 text-gray-500' />
                    <h2 className='text-sm font-semibold text-gray-300'>Recent Databases</h2>
                  </div>
                  <span className='text-xs text-gray-600'>
                    {recentDbs.length} database{recentDbs.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className='divide-y divide-gray-800'>
                  {recentDbs.map((db, index) => (
                    <button
                      key={db.path}
                      onClick={() => handleSelectRecentDb(db.path)}
                      className='w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-800 transition-colors group text-left'
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${index === 0 ? 'bg-indigo-900/30' : 'bg-gray-800'}`}
                      >
                        <VscDatabase
                          className={`w-4 h-4 ${index === 0 ? 'text-indigo-400' : 'text-gray-500'}`}
                        />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <span className='text-gray-200 font-medium text-sm truncate'>
                            {db.name}
                          </span>
                          {index === 0 && (
                            <span className='text-[10px] px-1.5 py-0.5 bg-indigo-900/30 text-indigo-400 rounded font-medium'>
                              LATEST
                            </span>
                          )}
                        </div>
                        <div className='text-xs text-gray-600 truncate mt-0.5'>{db.path}</div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-gray-600'>{formatDate(db.timestamp)}</span>
                        <VscArrowRight className='w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors' />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Database Connected State */
        <div className='flex-1 flex flex-col p-4 overflow-hidden'>
          {/* Header */}
          <div className='flex items-center justify-between mb-6 flex-shrink-0'>
            <div>
              <h1 className='text-2xl font-bold text-gray-100'>Repositories</h1>
              <div className='flex items-center gap-2 mt-1'>
                <VscDatabase className='w-3.5 h-3.5 text-gray-500' />
                <span className='text-sm text-gray-500'>{dbPath.split(/[/\\]/).pop()}</span>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={refreshRepos}
                className='p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors'
                title='Refresh'
              >
                <VscRefresh className='w-4 h-4' />
              </button>
              <button
                onClick={handleAddLocal}
                className='flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors'
              >
                <VscAdd className='w-3.5 h-3.5' />
                Add Local
              </button>
              <button
                onClick={handleAddGit}
                className='flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 rounded text-sm transition-colors'
              >
                <VscCloudDownload className='w-3.5 h-3.5' />
                Clone Git
              </button>
            </div>
          </div>

          {/* Search */}
          {repos.length > 0 && (
            <div className='relative mb-4 flex-shrink-0'>
              <VscSearch className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' />
              <input
                type='text'
                placeholder='Search repositories...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-700'
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300'
                >
                  <VscClose className='w-4 h-4' />
                </button>
              )}
            </div>
          )}

          {/* Repo Grid */}
          {repos.length === 0 ? (
            <div className='flex-1 flex items-center justify-center'>
              <div className='text-center max-w-sm'>
                <div className='w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                  <VscRepo className='w-8 h-8 text-gray-600' />
                </div>
                <h3 className='text-lg font-semibold text-gray-300 mb-2'>No repositories yet</h3>
                <p className='text-gray-500 text-sm mb-6'>
                  Import a local folder or clone a Git repository to get started
                </p>
                <div className='flex gap-2 justify-center'>
                  <button
                    onClick={handleAddLocal}
                    className='flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors'
                  >
                    <VscAdd className='w-4 h-4' /> Add Local Folder
                  </button>
                  <button
                    onClick={handleAddGit}
                    className='flex items-center gap-1.5 px-4 py-2 bg-indigo-900 hover:bg-indigo-800 rounded-lg text-sm transition-colors'
                  >
                    <VscCloudDownload className='w-4 h-4' /> Clone Git Repo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className='flex-1 overflow-y-auto'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className='bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all group'
                  >
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex-1 min-w-0'>
                        <h3 className='text-gray-200 font-semibold text-base truncate'>
                          {repo.name}
                        </h3>
                        <div className='flex items-center gap-2 mt-1'>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-medium ${repo.source === 'git' ? 'bg-orange-900/30 text-orange-400' : 'bg-yellow-900/30 text-yellow-400'}`}
                          >
                            {repo.source === 'git' ? 'GIT' : 'LOCAL'}
                          </span>
                          <span className='text-xs text-gray-600 truncate'>{repo.version}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRepo(repo.id, repo.name)}
                        className='p-1 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all'
                        title='Delete'
                      >
                        <VscTrash className='w-3.5 h-3.5' />
                      </button>
                    </div>
                    <p className='text-xs text-gray-600 mb-3'>Added {formatDate(repo.timestamp)}</p>
                    <div className='flex flex-wrap gap-1.5'>
                      <button
                        onClick={() => navigate(`/editor/${repo.id}`)}
                        className='flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs transition-colors'
                      >
                        <VscEdit className='w-3 h-3' /> Editor
                      </button>
                      <button
                        onClick={() => navigate(`/docs/${repo.id}`)}
                        className='flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs transition-colors'
                      >
                        <VscEye className='w-3 h-3' /> Doc View
                      </button>
                      <button
                        onClick={() => navigate(`/doc-builder/${repo.id}`)}
                        className='flex items-center gap-1 px-2.5 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 rounded text-xs transition-colors'
                      >
                        <VscBook className='w-3 h-3' /> Doc Builder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {searchQuery && filteredRepos.length === 0 && (
                <div className='flex items-center justify-center py-12'>
                  <div className='text-center'>
                    <VscSearch className='w-12 h-12 text-gray-700 mx-auto mb-3' />
                    <p className='text-gray-500'>No repositories match "{searchQuery}"</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
