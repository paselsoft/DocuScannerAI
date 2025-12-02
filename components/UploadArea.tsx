import React, { useRef, useState, useEffect } from 'react';
import { CloudUpload, Image as ImageIcon, X, Plus, Files, FileText, Loader2, Camera, RotateCw, ClipboardPaste, Crop } from 'lucide-react';
import { FileData } from '../types';
import { toast } from 'react-toastify';
import { ImageCropper } from './ImageCropper';
import { convertHeicToJpeg } from '../services/utils';

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

  // Cropper State
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // Gestione Incolla (Ctrl+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Ignora se l'utente sta scrivendo in un input testuale
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        toast.info("Immagine incollata dagli appunti!");
        handleFileProcessingFlow(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

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
      handleFileProcessingFlow(Array.from(e.dataTransfer.files));
    }
  };

  // Centralized File Handling Logic
  const handleFileProcessingFlow = async (files: File[]) => {
    setIsProcessing(true);
    
    // Se c'è un solo file ed è un'immagine, offri il ritaglio
    if (files.length === 1) {
       const file = files[0];
       const isImage = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.heic');
       const isPdf = file.type === 'application/pdf';

       if (isImage && !isPdf) {
           let fileToCrop = file;
           
           // Converti HEIC prima del ritaglio se necessario
           if (file.name.toLowerCase().endsWith('.heic')) {
               try {
                  fileToCrop = await convertHeicToJpeg(file);
               } catch(e) {
                  console.error(e);
                  toast.error("Errore lettura HEIC");
                  setIsProcessing(false);
                  return;
               }
           }

           const objectUrl = URL.createObjectURL(fileToCrop);
           setCropFile(fileToCrop);
           setCropImageSrc(objectUrl);
           setIsProcessing(false); // Stop processing spinner, waiting for crop
           return;
       }
    }

    // Se sono più file o PDF, processa direttamente
    await onFilesSelected(files);
    setIsProcessing(false);
  };

  const onCropComplete = (croppedFile: File) => {
      // Clean up
      if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
      setCropFile(null);
      
      // Pass the cropped file to the main app logic
      onFilesSelected([croppedFile]);
  };

  const onCropCancel = () => {
      // If cancelled, upload the original file
      if (cropFile && cropImageSrc) {
          URL.revokeObjectURL(cropImageSrc);
          onFilesSelected([cropFile]);
      }
      setCropImageSrc(null);
      setCropFile(null);
  };

  return (
    <>
        {cropImageSrc && (
            <ImageCropper 
                imageSrc={cropImageSrc}
                onCancel={onCropCancel}
                onCropComplete={onCropComplete}
            />
        )}

        <div 
        className={`relative p-8 rounded-2xl border-2 border-dashed transition-all ${
            isDragging ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.01]' : 'border-slate-300 dark:border-slate-700 bg-transparent'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        >
        {/* Visual cue for drop zone */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col items-center justify-center opacity-0 transition-opacity duration-200" style={{ opacity: isDragging ? 1 : 0 }}>
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full mb-4">
            <Files className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">Rilascia i documenti qui</p>
        </div>
        
        {isProcessing && (
            <div className="absolute top-0 left-0 w-full h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl">
            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Elaborazione file...</p>
            </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isDragging ? 'opacity-20 blur-sm' : ''}`}>
            <SingleUploadBox 
            label="Fronte Documento" 
            fileData={frontFile} 
            onFilesSelected={handleFileProcessingFlow} 
            onRemove={onRemoveFront}
            onRotate={onRotateFront}
            color="blue"
            isMain={true}
            />
            <SingleUploadBox 
            label="Retro Documento" 
            fileData={backFile} 
            onFilesSelected={handleFileProcessingFlow} 
            onRemove={onRemoveBack}
            onRotate={onRotateBack}
            color="slate"
            isMain={false}
            />
        </div>
        
        {!frontFile && !backFile && !isDragging && (
            <div className="text-center mt-6 text-slate-400 dark:text-slate-500 text-xs flex items-center justify-center gap-2">
            <span>Suggerimento: Trascina file, usa i pulsanti o</span>
            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 dark:text-slate-400 font-mono">
                <ClipboardPaste className="w-3 h-3" /> CTRL+V
            </span>
            <span>per incollare.</span>
            </div>
        )}
        </div>
    </>
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

  const borderColor = color === 'blue' 
    ? 'border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-900/10' 
    : 'border-slate-200 bg-slate-50/30 dark:border-slate-700 dark:bg-slate-800/30';
  
  const iconColor = color === 'blue' 
    ? 'text-blue-500 dark:text-blue-400' 
    : 'text-slate-400 dark:text-slate-500';

  if (fileData) {
    const isPdf = fileData.mimeType === 'application/pdf';

    return (
      <div className="relative group rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden h-64 bg-white dark:bg-slate-800 flex flex-col shadow-sm">
        <div className="absolute top-2 right-2 z-10 flex gap-2">
           {!isPdf && (
               <button 
                onClick={(e) => { e.stopPropagation(); onRotate(); }}
                className="bg-white dark:bg-slate-700 text-blue-500 dark:text-blue-400 p-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-slate-600 shadow-md border border-slate-100 dark:border-slate-600 transition-colors transform hover:scale-110"
                title="Ruota 90°"
               >
                 <RotateCw className="w-4 h-4" />
               </button>
           )}
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="bg-white dark:bg-slate-700 text-red-500 dark:text-red-400 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-slate-600 shadow-md border border-slate-100 dark:border-slate-600 transition-colors transform hover:scale-110"
            title="Rimuovi file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-grow relative flex items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-900/50 h-full overflow-hidden">
          {isPdf ? (
            <div className="flex flex-col items-center justify-center transition-transform hover:scale-105 duration-300">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-3">
                <FileText className="w-16 h-16 text-red-500" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-700/50 px-3 py-1 rounded-full uppercase tracking-wider">
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
        <div className="bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 p-3 text-center z-10">
          <div className="flex items-center justify-center gap-2 mb-1">
             <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'} uppercase`}>
               {isMain ? 'Fronte' : 'Retro'}
             </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate px-2">
            {fileData.file.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleBoxClick}
      className={`border-2 border-dashed ${borderColor} hover:bg-white dark:hover:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md rounded-xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center group h-64 relative`}
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

      {/* Input Speciale per Fotocamera */}
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleChange} 
        accept="image/*" 
        capture="environment"
        className="hidden" 
      />
      
      <div className={`bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform`}>
        {color === 'blue' ? (
           <CloudUpload className={`w-8 h-8 ${iconColor}`} />
        ) : (
           <Plus className={`w-8 h-8 ${iconColor}`} />
        )}
      </div>
      
      <h3 className={`text-sm font-bold ${color === 'blue' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
        {label}
      </h3>
      
      <div className="mt-4 flex gap-2 w-full justify-center px-4">
          <button 
             className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 text-xs font-semibold py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
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

      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
        Trascina file o usa i pulsanti
      </p>
    </div>
  );
};