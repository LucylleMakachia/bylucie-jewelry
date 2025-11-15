import React, { useState } from 'react';

function ExportDropdown({ onExportJSON, onExportCSV, onExportExcel, onExportImage, showToast }) {
  const [exportFormat, setExportFormat] = useState('');

  const handleExport = () => {
    const exporters = { 
      json: () => {
        onExportJSON();
        showToast('📊 Analytics exported as JSON!', 'success');
      }, 
      csv: () => {
        onExportCSV();
        showToast('📈 Analytics exported as CSV!', 'success');
      }, 
      excel: () => showToast('📋 Excel export coming soon!', 'info'), 
      image: () => showToast('🖼️ Image export coming soon!', 'info') 
    };
    
    if (exporters[exportFormat]) {
      exporters[exportFormat]();
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-[#b8860b] font-semibold mb-3 text-lg">Export Analytics As:</label>
      <div className="flex space-x-3 max-w-md">
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value)}
          className="flex-1 px-4 py-3 border-2 border-[#b8860b] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-transparent transition-all"
        >
          <option value="" disabled>Select format</option>
          <option value="json">JSON File</option>
          <option value="csv">CSV Spreadsheet</option>
          <option value="excel">Excel Workbook</option>
          <option value="image">Image Report</option>
        </select>
        <button
          onClick={handleExport}
          disabled={!exportFormat}
          className="px-6 py-3 bg-gradient-to-r from-[#b8860b] to-[#daa520] text-white font-semibold rounded-xl disabled:opacity-50 hover:from-[#daa520] hover:to-[#b8860b] transition-all transform hover:scale-105 shadow-lg"
        >
          Export
        </button>
      </div>
    </div>
  );
}

export default ExportDropdown;