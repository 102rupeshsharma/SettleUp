import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Download, Loader2 } from 'lucide-react';

const ExportButtons = ({ groupId }) => {
  const [csvLoading, setCsvLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportCSV = async () => {
    setCsvLoading(true);
    try {
      const response = await axiosInstance.get(`/groups/${groupId}/export/csv`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'group_expenses.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    } finally {
      setCsvLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const response = await axiosInstance.get(`/groups/${groupId}/export/pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'group_financial_summary.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleExportCSV}
        disabled={csvLoading}
        title="Download expenses as CSV"
        className="btn btn-ghost px-2.5"
      >
        {csvLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        CSV
      </button>
      <button
        onClick={handleExportPDF}
        disabled={pdfLoading}
        title="Download a PDF summary"
        className="btn btn-ghost px-2.5"
      >
        {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        PDF
      </button>
    </div>
  );
};

export default ExportButtons;
