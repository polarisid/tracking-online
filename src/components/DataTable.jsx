import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Reusable DataTable component (System Design: Modularidade)
 * Features: text search, pagination, column sorting, result counter, export.
 */
const DataTable = ({
  data = [],
  columns = [],
  title = '',
  headerRow = null,
  pageSize: initialPageSize = 25,
  searchable = true,
  exportable = true,
  activeOrderIds = new Set(),
  orderIdColumnIndex = 1,
}) => {
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  // Filter by search term (debounced via useMemo)
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const term = search.toLowerCase();
    return data.filter(row =>
      columns.some(colIdx => {
        const cell = row[colIdx];
        return cell != null && String(cell).toLowerCase().includes(term);
      })
    );
  }, [data, search, columns]);

  // Sort
  const sortedData = useMemo(() => {
    if (sortCol === null) return filteredData;
    return [...filteredData].sort((a, b) => {
      const va = a[sortCol] ?? '';
      const vb = b[sortCol] ?? '';
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortCol, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = sortedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleSort = (colIdx) => {
    if (sortCol === colIdx) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colIdx);
      setSortDir('asc');
    }
  };

  const handleExport = () => {
    const exportData = [
      headerRow ? columns.map(ci => headerRow[ci] || `Col ${ci}`) : columns.map(ci => `Col ${ci}`),
      ...sortedData.map(row => columns.map(ci => row[ci] ?? ''))
    ];
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Export');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${title || 'export'}.xlsx`);
  };

  if (!data.length) return null;

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          {title && <h3 className="text-sm font-bold text-slate-700">{title}</h3>}
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {sortedData.length} registros
          </span>
        </div>

        <div className="flex items-center gap-2">
          {searchable && (
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(0); }}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 w-48 transition-all"
              />
            </div>
          )}
          {exportable && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download size={13} /> Exportar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ margin: 0, border: 'none', boxShadow: 'none', borderRadius: 0 }}>
          <thead>
            <tr>
              {columns.map((colIdx) => (
                <th
                  key={colIdx}
                  onClick={() => handleSort(colIdx)}
                  className="cursor-pointer select-none hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>{headerRow ? (headerRow[colIdx] || `Col ${colIdx}`) : `Col ${colIdx}`}</span>
                    {sortCol === colIdx && (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, ri) => {
              const orderId1 = String(row[1] || '').trim();
              const orderId2 = String(row[2] || '').trim();
              const isInRoute = activeOrderIds.has(orderId1) || activeOrderIds.has(orderId2);

              return (
                <tr
                  key={ri}
                  className={isInRoute ? 'bg-green-100 hover:bg-green-200' : ''}
                >
                  {columns.map((colIdx) => (
                    <td key={colIdx}>{row[colIdx] ?? ''}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Exibir</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}
            className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-xs text-slate-400">por página</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-semibold text-slate-500 px-2">
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
