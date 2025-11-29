import React from 'react';
import { PdfThumbnail } from './PdfThumbnail';
import { FileData } from '../types';

interface ResultPreviewProps {
  file: FileData;
  label: string;
}

export const ResultPreview: React.FC<ResultPreviewProps> = ({ file, label }) => {
  const isPdf = file.mimeType === 'application/pdf';
  return (
    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
      <span className={`text-[10px] font-bold ${label === 'Fronte' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 bg-slate-100'} px-2 py-1 rounded uppercase mb-2 inline-block`}>
        {label}
      </span>
      <div className="relative rounded-lg overflow-hidden bg-slate-50 h-32 flex items-center justify-center">
        {isPdf ? (
          <PdfThumbnail file={file.file} className="w-full h-full" />
        ) : (
          <img src={file.previewUrl} className="max-w-full max-h-full object-contain" alt={label} />
        )}
      </div>
    </div>
  );
};