// Modal.tsx (or at the top of DocumentActions.tsx)
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    // Overlay
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close modal if overlay is clicked
    >
      {/* Modal content */}
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col z-50"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 break-all">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl p-1 leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        {/* Modal Body (scrollable) */}
        <div className="p-5 flex-grow overflow-y-auto">
          {/* Apply Tailwind Typography for better default HTML styling if you have the plugin */}
          {/* npm install -D @tailwindcss/typography */}
          {/* then add require('@tailwindcss/typography') to tailwind.config.js plugins */}
          <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
             {children}
          </div>
        </div>
        {/* Modal Footer */}
        <div className="flex items-center justify-end p-4 border-t border-gray-200 rounded-b">
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

// If not using Tailwind Typography, the line in Modal Body can be simplified to:
// {children}
// And you might want to add some basic styling for HTML elements manually if needed.