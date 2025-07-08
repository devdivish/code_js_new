import React, { useState, useEffect } from 'react';


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, isLoading }) => {
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
        <div className="p-5 flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-600">Loading preview...</p>
              {/* Optional: Add a spinner SVG or component here */}
            </div>
          ) : (
            <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
               {children}
            </div>
          )}
        </div>
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