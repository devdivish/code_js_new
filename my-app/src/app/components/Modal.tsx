import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  viewUrl?: string; // NEW: Optional prop for the "Open in new page" link
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, isLoading, viewUrl }) => {
  // NEW: Effect to handle Escape key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 break-all truncate" title={title}>{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl p-1 leading-none flex-shrink-0 ml-2"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="p-5 flex-grow overflow-y-auto bg-gray-50">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-600">Loading preview...</p>
            </div>
          ) : (
            // UPDATED: Styling for a more "Medium-like" article view
            <div className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-4xl mx-auto bg-white p-8 rounded-sm shadow-sm">
               {children}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between p-4 border-t border-gray-200 rounded-b">
          {/* NEW: "Open in new page" button */}
          {viewUrl ? (
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Open document in new page
            </a>
          ) : (
            <div /> // Empty div to keep the "Close" button to the right
          )}
          <button
            type="button"
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
