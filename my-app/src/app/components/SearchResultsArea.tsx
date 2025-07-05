// src/components/SearchResultsArea.tsx
import React from 'react';
// Import related components and types
import DocumentCard from './DocumentCard';
import DateFormatter from './DateFormatter'; // Pass down if DocumentCard needs it
import { DocumentButton } from './DocumentButton'; // Pass down if DocumentCard needs it
import { Document } from '../types'; // Assuming Document type is in ../types.ts

interface SearchResultsAreaProps {
  loading: boolean;
  error: string | null;
  documents: Document[];
  searchQuery: string[]; // Needed for 'no results' message context
  searchAfter: any[] | null; // For 'Load More' button
  fetchDocuments: (isLoadMore: boolean ) => void; // Function to load more
  handleAttachmentLinkClick: (doc: Document) => void; // Function for attachment link
  currentViewTitle?: string | null; // Optional title for context (e.g., showing attachments)
}

const SearchResultsArea: React.FC<SearchResultsAreaProps> = ({
  loading,
  error,
  documents,
  searchQuery,
  searchAfter,
  fetchDocuments,
  handleAttachmentLinkClick,
  currentViewTitle,
}) => {

  const hasResults = Array.isArray(documents) && documents.length > 0;
  const canLoadMore = !loading && searchAfter && !currentViewTitle; // Show load more only for main search with pagination info

  return (
    <div className="w-full">
      {/* Optional: Display context title */}
      {currentViewTitle && <h2 className="text-xl font-semibold mb-4 text-gray-700">{currentViewTitle}</h2>}

      {/* Error Display */}
      {error && !loading && <p className="text-red-500 p-4 bg-red-100 border border-red-400 rounded mb-4">Error: {error}</p>}

      {/* Loading Indicator */}
      {loading && (
          <div className="text-center mt-6">
              <p>Loading...</p>
              {/* You can add a spinner SVG or component here */}
          </div>
      )}

      {/* No Results Messages */}
      {!error && !loading && !hasResults && (searchQuery || currentViewTitle) && (
          <p className="text-gray-600">No documents found matching your criteria.</p>
      )}
      {!error && !loading && !hasResults && !searchQuery && !currentViewTitle && (
          <p className="text-gray-600">Please enter a search query or select filters to begin.</p>
      )}

      {/* Document List */}
      {!loading && hasResults && (
        <div className="space-y-6">
          {documents.map((doc) => (
            <DocumentCard
              // Pass necessary props to each card
              key={doc.PropId || `${doc.FileName}-${doc.DocumentDate}`} // Use stable key
              doc={doc}
              handleAttachmentLinkClick={handleAttachmentLinkClick}
              // Pass down components/props if DocumentCard needs them directly
              // DateFormatter={DateFormatter}
              // DocumentButton={DocumentButton}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {canLoadMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchDocuments(true)} // Pass true to indicate loading more
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            disabled={loading} // Disable button while loading
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResultsArea;