import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, Plus, Files, FileText } from 'lucide-react';
import { FileData } from '../types';

interface UploadAreaProps {
  frontFile: FileData | null;
  backFile: FileData | null;
  onFilesSelected: (files: File[]) => void;
  onRemoveFront: () => void;
  onRemoveBack: () => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ 
  frontFile, 
  backFile, 
  onFilesSelected,
  onRemoveFront,
  onRemoveBack
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div 
      className={`relative p-8 rounded-2xl border-2 border-dashed transition-all ${
        isDragging ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' : 'border-slate-300 bg-transparent'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Visual cue for drop zone */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col items-center justify-center opacity-0 transition-opacity duration-200" style={{ opacity: isDragging ? 1 : 0 }}>
        <div className="bg-blue-100 text-blue-600 p-4 rounded-full mb-4">
          <Files className="w-10 h-10" />
        </div>
        <p className="text-xl font-bold text-blue-600">Rilascia i documenti qui</p>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isDragging ? 'opacity-20 blur-sm' : ''}`}>
        <SingleUploadBox 
          label="Fronte Documento" 
          fileData={frontFile} 
          onFilesSelected={onFilesSelected} 
          onRemove={onRemoveFront}
          color="blue"
          isMain={true}
        />
        <SingleUploadBox 
          label="Retro Documento" 
          fileData={backFile} 
          onFilesSelected={onFilesSelected} 
          onRemove={onRemoveBack}
          color="slate"
          isMain={false}
        />
      </div>
      
      {!frontFile && !backFile && !isDragging && (
        <div className="text-center mt-6 text-slate-400 text-sm">
           Suggerimento: Puoi trascinare file JPG, PNG o PDF.
        </div>
      )}
    </div>
  );
};

interface SingleBoxProps {
  label: string;
  fileData: FileData | null;
  onFilesSelected: (files: File[]) => void;
  onRemove: () => void;
  color: 'blue' | 'slate';
  isMain: boolean;
}

const SingleUploadBox: React.FC<SingleBoxProps> = ({ label, fileData, onFilesSelected, onRemove, color, isMain }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
    // Reset input
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClick = () => {
    if (!fileData) {
      inputRef.current?.click();
    }
  };

  const borderColor = color === 'blue' ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50/30';
  const iconColor = color === 'blue' ? 'text-blue-500' : 'text-slate-400';

  if (fileData) {
    const isPdf = fileData.mimeType === 'application/pdf';

    return (
      <div className="relative group rounded-xl border border-slate-200 overflow-hidden h-64 bg-white flex flex-col shadow-sm">
        <div className="absolute top-2 right-2 z-10">
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="bg-white text-red-500 p-1.5 rounded-full hover:bg-red-50 shadow-md border border-slate-100 transition-colors transform hover:scale-110"
            title="Rimuovi file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-grow relative flex items-center justify-center p-4 bg-slate-50/50 h-full overflow-hidden">
          {isPdf ? (
            <div className="flex flex-col items-center justify-center transition-transform hover:scale-105 duration-300">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-3">
                <FileText className="w-16 h-16 text-red-500" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full uppercase tracking-wider">
                Documento PDF
              </span>
            </div>
          ) : (
            <img 
              src={fileData.previewUrl} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain drop-shadow-sm rounded"
            />
          )}
        </div>
        <div className="bg-white border-t border-slate-100 p-3 text-center z-10">
          <div className="flex items-center justify-center gap-2 mb-1">
             <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${color === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'} uppercase`}>
               {isMain ? 'Fronte' : 'Retro'}
             </span>
          </div>
          <p className="text-xs text-slate-500 truncate px-2">
            {fileData.file.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleClick}
      className={`border-2 border-dashed ${borderColor} hover:bg-white hover:border-blue-400 hover:shadow-md rounded-xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center group h-64 relative`}
    >
      <input 
        type="file" 
        ref={inputRef} 
        onChange={handleChange} 
        accept="image/jpeg,image/png,image/webp,application/pdf" 
        multiple
        className="hidden" 
      />
      
      <div className={`bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform`}>
        {color === 'blue' ? (
           <UploadCloud className={`w-8 h-8 ${iconColor}`} />
        ) : (
           <Plus className={`w-8 h-8 ${iconColor}`} />
        )}
      </div>
      
      <h3 className={`text-sm font-bold ${color === 'blue' ? 'text-blue-700' : 'text-slate-700'}`}>
        {label}
      </h3>
      <p className="text-xs text-slate-500 mt-2 max-w-[180px] leading-relaxed">
        Clicca per selezionare o trascina file (Img/PDF)
      </p>
    </div>
  );
};