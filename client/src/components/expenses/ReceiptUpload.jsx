import React, { useState } from 'react';
import { Paperclip, X } from 'lucide-react';

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
    <div>
      <span className="field-label">
        Receipt <span className="font-normal text-muted">(optional)</span>
      </span>

      {error && (
        <p role="alert" className="notice-error mb-2">{error}</p>
      )}

      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2 text-sm">
          <div className="flex min-w-0 items-center gap-2 text-ink">
            <Paperclip className="h-4 w-4 shrink-0 text-muted" />
            <span className="truncate">{file.name}</span>
            <span className="shrink-0 text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <button
            type="button"
            onClick={clearFile}
            aria-label="Remove receipt"
            className="shrink-0 rounded p-1 text-muted transition-colors hover:bg-sunken hover:text-ink"
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
          className={`relative flex cursor-pointer items-center gap-3 rounded-md border border-dashed px-3 py-3 transition-colors ${
            dragActive ? 'border-accent bg-accent-soft' : 'border-line hover:bg-sunken'
          }`}
        >
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleChange}
            aria-label="Attach a receipt"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <Paperclip className="h-4 w-4 shrink-0 text-muted" />
          <p className="text-sm text-muted">
            <span className="font-medium text-ink underline underline-offset-2">Choose a file</span> or
            drop it here. JPG, PNG or PDF, up to 5 MB.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReceiptUpload;
