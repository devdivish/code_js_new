import React from 'react';
import { Document } from '../../types'; // Adjust path to your types file
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DocumentViewerModalProps {
  document: Document;
  onClose: () => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ document, onClose }) => {
  // A basic modal structure. Replace with your actual viewer logic.
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-1/2 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold truncate" title={document.FileName}>
            Viewing: {document.FileName}
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6 overflow-y-auto">
          <p className="text-gray-700">
            This is where your document viewer component for "{document.FileName}" would go.
            You can embed a PDF viewer or an image tag here.
          </p>
          {/* Example: <iframe src={`/path/to/docs/${document.FileName}`} width="100%" height="600px" /> */}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;