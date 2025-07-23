import React, { useState, useEffect } from 'react';

import { Modal } from './Modal';

interface DocumentActionsProps {
  filePath: string; 
  fileName: string; 
}

const DocumentActions: React.FC<DocumentActionsProps> = ({ filePath, fileName: initialFileName }) => {
  const [isViewButtonLoading, setIsViewButtonLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<string>('');
  const [isModalContentLoading, setIsModalContentLoading] = useState<boolean>(false);
  const [hasBeenViewed, setHasBeenViewed] = useState<boolean>(false);
  
  const fileName = initialFileName || "Document";

  // It's good practice to make URLs configurable, e.g., from environment variables
  const pythonServerUrl = process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || `http://192.168.10.144:8000`;

  const getFileExtension = (name: string): string | undefined => {
    const lastDot = name.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0 || lastDot === name.length - 1) {
      return undefined;
    }
    return name.substring(lastDot + 1).toLowerCase();
  };
  const fileExtension = getFileExtension(fileName);

  useEffect(() => {
    // Clear modal content when it's closed to free up memory
    if (!isModalOpen) {
      setModalContent('');
    }
  }, [isModalOpen]);

  const handleOpenDocument = async () => {
    if (!filePath) {
      console.error("No file path provided for viewing.");
      alert("File path is missing, cannot open document.");
      return;
    }
    setHasBeenViewed(true);
    setIsViewButtonLoading(true);

    const viewUrlBase = `${pythonServerUrl}/api/documents/${encodeURIComponent(filePath)}`;
    const modalViewExtensions = ['doc', 'docx', 'html'];

    if (fileExtension && modalViewExtensions.includes(fileExtension)) {
      setIsModalContentLoading(true);
      setModalContent(''); // Clear previous content
      setIsModalOpen(true);   // Open modal to show loader

      try {
        const response = await fetch(`${viewUrlBase}?action=view`);
        let responseText = await response.text(); // Read response text first

        if (!response.ok) {
          let errorDetail = responseText; // Default to full response text
          try {
            const errorJson = JSON.parse(responseText); // Try to parse as JSON
            errorDetail = errorJson.detail || errorJson.message || responseText;
          } catch (e) {
            // Not JSON, use the plain text
          }
          throw new Error(`Preview generation failed: ${response.status} ${response.statusText}. ${errorDetail}`);
        }
        
        if (!responseText.trim()) {
            setModalContent("<p>Preview is empty or could not be generated.</p>");
        } else {
            setModalContent(responseText);
        }
      } catch (error) {
        console.error("Error fetching document content for modal:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        // Display error within the modal for better UX than an alert
        setModalContent(`<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded"><p><strong>Error Loading Preview:</strong></p><p>${errorMessage}</p></div>`);
      } finally {
        setIsViewButtonLoading(false); // Button loading is done once modal attempt starts
        setIsModalContentLoading(false); // Modal content loading is done
      }
    } else {
      // For other file types, open in a new tab
      const viewUrl = `${viewUrlBase}?action=view`;
      try {
        const newTab = window.open(viewUrl, '_blank', 'noopener,noreferrer');
        if (!newTab) {
            // Recent alert("Failed to open the document. Your browser's pop-up blocker might have prevented it. Please check your settings.");
            console.log("dhfh fjfjbg j")

        }
      } catch (error) {
        console.error("Error opening document in new tab:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        alert(`Failed to open document: ${errorMessage}`);
      } finally {
        // Allow a brief moment for the tab to attempt opening, then reset.
        // If window.open fails immediately (e.g., due to browser settings), this might be too quick.
        // Consider only resetting loading if newTab was successfully created.
        setTimeout(() => setIsViewButtonLoading(false), 500);
      }
    }
  };

  const handleDownloadDocument = () => {
    if (!filePath) {
      console.error("No file path provided for downloading.");
      alert("File path is missing, cannot download document.");
      return;
    }
    const downloadUrl = `${pythonServerUrl}/api/documents/${encodeURIComponent(filePath)}?action=download`;
    
    try {
      // window.open is generally okay for downloads
      const newWindow = window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        // This can happen if popups are aggressively blocked.
        // An alternative is creating and clicking an <a> tag.
        console.log("new window not opended")
        // const link = document.createElement('a');
        // link.href = downloadUrl;
        // link.setAttribute('download', fileName); // Helps suggest a filename
        // document.body.appendChild(link);
        // link.click();
        // document.body.removeChild(link);
      }
    } catch (error) {
        console.error("Error initiating download:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        alert(`Failed to initiate download: ${errorMessage}`);
    }
  };

  if (!filePath) {
    return <p className="text-red-500">Error: File path is not specified for this document.</p>;
  }

  return (
    <>
      <div className="flex space-x-2 my-2">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleOpenDocument}
          disabled={isViewButtonLoading}
          title={`Open or preview document`}
        >
          {isViewButtonLoading ? "Preparing..." : hasBeenViewed ? "View Again" : "View"}
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
          onClick={handleDownloadDocument}
          title={`Download document`}
        >
          Download
        </button>
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={fileName} // Modal title is the user-friendly filename
        isLoading={isModalContentLoading}
      >
        {/* dangerouslySetInnerHTML is okay if you trust the HTML source (your backend conversion) */}
        {/* If backend HTML conversion could include user-input that isn't sanitized, then sanitize here or on backend */}
        <div dangerouslySetInnerHTML={{ __html: modalContent }} />
      </Modal>
    </>
  );
};

export default DocumentActions;