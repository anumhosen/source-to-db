// frontend/src/App.jsx
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import EditorView from './pages/EditorView';
import DocView from './pages/DocView';
import DocBuilder from './pages/DocBuilder';
import Settings from './pages/Settings';

export default function App() {
    return (
        <AppProvider>
            <HashRouter>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path='/' element={<Home />} />
                        <Route path='/editor/:repoId' element={<EditorView />} />
                        <Route path='/docs/:repoId' element={<DocView />} />
                        <Route path='/doc-builder/:repoId' element={<DocBuilder />} />
                        <Route path='/settings' element={<Settings />} />
                    </Route>
                </Routes>
            </HashRouter>
        </AppProvider>
    );
}
