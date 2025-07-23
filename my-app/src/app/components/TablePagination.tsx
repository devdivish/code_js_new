import React from 'react';
import { Button } from '@/components/ui/button';
import { Table } from '@tanstack/react-table';
import { Document } from '../types';

interface TablePaginationProps {
  table: Table<Document>;
}

const TablePagination: React.FC<TablePaginationProps> = ({ table }) => {
  return (
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
  );
};

export default TablePagination;
