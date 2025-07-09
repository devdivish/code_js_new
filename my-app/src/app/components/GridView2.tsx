// src/components/DataTable.tsx

// --- Keep all your existing imports ---
import React, { useState, useMemo, useEffect } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, ColumnDef, flexRender } from '@tanstack/react-table';
import { X,Download } from 'lucide-react';

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

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
// --- NEW: Import the DateFormatter component ---
import DateFormatter from '../components/DateFormatter'; // Adjust path if needed


interface DataTableProps {
  documents: Document[];
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  isLoading: boolean;
}



// --- The NEW and IMPROVED MetadataPanel ---
interface MetadataPanelProps {
  document: Document | null;
  onClose: () => void;
}

const MetadataPanel: React.FC<MetadataPanelProps> = ({ document, onClose }) => {
  // NEW: Define the base URL for your Python server for downloads
  const pythonServerUrl = process.env.REACT_APP_PYTHON_SERVER_URL || 'http://192.168.10.144:8000';

  if (!document) {
    return null;
  }

  // NEW: Get the filename from the document object. Use optional chaining for safety.
  // have to change this
  const fileName = document?.FileName || 'file1';

  // NEW: Construct the full download URL. We encode the filename to handle special characters.
  // IMPORTANT: This assumes your server has an endpoint like `/download/<filename>`.
  // Adjust the path if your server endpoint is different (e.g., `/files?name=...`).
  const downloadUrl = fileName ? `${pythonServerUrl}/download/${encodeURIComponent(fileName)}` : '';


  const metadataEntries = Object.entries(document).filter(
    ([key]) => key !== 'Text' && key !== 'id'
  );

  return (
    <aside className="w-full md:w-1/4 h-full border-l border-gray-200 bg-slate-50 shadow-lg flex flex-col">
      {/* Panel Header - UPDATED */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {/* NEW: Group for title and download icon */}
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">Document Details</h3>
          
          {/* NEW: Conditionally render the download icon as a link */}
          {fileName && (
            <a
              href={downloadUrl}
              target="_blank" // Opens the link in a new tab
              rel="noopener noreferrer" // Security best practice for target="_blank"
              download={fileName} // Suggests the browser should download the file
              title={`Download ${fileName}`}
            >
              <Button variant="ghost" size="icon" aria-label={`Download ${fileName}`}>
                <Download className="h-5 w-5 text-gray-600 hover:text-gray-900" />
              </Button>
            </a>
          )}
        </div>

        {/* Close button remains the same */}
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close metadata panel">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Panel Content (remains unchanged from the previous version) */}
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-3 items-center">
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
                <div className="text-sm text-gray-900 break-words text-right">
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

//



// Your original DataTable component, now with modifications
const DataTable: React.FC<DataTableProps> = ({ documents, pageSize, onPageSizeChange, isLoading = false }) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});

  // NEW: State for controlling the metadata panel
  const [isMetadataPanelOpen, setIsMetadataPanelOpen] = useState(false);
  const [selectedDocumentForMetadata, setSelectedDocumentForMetadata] = useState<Document | null>(null);

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
    pageCount: Math.ceil(documents.length / pageSize),
  });

  useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  // NEW: Check if any row is selected. If not, we can close the panel.
  // This is an optional enhancement. If a user unchecks all boxes, the panel will close.
  useEffect(() => {
    if (Object.keys(rowSelection).length === 0) {
      setIsMetadataPanelOpen(false);
      setSelectedDocumentForMetadata(null);
    }
  }, [rowSelection]);


  return (
    // NEW: Main flex container to hold the table and the metadata panel
    <div className="flex w-full h-[calc(100vh-some-offset)]"> {/* Adjust height as needed */}
      {/* Main content area that grows to fill available space */}
      <div className="flex-grow p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="w-full space-y-4">
          {/* Search and page-size controls */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <Input
              placeholder="Search..."
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center space-x-2">
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
          <ScrollArea >
          <div className="overflow-auto rounded-lg shadow-lg border">
            <Table className="min-w-full divide-y divide-gray-200 bg-white">
              <TableHeader className="bg-gray-100">
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead
                        key={header.id}
                        className="py-3 px-6 text-left font-semibold text-gray-700 first:pl-8"
                      >
                        {header.isPlaceholder ? null : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-8 text-center text-gray-500">
                      {isLoading ? 'Loading...' : 'No records found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
           <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Pagination footer */}
          <div className="flex flex-col md:flex-row items-center justify-between py-4 space-y-2 md:space-y-0">
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
      </div>
      
      {/* NEW: Conditionally render the Metadata Panel */}
      {isMetadataPanelOpen && (
        <MetadataPanel
          document={selectedDocumentForMetadata}
          onClose={() => setIsMetadataPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default DataTable;