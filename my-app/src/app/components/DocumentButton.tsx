

import { useState } from 'react';
import { DocumentModal } from './DocumentModal'; // Assuming DocumentModal is in the same folder

interface DocumentButtonProps {
  filePath: string; // Full absolute path on server
  fileName: string; // Just the file name, e.g., "report.docx"
}

export const DocumentButton = ({ filePath, fileName }: DocumentButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContentType, setModalContentType] = useState<'html' | 'pdf' | 'image' | 'text' | 'unsupported'>('unsupported');
  const [modalContentSrc, setModalContentSrc] = useState("");
  const [loading, setLoading] = useState(false);

  const getFileExtension = (path: string) => path.split(".").pop()?.toLowerCase() || "";

  const 
  
  
  
  
  
  handleOpenDocument = async () => {
    setLoading(true);
    const fileExtension = getFileExtension(fileName); // Use fileName for extension
    const openUrl = `http://192.168.10.144:5000/open/${encodeURIComponent(filePath)}`;

    try {
      if (fileExtension === "docx" || fileExtension==="doc") {
        const response = await fetch(openUrl);
        if (!response.ok) throw new Error(`Failed to fetch DOCX: ${response.statusText}`);
        const data = await response.text();
        setModalContentSrc(data);
        setModalContentType('html');
        setIsModalOpen(true);
      } else if (fileExtension === "pdf") {
        setModalContentSrc(openUrl); // Pass URL directly for iframe/embed
        setModalContentType('pdf');
        setIsModalOpen(true);
      } else if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(fileExtension)) {
        setModalContentSrc(openUrl); // Pass URL directly for img
        setModalContentType('image');
        setIsModalOpen(true);
      } else if (["txt", "csv", "json", "xml", "md"].includes(fileExtension)) {
        const response = await fetch(openUrl);
        if (!response.ok) throw new Error(`Failed to fetch text content: ${response.statusText}`);
        const data = await response.text();
        setModalContentSrc(data);
        setModalContentType('text');
        setIsModalOpen(true);
      } else {
        // For PPTX, XLSX, etc., or if user prefers new tab for PDF/images
        // Option 1: Try to open in new tab (might download or show if browser supports)
        window.open(openUrl, "_blank");
        // Option 2: Show "unsupported" in modal and guide to download
        // setModalContentSrc("");
        // setModalContentType('unsupported');
        // setIsModalOpen(true);
        // console.log(`Unsupported file type for inline modal view: ${fileExtension}. Opening in new tab/downloading.`);
      }
    } catch (error) {
      console.error("Error opening document:", error);
      // Optionally, show an error message to the user
      alert(`Error opening document: ${error instanceof Error ? error.message : String(error)}`);
      setModalContentSrc(""); // Clear any stale content
      setModalContentType('unsupported'); // Or handle error state specifically
      // setIsModalOpen(true); // You might want to open the modal to show an error message
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = () => {
    // Uses the /download endpoint from your FastAPI backend
    const downloadUrl = `http://192.168.10.144:5000/download/${encodeURIComponent(filePath)}`;
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', fileName || 'download'); // Suggests a filename to the browser
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    link.remove(); // Clean up
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalContentSrc(""); // Clear content when closing
  };

  return (
    <>
      <div className="flex space-x-2">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
          onClick={handleOpenDocument}
          disabled={loading}
          title={`Open or preview ${fileName}`}
        >
          {loading ? "Loading..." : "View"}
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
          onClick={handleDownloadDocument}
          title={`Download ${fileName}`}
        >
          Download
        </button>
      </div>

      {isModalOpen && (
        <DocumentModal
          fileType={modalContentType}
          contentSrc={modalContentSrc}
          onClose={handleCloseModal}
          fileName={fileName}
        />
      )}
    </>
  );
};