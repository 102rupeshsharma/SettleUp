import React, { useState } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';

const ReceiptUpload = ({ file, setFile }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only JPG, PNG, and PDF files are allowed.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Expense Receipt (Optional)
      </label>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-2.5 text-xs text-rose-400 border border-rose-500/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {file ? (
        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <File className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[200px]">{file.name}</span>
            <span className="text-[10px] text-slate-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-emerald-500 bg-emerald-500/5'
              : 'border-slate-800 bg-slate-950 hover:border-slate-700'
          }`}
        >
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="h-6 w-6 text-slate-500 mb-2" />
          <p className="text-xs text-slate-300 font-semibold">
            Drag & drop file or <span className="text-emerald-400 underline">browse</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">JPG, PNG, PDF up to 5MB</p>
        </div>
      )}
    </div>
  );
};

export default ReceiptUpload;
