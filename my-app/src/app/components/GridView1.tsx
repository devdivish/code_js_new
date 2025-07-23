

import React, { useState, useMemo, useEffect } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, ColumnDef, flexRender } from '@tanstack/react-table';
import { FileText, FileArchive, ImageIcon } from 'lucide-react'; // NEW: Professional icons
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Document } from '../types';
import { Modal } from './Modal';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import MetadataPanel from './MetaDataPanel';
import TableToolbar from './TableToolbar';
import TablePagination from './TablePagination';

interface DataTableProps {
  documents: Document[];
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  isLoading: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ documents, pageSize, onPageSizeChange, isLoading = false }) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [isMetadataPanelOpen, setIsMetadataPanelOpen] = useState(false);
  const [selectedDocumentForMetadata, setSelectedDocumentForMetadata] = useState<Document | null>(null);
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
          <div className="flex justify-center items-center h-full">
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all rows"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center items-center h-full">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={value => {
                row.toggleSelected(!!value);
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
        header: () => key.replace(/_/g, ' '), // Nicer header formatting
        cell: ({ row, getValue }) => {
          const value = getValue();
          if (key === 'FileName') {
            const name = String(value);
            let IconComponent = FileText;
            if (name.endsWith('.pdf')) IconComponent = FileText;
            else if (/\.(docx?|pptx?|xlsx?)$/.test(name)) IconComponent = FileArchive;
            else if (/\.(jpe?g|png|gif)$/.test(name)) IconComponent = ImageIcon;
            return (
              <div className="flex items-center space-x-3">
                <IconComponent className="h-5 w-5 text-slate-500 flex-shrink-0" />
                <span 
                  className="font-medium text-slate-800 truncate max-w-xs hover:text-blue-600 cursor-pointer"
                  onClick={() => {
                    setSelectedDocumentForMetadata(row.original);
                    setIsMetadataPanelOpen(true);
                  }}
                >
                  {name}
                </span>
              </div>
            );
          }
          return <span className="text-slate-600 truncate max-w-xs">{String(value)}</span>;
        },
      }))
    ];
  }, [documents]);

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

  useEffect(() => {
    if (Object.keys(rowSelection).length === 0) {
      setIsMetadataPanelOpen(false);
      setSelectedDocumentForMetadata(null);
    }
  }, [rowSelection]);

  const pythonServerUrl = process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || `http://192.168.10.144:8000`;

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
    const viewUrlBase = `${pythonServerUrl}/api/documents/${encodeURIComponent(doc.SystemPath)}`;
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
    if (!doc.SystemPath) {
      console.error("No file path provided for downloading.");
      alert("File path is missing, cannot download document.");
      return;
    }
    const downloadUrl = `${pythonServerUrl}/api/documents/${encodeURIComponent(doc.SystemPath)}?action=download`;
    
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

  return (
    <>
      <div className="flex w-full h-screen bg-slate-50">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-4 min-w-0">
          <TableToolbar
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
            isLoading={isLoading}
          />
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-grow overflow-hidden">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-slate-100/75 backdrop-blur-sm">
                  {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id} className="border-b-slate-200">
                      {headerGroup.headers.map(header => (
                        <TableHead
                          key={header.id}
                          className="py-3 px-6 text-left text-xs font-bold text-slate-600 uppercase tracking-wider"
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
                        className="border-b border-slate-200 transition-colors hover:bg-blue-50 data-[state=selected]:bg-blue-100"
                        data-state={row.getIsSelected() && 'selected'}
                      >
                        {row.getVisibleCells().map(cell => (
                          <TableCell
                            key={cell.id}
                            className="py-4 px-6 whitespace-nowrap"
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
                        className="py-16 text-center text-slate-500"
                      >
                        {isLoading ? "Loading documents..." : "No records found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          <TablePagination table={table} />
        </div>
        {isMetadataPanelOpen && (
          <MetadataPanel
            document={selectedDocumentForMetadata}
            onClose={() => setIsMetadataPanelOpen(false)}
            onView={handleOpenDocument}
            onDownload={handleDownloadDocument}
          />
        )}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={documentToView?.FileName || 'Document'}
        isLoading={isModalContentLoading}
        viewUrl={`${pythonServerUrl}/api/documents/${encodeURIComponent(documentToView?.SystemPath || '')}?action=view`}
      >
        <div dangerouslySetInnerHTML={{ __html: modalContent }} />
      </Modal>
    </>
  );
};

export default DataTable;
""

 