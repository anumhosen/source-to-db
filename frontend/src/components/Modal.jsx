import { useEffect, useRef } from 'react';
import { VscClose } from 'react-icons/vsc';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'
    >
      <div
        ref={modalRef}
        className={`${maxWidth} w-full mx-4 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl transform transition-all`}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-3 border-b border-gray-800'>
          <h2 className='text-base font-semibold text-gray-200'>{title}</h2>
          <button
            onClick={onClose}
            className='p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors'
          >
            <VscClose className='w-4 h-4' />
          </button>
        </div>

        {/* Body */}
        <div className='px-5 py-4'>{children}</div>
      </div>
    </div>
  );
}
