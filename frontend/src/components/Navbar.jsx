// frontend/src/components/Navbar.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
    VscHome,
    VscEdit,
    VscEye,
    VscBook,
    VscSettings,
    VscDatabase,
    VscNewFile,
    VscFolderOpened,
    VscChevronDown,
    VscRepo,
    VscAdd,
    VscCloudDownload,
    VscTrash,
    VscSearch,
    VscClose,
} from 'react-icons/vsc';
import { useAppContext } from '../context/AppContext';

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { dbPath, setDbPath, repos, refreshRepos } = useAppContext();

    // State
    const [dbDropdownOpen, setDbDropdownOpen] = useState(false);
    const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
    const [addDropdownOpen, setAddDropdownOpen] = useState(false);
    const [recentDbs, setRecentDbs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    // Refs for click outside
    const dbRef = useRef(null);
    const repoRef = useRef(null);
    const addRef = useRef(null);

    // Load recent databases on mount and when dbPath changes
    useEffect(() => {
        loadRecentDbs();
    }, [dbPath]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dbRef.current && !dbRef.current.contains(event.target)) {
                setDbDropdownOpen(false);
            }
            if (repoRef.current && !repoRef.current.contains(event.target)) {
                setRepoDropdownOpen(false);
            }
            if (addRef.current && !addRef.current.contains(event.target)) {
                setAddDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadRecentDbs = async () => {
        try {
            const recent = await window.api.getRecentDatabases();
            setRecentDbs(recent || []);
        } catch (error) {
            console.error('Failed to load recent databases:', error);
        }
    };

    // Database handlers
    const handleCreateDb = async () => {
        try {
            const result = await window.api.createDatabase();
            if (result) {
                setDbPath(result.path);
                await refreshRepos();
                setDbDropdownOpen(false);
            }
        } catch (error) {
            console.error('Failed to create database:', error);
        }
    };

    const handleOpenDb = async () => {
        try {
            const result = await window.api.selectDatabase();
            if (result) {
                setDbPath(result.path);
                await refreshRepos();
                setDbDropdownOpen(false);
            }
        } catch (error) {
            console.error('Failed to open database:', error);
        }
    };

    const handleSelectRecentDb = async (path) => {
        try {
            const result = await window.api.openDatabase(path);
            if (result) {
                setDbPath(result.path);
                await refreshRepos();
                setDbDropdownOpen(false);
            }
        } catch (error) {
            console.error('Failed to open database:', error);
        }
    };

    // Repository handlers
    const handleAddLocal = async () => {
        try {
            const repo = await window.api.addLocalRepo();
            if (repo) {
                await refreshRepos();
                navigate(`/editor/${repo.id}`);
            }
            setAddDropdownOpen(false);
        } catch (error) {
            console.error('Failed to add local repo:', error);
        }
    };

    const handleAddGit = async () => {
        const url = prompt('Enter Git repository URL:');
        if (!url) return;
        try {
            const repo = await window.api.addGitRepo(url);
            if (repo) {
                await refreshRepos();
                navigate(`/editor/${repo.id}`);
            }
            setAddDropdownOpen(false);
        } catch (error) {
            console.error('Failed to add git repo:', error);
        }
    };

    // Navigation items
    const navItems = [
        { path: '/', icon: VscHome, label: 'Home', exact: true },
        { path: '/settings', icon: VscSettings, label: 'Settings' },
    ];

    // Check if a path is active
    const isActive = (path, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    // Get the current repo name if on a repo page
    const getCurrentRepoName = () => {
        const match = location.pathname.match(/\/(editor|docs|doc-builder)\/(\d+)/);
        if (match && repos.length > 0) {
            const repoId = parseInt(match[2]);
            const repo = repos.find((r) => r.id === repoId);
            return repo?.name || 'Repository';
        }
        return null;
    };

    const currentRepo = getCurrentRepoName();

    return (
        <nav
            className='flex items-center justify-between h-8 bg-gray-900 border-b border-gray-800 px-3 flex-shrink-0'
            style={{ WebkitAppRegion: 'no-drag' }}
        >
            {/* Left Section */}
            <div className='flex items-center gap-2'>
                {/* Database Selector */}
                <div className='relative' ref={dbRef}>
                    <button
                        onClick={() => {
                            setDbDropdownOpen(!dbDropdownOpen);
                            setRepoDropdownOpen(false);
                            setAddDropdownOpen(false);
                        }}
                        className='flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs 
                       text-gray-300 border border-gray-700 hover:border-gray-600 transition-colors'
                        title={dbPath || 'No database selected'}
                    >
                        <VscDatabase className='w-3.5 h-3.5 text-gray-400' />
                        <span className='max-w-[120px] truncate'>
                            {dbPath ? dbPath.split(/[/\\]/).pop() : 'No DB'}
                        </span>
                        <VscChevronDown
                            className={`w-3 h-3 text-gray-500 transition-transform ${dbDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {dbDropdownOpen && (
                        <div className='absolute top-full left-0 mt-1 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50'>
                            <div className='p-1.5 border-b border-gray-800'>
                                <button
                                    onClick={handleCreateDb}
                                    className='w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 rounded transition-colors'
                                >
                                    <VscNewFile className='w-3.5 h-3.5 text-green-400' />
                                    Create New Database
                                </button>
                                <button
                                    onClick={handleOpenDb}
                                    className='w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 rounded transition-colors'
                                >
                                    <VscFolderOpened className='w-3.5 h-3.5 text-blue-400' />
                                    Open Database File
                                </button>
                            </div>

                            {recentDbs.length > 0 && (
                                <div className='p-1.5 max-h-60 overflow-y-auto'>
                                    <div className='px-3 py-1 text-[10px] text-gray-500 font-semibold uppercase tracking-wider'>
                                        Recent Databases
                                    </div>
                                    {recentDbs.map((db) => (
                                        <button
                                            key={db.path}
                                            onClick={() => handleSelectRecentDb(db.path)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded transition-colors
                        ${
                            dbPath === db.path
                                ? 'bg-indigo-900/30 text-indigo-300'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                        }`}
                                        >
                                            <VscDatabase className='w-3.5 h-3.5 flex-shrink-0' />
                                            <div className='flex-1 text-left min-w-0'>
                                                <div className='truncate font-medium'>
                                                    {db.name}
                                                </div>
                                                <div className='text-[10px] text-gray-600 truncate'>
                                                    {db.path}
                                                </div>
                                            </div>
                                            {dbPath === db.path && (
                                                <div className='w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0'></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Separator */}
                <div className='w-px h-4 bg-gray-800'></div>

                {/* Main Navigation */}
                <div className='flex items-center gap-0.5'>
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors
                ${
                    isActive(item.path, item.exact)
                        ? 'bg-gray-800 text-gray-200'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
                        >
                            <item.icon className='w-3.5 h-3.5' />
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* Separator */}
                <div className='w-px h-4 bg-gray-800'></div>

                {/* Add Repository Dropdown */}
                <div className='relative' ref={addRef}>
                    <button
                        onClick={() => {
                            setAddDropdownOpen(!addDropdownOpen);
                            setDbDropdownOpen(false);
                            setRepoDropdownOpen(false);
                        }}
                        className='flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs 
                       text-gray-300 border border-gray-700 hover:border-gray-600 transition-colors'
                    >
                        <VscAdd className='w-3.5 h-3.5' />
                        Add
                    </button>

                    {addDropdownOpen && (
                        <div className='absolute top-full left-0 mt-1 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50'>
                            <div className='p-1.5'>
                                <button
                                    onClick={handleAddLocal}
                                    className='w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 rounded transition-colors'
                                >
                                    <VscRepo className='w-3.5 h-3.5 text-yellow-400' />
                                    Add Local Folder
                                </button>
                                <button
                                    onClick={handleAddGit}
                                    className='w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 rounded transition-colors'
                                >
                                    <VscCloudDownload className='w-3.5 h-3.5 text-orange-400' />
                                    Clone Git Repository
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Repository Navigation (shown when inside a repo) */}
                {currentRepo && (
                    <>
                        <div className='w-px h-4 bg-gray-800'></div>
                        <div className='flex items-center gap-0.5'>
                            <span className='text-xs text-gray-500 px-2 truncate max-w-[150px]'>
                                {currentRepo}
                            </span>
                            <Link
                                to={location.pathname.replace(/\/(docs|doc-builder)\//, '/editor/')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors
                  ${
                      isActive('/editor/')
                          ? 'bg-indigo-900/30 text-indigo-300'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                            >
                                <VscEdit className='w-3.5 h-3.5' />
                                Editor
                            </Link>
                            <Link
                                to={location.pathname.replace(/\/(editor|doc-builder)\//, '/docs/')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors
                  ${
                      isActive('/docs/')
                          ? 'bg-indigo-900/30 text-indigo-300'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                            >
                                <VscEye className='w-3.5 h-3.5' />
                                Doc View
                            </Link>
                            <Link
                                to={location.pathname.replace(/\/(editor|docs)\//, '/doc-builder/')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors
                  ${
                      isActive('/doc-builder/')
                          ? 'bg-green-900/30 text-green-300'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                            >
                                <VscBook className='w-3.5 h-3.5' />
                                Doc Builder
                            </Link>
                        </div>
                    </>
                )}
            </div>

            {/* Right Section */}
            <div className='flex items-center gap-2'>
                {/* Search Toggle */}
                <button
                    onClick={() => setShowSearch(!showSearch)}
                    className={`p-1.5 rounded transition-colors ${
                        showSearch
                            ? 'bg-gray-800 text-gray-200'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                    }`}
                    title='Search repositories'
                >
                    <VscSearch className='w-3.5 h-3.5' />
                </button>

                {/* Search Input */}
                {showSearch && (
                    <div className='flex items-center gap-1'>
                        <input
                            type='text'
                            placeholder='Search repositories...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className='w-48 px-2.5 py-1 bg-gray-800 border border-gray-700 rounded text-xs 
                         text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500'
                            autoFocus
                        />
                        <button
                            onClick={() => {
                                setShowSearch(false);
                                setSearchQuery('');
                            }}
                            className='p-1 text-gray-500 hover:text-gray-300'
                        >
                            <VscClose className='w-3.5 h-3.5' />
                        </button>
                    </div>
                )}

                {/* Repo Count Badge */}
                {dbPath && repos.length > 0 && (
                    <div className='flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400'>
                        <VscRepo className='w-3 h-3' />
                        {repos.length}
                    </div>
                )}
            </div>
        </nav>
    );
}
