import React, { useState } from 'react';
import { Document } from '../types';
import { FaFilePdf, FaFileWord, FaFileExcel, FaFilePowerpoint, FaFileImage, FaFileAlt, FaFile, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface GridViewProps {
  documents: Document[];
}

const GridView: React.FC<GridViewProps> = ({ documents }) => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const docsPerPage = 100;

  const getFileIcon = (fileName: string) => {
    if (!fileName) return <FaFile className="text-gray-500" />;
    if (fileName.endsWith('.pdf')) return <FaFilePdf className="text-red-500" />;
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return <FaFileWord className="text-blue-500" />;
    if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return <FaFileExcel className="text-green-500" />;
    if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return <FaFilePowerpoint className="text-orange-500" />;
    if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.gif')) return <FaFileImage className="text-purple-500" />;
    if (fileName.endsWith('.txt')) return <FaFileAlt className="text-gray-500" />;
    return <FaFile className="text-gray-500" />;
  };

  const columns = documents.length > 0 ? Object.keys(documents[0]) : [];

  const indexOfLastDoc = currentPage * docsPerPage;
  const indexOfFirstDoc = indexOfLastDoc - docsPerPage;
  const currentDocs = documents.slice(indexOfFirstDoc, indexOfLastDoc);

  const totalPages = Math.ceil(documents.length / docsPerPage);

  return (
    <div className="flex">
      <div className="w-full pr-4">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left"></th>
              {columns.map(col => <th key={col} className="py-3 px-6 text-left">{col}</th>)}
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {currentDocs.map((doc) => (
              <tr key={doc.PropId} className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer" onClick={() => setSelectedDocument(doc)}>
                <td className="py-3 px-6 text-left whitespace-nowrap">
                  <input type="checkbox" checked={selectedDocument?.PropId === doc.PropId} readOnly />
                </td>
                {columns.map(col => (
                  <td key={col} className="py-3 px-6 text-left">
                    {col === 'FileName' ? (
                      <div className="flex items-center">
                        <div className="mr-2">{getFileIcon(doc[col])}</div>
                        <span>{doc[col]}</span>
                      </div>
                    ) : (
                      String(doc[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-center mt-4">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 mx-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"><FaChevronLeft /></button>
          <span className="p-2 mx-1">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 mx-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"><FaChevronRight /></button>
        </div>
      </div>
      {selectedDocument && (
        <div className="w-1/3 bg-gray-100 p-4 border-l border-gray-300">
          <h3 className="text-lg font-semibold mb-4">Document Details</h3>
          {Object.entries(selectedDocument).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {String(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GridView;