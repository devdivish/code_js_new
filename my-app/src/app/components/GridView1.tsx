

import React, { useState, useMemo, useEffect } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, ColumnDef, flexRender } from '@tanstack/react-table';
import { X,Download, Eye } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Document } from '../types';
import { Modal } from './Modal';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// --- NEW: Import the DateFormatter component ---
import DateFormatter from '../components/DateFormatter'; // Adjust path if needed


interface DataTableProps {
  documents: Document[];
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  isLoading: boolean;
}





interface MetadataPanelProps {
  document: Document | null;
  onClose: () => void;
  onView: (document: Document) => void; 
  onDownload: (document: Document) => void;
}

const MetadataPanel: React.FC<MetadataPanelProps> = ({ document, onClose, onView, onDownload }) => {

  if (!document) return null;

  const fileName = document?.FileName || "file1";
  
  const metadataEntries = Object.entries(document).filter(([key]) => key !== 'Text' && key !== 'id');

  return (
    <aside className="w-full md:w-1/4 h-full border-l border-gray-200 bg-slate-50 shadow-lg flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {/* Header Group */}
        <div className="flex items-center gap-1"> {/* Reduced gap for more icons */}
          <h3 className="text-lg font-semibold text-gray-800">Details</h3>
          {/* NEW: View Icon Button */}
          {fileName && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onView(document)}
              title={`View ${fileName}`}
              aria-label={`View ${fileName}`}
            >
              <Eye className="h-5 w-5 text-gray-600 hover:text-gray-900" />
            </Button>
          )}
          {/* Download Icon Button */}
          {fileName && (
            <Button variant="ghost" size="icon" title={`Download ${fileName}`} aria-label={`Download ${fileName}`} onClick={() => onDownload(document)}>
              <Download className="h-5 w-5 text-gray-600 hover:text-gray-900" />
            </Button>
          )}
        </div>
        {/* Close Button */}
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close metadata panel">
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Panel Content (remains unchanged from the previous version) */}
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



// =========================================================================
//  DataTable Component (Updated with "Download All" and Modal Logic)
// =========================================================================
const DataTable: React.FC<DataTableProps> = ({ documents, pageSize, onPageSizeChange, isLoading = false }) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});

  // State for Metadata Panel
  const [isMetadataPanelOpen, setIsMetadataPanelOpen] = useState(false);
  const [selectedDocumentForMetadata, setSelectedDocumentForMetadata] = useState<Document | null>(null);

  // NEW: State for the document viewer modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string>('');
  const [isModalContentLoading, setIsModalContentLoading] = useState<boolean>(false);
  const [documentToView, setDocumentToView] = useState<Document | null>(null);


  const columns = useMemo<ColumnDef<Document>[]>(() => {
      const baseCols = documents.length
        ? Object.keys(documents[0]).filter(k => k !== 'Text' && k !== 'highlighted_text')
        : [];
  
      return [
        {
          id: 'select',
          header: ({ table }) => (
            <div className="flex justify-center">
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all rows"
              />
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex justify-center">
              <Checkbox
                checked={row.getIsSelected()}
                // NEW: Updated onCheckedChange to control the metadata panel
                onCheckedChange={value => {
                  // This line keeps the table's selection state working as before
                  row.toggleSelected(!!value);
  
                  // If the checkbox is checked, show its metadata
                  if (value) {
                    setSelectedDocumentForMetadata(row.original);
                    setIsMetadataPanelOpen(true);
                  }
                }}
                aria-label={`Select row ${row.id}`}
              />
            </div>
          ),
        },
        ...baseCols.map(key => ({
          accessorKey: key,
          header: () => key,
          cell: ({ getValue }) => {
            const value = getValue();
            if (key === 'FileName') {
              const name = String(value);
              let icon = '📄';
              if (name.endsWith('.pdf')) icon = '📄';
              else if (/\.(docx?|pptx?|xlsx?)$/.test(name)) icon = '🗂️';
              else if (/\.(jpe?g|png|gif)$/.test(name)) icon = '🖼️';
              return (
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{icon}</span>
                  <span className="truncate max-w-xs">{name}</span>
                </div>
              );
            }
            return <span className="truncate max-w-xs">{String(value)}</span>;
          },
        }))
      ];
    }, [documents]); // Dependencies remain the same



    const table = useReactTable({
        data: documents,
        columns,
        state: { globalFilter, rowSelection },
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        globalFilterFn: 'includesString',
        enableRowSelection: true,
      });
    
      useEffect(() => {
        table.setPageSize(pageSize);
      }, [pageSize, table]);
    

       useEffect(() => { table.setPageSize(pageSize); }, [pageSize, table]);

         useEffect(() => {
           if (Object.keys(rowSelection).length === 0) {
             setIsMetadataPanelOpen(false);
             setSelectedDocumentForMetadata(null);
           }
         }, [rowSelection]);



          // NEW: Handler to open the viewer modal
          const pythonServerUrl = process.env.REACT_APP_PYTHON_SERVER_URL || `http://192.168.10.144:8000`;

          const getFileExtension = (name: string): string | undefined => {
            const lastDot = name.lastIndexOf('.');
            if (lastDot === -1 || lastDot === 0 || lastDot === name.length - 1) {
              return undefined;
            }
            return name.substring(lastDot + 1).toLowerCase();
          };
        
          const handleOpenDocument = async (doc: Document) => {
            
            if (!doc.SystemPath) {
              console.error("No file path provided for viewing.");
              alert("File path is missing, cannot open document.");
              return;
            }
            
            setDocumentToView(doc);
            const parts = doc.SystemPath? doc.SystemPath.split('/'):[] ;
            const fileName = parts.pop() || "";
            const fileExtension = getFileExtension(fileName);
            const viewUrlBase = `${pythonServerUrl}/api/documents/${encodeURIComponent(doc.FilePath)}`;
            const modalViewExtensions = ['doc', 'docx', 'html'];
        
            if (fileExtension && modalViewExtensions.includes(fileExtension)) {
              setIsModalContentLoading(true);
              setModalContent('');
              setIsModalOpen(true);
        
              try {
                const response = await fetch(`${viewUrlBase}?action=view`);
                let responseText = await response.text();
        
                if (!response.ok) {
                  let errorDetail = responseText;
                  try {
                    const errorJson = JSON.parse(responseText);
                    errorDetail = errorJson.detail || errorJson.message || responseText;
                  } catch (e) {
                    // Not JSON
                  }
                  throw new Error(`Preview generation failed: ${response.status} ${response.statusText}. ${errorDetail}`);
                }
                
                setModalContent(responseText.trim() ? responseText : "<p>Preview is empty or could not be generated.</p>");
              } catch (error) {
                console.error("Error fetching document content for modal:", error);
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                setModalContent(`<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded"><p><strong>Error Loading Preview:</strong></p><p>${errorMessage}</p></div>`);
              } finally {
                setIsModalContentLoading(false);
              }
            } else {
              const viewUrl = `${viewUrlBase}?action=view`;
              try {
                const newTab = window.open(viewUrl, '_blank', 'noopener,noreferrer');
                if (!newTab) {
                    alert("Failed to open the document. Your browser's pop-up blocker might have prevented it.");
                }
              } catch (error) {
                console.error("Error opening document in new tab:", error);
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                alert(`Failed to open document: ${errorMessage}`);
              }
            }
          };
        
          const handleDownloadDocument = (doc: Document) => {
            if (!doc.FilePath) {
              console.error("No file path provided for downloading.");
              alert("File path is missing, cannot download document.");
              return;
            }
            const downloadUrl = `${pythonServerUrl}/api/documents/${encodeURIComponent(doc.FilePath)}?action=download`;
            
            try {
              const newWindow = window.open(downloadUrl, '_blank', 'noopener,noreferrer');
              if (!newWindow) {
                console.log("new window not opended")
              }
            } catch (error) {
                console.error("Error initiating download:", error);
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
                alert(`Failed to initiate download: ${errorMessage}`);
            }
          };

      
         // NEW: Handler for the "Download All" button
  const handleDownloadAll = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length < 2) return; // Guard clause

    const filenames = selectedRows.map(row => row.original.FileName);
    const pythonServerUrl = process.env.REACT_APP_PYTHON_SERVER_URL || 'http://192.168.10.144:8000';

    // Construct the URL for the /download_multiple endpoint
    // We'll pass filenames as a comma-separated query parameter.
    // Ensure your Python server can parse this format.
    const downloadUrl = `${pythonServerUrl}/download_multiple?filenames=${filenames.map(encodeURIComponent).join(',')}`;
    
    // Trigger the download by navigating to the URL
    window.location.href = downloadUrl;
  };


    return (
    <> {/* NEW: Use a fragment to render modal outside the main layout flow */}
      <div className="flex w-full h-[calc(100vh-some-offset)]">
        {/* Main Content Area */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col gap-4 min-w-0">
            {/* Search, Download All, and Page-size controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 flex-shrink-0">
              <Input
                placeholder="Search..."
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex items-center space-x-2">
                {/* NEW: Conditional "Download All" button */}
                {table.getSelectedRowModel().rows.length > 1 && (
                  <Button onClick={handleDownloadAll} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download All ({table.getSelectedRowModel().rows.length})
                  </Button>
                )}

                <label htmlFor="pageSize" className="text-sm font-medium">Rows per page:</label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={e => onPageSizeChange(Number(e.target.value))}
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-300"
                  disabled={isLoading}
                >
                  {[50, 100, 500, 1000].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

                 {/* Table container */}
            <ScrollArea className="h-[65vh] rounded-md border overflow-y-auto">
  <Table>
    <TableHeader className="sticky top-0 z-10 bg-background">
      {table.getHeaderGroups().map(headerGroup => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map(header => (
            <TableHead
              key={header.id}
              className="py-3 px-6 text-left font-semibold text-gray-700 first:pl-8"
            >
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>

    <TableBody>
      {table.getRowModel().rows.length > 0 ? (
        table.getRowModel().rows.map(row => (
          <TableRow
            key={row.id}
            className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
          >
            {row.getVisibleCells().map(cell => (
              <TableCell
                key={cell.id}
                className="py-3 px-6 first:pl-8 first:pr-4 whitespace-nowrap"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className="py-8 text-center text-gray-500"
          >
            {isLoading ? "Loading..." : "No records found."}
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
  <ScrollBar orientation="horizontal" />
</ScrollArea>
            
                      {/* Pagination footer */}
                      <div className="flex flex-col md:flex-row items-center justify-between py-4 space-y-2 md:space-y-0 flex-shrink-0">
                        <span className="text-sm text-gray-600">
                          {table.getPrePaginationRowModel().rows.length} rows total
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                            Previous
                          </Button>
                          <span className="text-sm">
                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                          </span>
                          <Button size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
          
        
        
        {/* Metadata Panel */}
        {isMetadataPanelOpen && (
          <MetadataPanel
            document={selectedDocumentForMetadata}
            onClose={() => setIsMetadataPanelOpen(false)}
            onView={handleOpenDocument} // NEW: Pass the handler to the panel
            onDownload={handleDownloadDocument}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={documentToView?.FileName || 'Document'}
        isLoading={isModalContentLoading}
      >
        <div dangerouslySetInnerHTML={{ __html: modalContent }} />
      </Modal>
    </>
  );
};

export default DataTable;
""

 