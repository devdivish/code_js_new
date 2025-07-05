// src/components/DocumentCard.tsx
import React from 'react';
import { FaPaperclip } from 'react-icons/fa';
// Import related components and types
import DateFormatter from './DateFormatter';

import { Document } from '../types'; // Assuming Document type is in ../types.ts
import DocumentActions from './DocumentActions';

interface DocumentCardProps {
  doc: Document;
  handleAttachmentLinkClick: (doc: Document) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ doc, handleAttachmentLinkClick }) => {
 
  const uniqueKey = doc.PropId || `${doc.FileName}-${doc.DocumentDate}`; // Example fallback

  // Logic for the attachment link text (moved from JSX for clarity)
  const isAttachment = doc.IsAttachment === true || String(doc.IsAttachment).toLowerCase() === "true";
  console.log(isAttachment)
  // handles all cases of null , undefined , empty
  const hasAttachment=typeof doc.Attachments==='string' && doc.Attachments.trim() !=="";


  let attachmentLinkText: string | null = null;
  let showAttachmentLink = false;

  if (isAttachment) {
    attachmentLinkText = "Show Parent";
    showAttachmentLink = true;
  } else if (hasAttachment) {
    if (typeof doc.a_count === 'number' && doc.a_count > 0) {
      attachmentLinkText = `${doc.a_count} Attachment${doc.a_count > 1 ? 's' : ''}`;
    } else {
      attachmentLinkText = "View Attachments";
    }
    showAttachmentLink = true;
  }
  
  const parts = doc.SystemPath? doc.SystemPath.split('/'):[] ;
  const fileName = parts.pop() || "";


   
  //  const attachmentLinkText = isAttachment ? "Show Parent" : "View Attachments";

  return (
    <div
      // Use a more stable key if possible
      key={uniqueKey}
      className="flex flex-col lg:flex-row bg-white border rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300"
    >
      {/* === Metadata Section === */}
      <div className="lg:w-1/3 p-4 border-r border-gray-300 flex flex-col justify-between">
        <div>
          {/* Use DocType or fallback */}
          <h2 className="text-lg font-semibold mb-2">{doc.DocType || "No Document Type"}</h2>
          {/* Use adapted 'From' field */}
          <p className="text-sm text-gray-500 mb-2">
            <strong>From:</strong> {doc.From || "N/A"}
          </p>
          <p className="text-sm text-gray-500 mb-2">
            <strong>To:</strong> {doc.To || "N/A"}
          </p>
          <p className="text-sm text-gray-500 mb-2">
            <strong>Doc Date:</strong>{" "}
            {/* Use DateFormatter component */}
            <DateFormatter timestamp={doc.DocumentDate} />
          </p>
           {/* Display other relevant metadata */}
           {doc.ReportNumber && <p className="text-sm text-gray-500 mb-2"><strong>Report #:</strong> {doc.ReportNumber}</p>}
           {/* <p className="text-xs text-gray-400">ID: {doc.PropId}</p> */}
        </div>
        <div className="mt-4 flex justify-between items-center">
          {/* Pass required props to DocumentButton */}
          {/* Assuming DocumentButton needs 'filePath' which is now 'FileName'? Adjust as needed */}
          {/* {doc.SystemPath && <DocumentButton filePath={doc.SystemPath} fileName={fileName}/>} */}
          {doc.SystemPath && <DocumentActions filePath={doc.SystemPath} fileName={fileName}/>}
        </div>
      </div>

      {/* === Content Preview Section === */}
      <div className="lg:w-2/3 p-4 overflow-y-auto max-h-60 relative">
         {/* Conditional Attachment Link */}
         {showAttachmentLink &&  (
            <div className="absolute top-4 right-4 z-10">
                <span
                  onClick={() => handleAttachmentLinkClick(doc)}
                  className="text-blue-600 underline cursor-pointer text-sm font-medium flex items-center"
                  title={attachmentLinkText!} // Add tooltip
                >
                  <FaPaperclip className="mr-1" />
                  {attachmentLinkText}
                </span>
            </div>
         )}

        <h3 className="text-md font-semibold mb-2 pr-28"> {/* Padding right to avoid overlap */}
          Content Preview
        </h3>
        {/* Use Text field, handle potential HTML or show plain */}
        {/* If content might be HTML use dangerouslySetInnerHTML carefully */}
        {/* If content is plain text, just render {doc.Text || "No preview"} */}
        <p
            className="text-sm text-gray-700 mb-2 whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: doc.highlighted_text || "No preview available." }}
        />
      </div>
    </div>
  );
};

export default DocumentCard;