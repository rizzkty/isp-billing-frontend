import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useState } from 'react';

export default function ExportButton({ data, filename = 'export', columns = [] }) {
  const [loading, setLoading] = useState(false);

  const exportToCSV = () => {
    setLoading(true);
    try {
      const headers = columns.map((col) => col.header);
      const rows = data.map((item) =>
        columns.map((col) => {
          const value = col.accessor ? item[col.accessor] : item[col.key];
          return value ?? '';
        })
      );

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } finally {
      setLoading(false);
    }
  };

  const exportToJSON = () => {
    setLoading(true);
    try {
      const exportData = data.map((item) => {
        const obj = {};
        columns.forEach((col) => {
          const key = col.key || col.accessor;
          obj[col.header] = col.accessor ? item[col.accessor] : item[key];
        });
        return obj;
      });

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        disabled={loading}
      >
        <Download className="w-4 h-4" />
        {loading ? 'Mengunduh...' : 'Export'}
      </button>

      <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
        <button
          onClick={exportToCSV}
          disabled={loading}
          className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-t-lg"
        >
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          Export CSV
        </button>
        <button
          onClick={exportToJSON}
          disabled={loading}
          className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-b-lg"
        >
          <FileText className="w-4 h-4 text-blue-600" />
          Export JSON
        </button>
      </div>
    </div>
  );
}