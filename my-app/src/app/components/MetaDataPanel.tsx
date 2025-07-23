import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Eye, X } from 'lucide-react';
import DateFormatter from '../components/DateFormatter'; // Adjust path if needed
import { Document } from '../types';

interface MetadataPanelProps {
  document: Document | null;
  onClose: () => void;
  onView: (document: Document) => void;
  onDownload: (document: Document) => void;
}

const MetadataPanel: React.FC<MetadataPanelProps> = ({
  document,
  onClose,
  onView,
  onDownload,
}) => {
  if (!document) return null;

  const fileName = document?.FileName || 'Document';
  const metadataEntries = Object.entries(document).filter(
    ([key]) => key !== 'Text' && key !== 'id'
  );

  return (
    <aside className="w-full md:w-1/4 h-full border-l border-gray-200 bg-slate-50 shadow-lg flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-1">
          <h3 className="text-lg font-semibold text-gray-800">Details</h3>

          {/* View Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(document)}
            title={`View ${fileName}`}
            aria-label={`View ${fileName}`}
          >
            <Eye className="h-5 w-5 text-gray-600 hover:text-gray-900" />
          </Button>

          {/* Download Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDownload(document)}
            title={`Download ${fileName}`}
            aria-label={`Download ${fileName}`}
          >
            <Download className="h-5 w-5 text-gray-600 hover:text-gray-900" />
          </Button>
        </div>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close metadata panel"
        >
          <X className="h-5 w-5 text-gray-600 hover:text-gray-900" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-3 items-start">
          {metadataEntries.map(([key, value]) => {
            if (key === 'highlighted_text') {
              return (
                <div key={key} className="col-span-2 mt-2">
                  <p className="text-sm font-medium text-gray-600 capitalize mb-1">
                    Highlighted Content
                  </p>
                  <div
                    className="p-3 bg-white border rounded-md text-sm text-gray-800 leading-relaxed metadata-highlights"
                    dangerouslySetInnerHTML={{ __html: String(value) }}
                  />
                </div>
              );
            }

            return (
              <React.Fragment key={key}>
                <p className="text-sm font-medium text-gray-600 capitalize whitespace-nowrap">
                  {key.replace(/_/g, ' ')}
                </p>
                <div className="text-sm text-gray-900 break-words text-left">
                  {key === 'DocumentDate' ? (
                    <DateFormatter dateString={String(value)} />
                  ) : (
                    <p>{String(value) || 'N/A'}</p>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default MetadataPanel;
