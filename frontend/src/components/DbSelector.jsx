import { useState, useEffect, useRef } from 'react';
import { VscDatabase, VscNewFile, VscFolderOpened, VscChevronDown } from 'react-icons/vsc';
import { useAppContext } from '../context/AppContext';

export default function DbSelector() {
    const { dbPath, setDbPath, refreshRepos } = useAppContext();
    const [isOpen, setIsOpen] = useState(false);
    const [recentDbs, setRecentDbs] = useState([]);
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadRecentDbs();
    }, [dbPath]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadRecentDbs = async () => {
        const recent = await window.api.getRecentDatabases();
        setRecentDbs(recent || []);
    };

    const handleCreateDb = async () => {
        const result = await window.api.createDatabase();
        if (result) {
            setDbPath(result.path);
            await refreshRepos();
            setIsOpen(false);
        }
    };

    const handleOpenDb = async () => {
        const result = await window.api.selectDatabase();
        if (result) {
            setDbPath(result.path);
            await refreshRepos();
            setIsOpen(false);
        }
    };

    const handleSelectRecentDb = async (dbPath) => {
        const result = await window.api.openDatabase(dbPath);
        if (result) {
            setDbPath(result.path);
            await refreshRepos();
            setIsOpen(false);
        }
    };

    return (
        <div className='relative' ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className='flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 
                   border border-gray-700 hover:border-gray-600 transition-colors'
            >
                <VscDatabase className='w-4 h-4 text-gray-400' />
                <span className='max-w-[150px] truncate'>
                    {dbPath ? dbPath.split(/[/\\]/).pop() : 'No Database'}
                </span>
                <VscChevronDown
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className='absolute top-full left-0 mt-1 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50'>
                    <div className='p-2 border-b border-gray-800'>
                        <button
                            onClick={handleCreateDb}
                            className='w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition-colors'
                        >
                            <VscNewFile className='w-4 h-4 text-green-400' />
                            Create New Database
                        </button>
                        <button
                            onClick={handleOpenDb}
                            className='w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition-colors'
                        >
                            <VscFolderOpened className='w-4 h-4 text-blue-400' />
                            Open Database File
                        </button>
                    </div>

                    {recentDbs.length > 0 && (
                        <div className='p-2'>
                            <div className='px-3 py-1 text-xs text-gray-500 font-medium uppercase tracking-wider'>
                                Recent Databases
                            </div>
                            {recentDbs.map((db, index) => (
                                <button
                                    key={db.path}
                                    onClick={() => handleSelectRecentDb(db.path)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors
                    ${
                        dbPath === db.path
                            ? 'bg-indigo-900/30 text-indigo-300'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    }`}
                                >
                                    <VscDatabase className='w-3.5 h-3.5 flex-shrink-0' />
                                    <div className='flex-1 text-left truncate'>
                                        <div className='truncate'>{db.name}</div>
                                        <div className='text-xs text-gray-600 truncate'>
                                            {db.path}
                                        </div>
                                    </div>
                                    {dbPath === db.path && (
                                        <div className='w-2 h-2 rounded-full bg-green-500 flex-shrink-0'></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
