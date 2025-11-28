import React, { useEffect, useState } from 'react';
import { generatePdfThumbnail } from '../services/pdfUtils';
import { FileText, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

interface PdfThumbnailProps {
  file: File;
  className?: string;
  initialScale?: number;
}

export const PdfThumbnail: React.FC<PdfThumbnailProps> = ({ file, className, initialScale = 1.5 }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(initialScale);

  useEffect(() => {
    let isMounted = true;

    const loadThumbnail = async () => {
      try {
        setLoading(true);
        setError(false);
        const url = await generatePdfThumbnail(file, scale);
        if (isMounted) {
          setThumbnailUrl(url);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadThumbnail();

    return () => {
      isMounted = false;
    };
  }, [file, scale]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.min(prev + 0.5, 4.0)); // Max scale 4.0
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.max(prev - 0.5, 0.5)); // Min scale 0.5
  };

  if (loading && !thumbnailUrl) {
    return (
      <div className={`flex flex-col items-center justify-center text-slate-400 bg-slate-50 ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <span className="text-xs font-medium">Render PDF...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center text-slate-400 bg-slate-50 ${className}`}>
        <FileText className="w-10 h-10 mb-2" />
        <span className="text-xs font-bold bg-slate-200 px-2 py-1 rounded">PDF Error</span>
      </div>
    );
  }

  return (
    <div className={`relative group w-full h-full flex items-center justify-center overflow-hidden bg-slate-100 ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center backdrop-blur-sm">
           <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}
      
      {thumbnailUrl && (
        <img 
          src={thumbnailUrl} 
          alt="PDF Preview" 
          className="max-w-full max-h-full object-contain shadow-sm"
        />
      )}
      
      <div className="absolute bottom-2 right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm opacity-90 z-10">
        PDF
      </div>

      {/* Zoom Controls Overlay */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-slate-900/70 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
        <button 
          onClick={handleZoomOut}
          disabled={scale <= 0.5}
          className="p-1 text-white hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Riduci zoom"
        >
          <ZoomOut className="w-3 h-3" />
        </button>
        <span className="text-[9px] font-medium text-white px-1 min-w-[24px] text-center select-none">
          {scale}x
        </span>
        <button 
          onClick={handleZoomIn}
          disabled={scale >= 4.0}
          className="p-1 text-white hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Aumenta zoom"
        >
          <ZoomIn className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};