// frontend/src/components/Layout.jsx
import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import TitleBar from './TitleBar';
import Navbar from './Navbar';

export default function Layout() {
    const location = useLocation();
    const isDocBuilder = location.pathname.startsWith('/doc-builder');

    return (
        <div className='h-screen flex flex-col bg-gray-950 text-gray-200'>
            {/* Custom Title Bar */}
            <TitleBar />
            {/* Main Content */}
            <main className='flex-1 h-[calc(100%-40px)] overflow-hidden'>
                <Outlet />
            </main>
        </div>
    );
}
