import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Table } from '@tanstack/react-table';
import { Document } from '../types';

interface TableToolbarProps {
  table: Table<Document>;
  globalFilter: string;
  setGlobalFilter: (filter: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  isLoading: boolean;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  table,
  globalFilter,
  setGlobalFilter,
  pageSize,
  onPageSizeChange,
  isLoading,
}) => {
  const handleDownloadAll = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length < 2) return;

    const filenames = selectedRows.map(row => row.original.FileName);
    const pythonServerUrl = process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || 'http://192.168.10.144:8000';
    const downloadUrl = `${pythonServerUrl}/download_multiple?filenames=${filenames.map(encodeURIComponent).join(',')}`;
    
    window.location.href = downloadUrl;
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 flex-shrink-0">
      <Input
        placeholder="Search..."
        value={globalFilter}
        onChange={e => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />
      <div className="flex items-center space-x-2">
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
  );
};

export default TableToolbar;
