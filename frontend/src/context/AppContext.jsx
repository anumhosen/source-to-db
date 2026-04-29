import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [dbPath, setDbPath] = useState(null);
    const [repos, setRepos] = useState([]);
    const [apiKey, setApiKey] = useState('');

    const refreshRepos = useCallback(async () => {
        if (!dbPath) return;
        try {
            const list = await window.api.getRepos();
            setRepos(list || []);
        } catch (error) {
            console.error('Failed to fetch repos:', error);
        }
    }, [dbPath]);

    return (
        <AppContext.Provider value={{ dbPath, setDbPath, repos, refreshRepos, apiKey, setApiKey }}>
            {children}
        </AppContext.Provider>
    );
}

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
};
