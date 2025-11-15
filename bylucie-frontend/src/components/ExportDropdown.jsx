import React, { useState } from 'react';

function ExportDropdown({ onExportJSON, onExportCSV, onExportExcel, onExportImage }) {
  const [exportFormat, setExportFormat] = useState('');

  const handleExport = () => {
    if (!exportFormat) return;
    switch (exportFormat) {
      case 'json':
        onExportJSON();
        break;
      case 'csv':
        onExportCSV();
        break;
      case 'excel':
        onExportExcel();
        break;
      case 'image':
        onExportImage();
        break;
      default:
        break;
    }
  };

  return (
    <div className="mb-6">
      <label htmlFor="exportSelect" className="block text-[#b8860b] font-semibold mb-2">Export Analytics As:</label>
      <div className="flex space-x-2 max-w-xs">
        <select
          id="exportSelect"
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value)}
          className="flex-1 px-3 py-2 border border-[#b8860b] rounded"
        >
          <option value="" disabled>Select format</option>
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
          <option value="image">Image</option>
        </select>
        <button
          onClick={handleExport}
          disabled={!exportFormat}
          className="px-4 py-2 bg-[#b8860b] text-[#002200] font-semibold rounded disabled:opacity-50 hover:bg-[#ffb84d] transition-colors"
        >
          Export
        </button>
      </div>
    </div>
  );
}

export default ExportDropdown;
