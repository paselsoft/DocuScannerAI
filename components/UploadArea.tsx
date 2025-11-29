
import React, { useRef, useState } from 'react';
import { CloudUpload, Image as ImageIcon, X, Plus, Files, FileText, Loader2, Camera, RotateCw } from 'lucide-react';
import { FileData } from '../types';

interface UploadAreaProps {
  frontFile: FileData | null;
  backFile: FileData | null;
  onFilesSelected: (files: File[]) => void;
  onRemoveFront: () => void;
  onRemoveBack: () => void;
  onRotateFront: () => void;
  onRotateBack: () => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ 
  frontFile, 
  backFile, 
  onFilesSelected,
  onRemoveFront,
  onRemoveBack,
  onRotateFront,
  onRotateBack
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsProcessing(true);
      await onFilesSelected(Array.from(e.dataTransfer.files));
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (files: File[]) => {
    setIsProcessing(true);
    await onFilesSelected(files);
    setIsProcessing(false);
  }

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
      
      {isProcessing && (
        <div className="absolute top-0 left-0 w-full h-full bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-lg font-semibold text-slate-700">Elaborazione file...</p>
        </div>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isDragging ? 'opacity-20 blur-sm' : ''}`}>
        <SingleUploadBox 
          label="Fronte Documento" 
          fileData={frontFile} 
          onFilesSelected={handleFileSelect} 
          onRemove={onRemoveFront}
          onRotate={onRotateFront}
          color="blue"
          isMain={true}
        />
        <SingleUploadBox 
          label="Retro Documento" 
          fileData={backFile} 
          onFilesSelected={handleFileSelect} 
          onRemove={onRemoveBack}
          onRotate={onRotateBack}
          color="slate"
          isMain={false}
        />
      </div>
      
      {!frontFile && !backFile && !isDragging && (
        <div className="text-center mt-6 text-slate-400 text-sm">
           Suggerimento: Puoi trascinare file JPG, PNG, HEIC o PDF.
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
  onRotate: () => void;
  color: 'blue' | 'slate';
  isMain: boolean;
}

const SingleUploadBox: React.FC<SingleBoxProps> = ({ label, fileData, onFilesSelected, onRemove, onRotate, color, isMain }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
    // Reset input
    if (e.target) e.target.value = '';
  };

  const handleBoxClick = () => {
    if (!fileData) {
      fileInputRef.current?.click();
    }
  };

  const handleCameraClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita di aprire anche il file picker normale
    if (!fileData) {
      cameraInputRef.current?.click();
    }
  };

  const borderColor = color === 'blue' ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50/30';
  const iconColor = color === 'blue' ? 'text-blue-500' : 'text-slate-400';

  if (fileData) {
    const isPdf = fileData.mimeType === 'application/pdf';

    return (
      <div className="relative group rounded-xl border border-slate-200 overflow-hidden h-64 bg-white flex flex-col shadow-sm">
        <div className="absolute top-2 right-2 z-10 flex gap-2">
           {!isPdf && (
               <button 
                onClick={(e) => { e.stopPropagation(); onRotate(); }}
                className="bg-white text-blue-500 p-1.5 rounded-full hover:bg-blue-50 shadow-md border border-slate-100 transition-colors transform hover:scale-110"
                title="Ruota 90°"
               >
                 <RotateCw className="w-4 h-4" />
               </button>
           )}
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
      onClick={handleBoxClick}
      className={`border-2 border-dashed ${borderColor} hover:bg-white hover:border-blue-400 hover:shadow-md rounded-xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center group h-64 relative`}
    >
      {/* Input Standard per File Picker */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleChange} 
        accept="image/jpeg,image/png,image/webp,application/pdf,image/heic,image/heic-sequence" 
        multiple
        className="hidden" 
      />

      {/* Input Speciale per Fotocamera (capture="environment" forza la fotocamera posteriore su mobile) */}
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleChange} 
        accept="image/*" 
        capture="environment"
        className="hidden" 
      />
      
      <div className={`bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform`}>
        {color === 'blue' ? (
           <CloudUpload className={`w-8 h-8 ${iconColor}`} />
        ) : (
           <Plus className={`w-8 h-8 ${iconColor}`} />
        )}
      </div>
      
      <h3 className={`text-sm font-bold ${color === 'blue' ? 'text-blue-700' : 'text-slate-700'}`}>
        {label}
      </h3>
      
      <div className="mt-4 flex gap-2 w-full justify-center px-4">
          <button 
             className="flex-1 bg-white border border-slate-300 text-slate-600 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
             Scegli File
          </button>
          <button 
             onClick={handleCameraClick}
             className="flex-1 bg-blue-600 text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-1"
          >
             <Camera className="w-3 h-3" /> Scatta
          </button>
      </div>

      <p className="text-[10px] text-slate-400 mt-2">
        Trascina file o usa i pulsanti
      </p>
    </div>
  );
};
