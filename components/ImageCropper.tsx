import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Area, MediaSize } from 'react-easy-crop/types';
import { X, Check, ZoomIn, ZoomOut, RotateCw, RotateCcw, Grid3X3, Sparkles, Loader2, Crop, ScanLine } from 'lucide-react';
import getCroppedImg from '../services/imageCropUtils';
import { analyzeDocumentGeometry } from '../services/geminiService';
import { toast } from 'react-toastify';

interface ImageCropperProps {
  imageSrc: string;
  onCancel: () => void;
  onCropComplete: (croppedFile: File) => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCancel, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  
  // Per calcolare il crop automatico (centraggio) servono le dimensioni in pixel dell'immagine renderizzata
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onRotationChange = (rotation: number) => {
    setRotation(rotation);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onMediaLoaded = (mediaSize: MediaSize) => {
    setMediaSize(mediaSize);
  };

  const onCropCompleteCallback = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      );
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const performAutoDetection = async (mode: 'straighten' | 'crop') => {
    if (isAutoDetecting) return;
    setIsAutoDetecting(true);
    
    try {
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        const reader = new FileReader();
        
        reader.onloadend = async () => {
            const base64 = (reader.result as string).split(',')[1];
            try {
                const geometry = await analyzeDocumentGeometry(base64);
                
                // 1. Applica Rotazione (sempre utile)
                let newRotation = geometry.rotation;
                setRotation(newRotation);

                // Dati bounding box (percentuali 0-100)
                const { ymin, xmin, ymax, xmax } = geometry.box;
                const boxH = ymax - ymin;
                const boxW = xmax - xmin;

                // 2. Calcola Zoom intelligente
                // Vogliamo che il box riempia circa l'85% della vista (Safe Area)
                // Se il box è piccolo (es. documento sul tavolo), zoomiamo molto.
                const maxDimensionPct = Math.max(boxH, boxW);
                let targetZoom = 1;
                
                if (maxDimensionPct > 0) {
                     // Riduciamo leggermente l'aggressività dello zoom (85 invece di 90)
                     targetZoom = Math.min(3, 85 / maxDimensionPct);
                     // Se è quasi full screen (>90%), lasciamo a 1 o resettiamo
                     if (maxDimensionPct > 90) targetZoom = 1;
                }
                setZoom(targetZoom);

                // 3. Calcola Pan/Crop (Solo per "Auto Crop")
                if (mode === 'crop' && mediaSize) {
                    // Centro del Bounding Box (in pixel relativi all'immagine originale)
                    // Convertiamo percentuali in decimali (0-1)
                    const boxCenterX_pct = (xmin + xmax) / 2; // 0-100
                    const boxCenterY_pct = (ymin + ymax) / 2; // 0-100

                    const boxCenterX_px = (boxCenterX_pct / 100) * mediaSize.width;
                    const boxCenterY_px = (boxCenterY_pct / 100) * mediaSize.height;

                    // Centro dell'immagine originale
                    const imageCenterX = mediaSize.width / 2;
                    const imageCenterY = mediaSize.height / 2;

                    // Vettore di spostamento necessario (Displacement Vector)
                    // Dobbiamo spostare l'immagine in modo che il centro del Box vada al centro dello Schermo (Crop Center)
                    // react-easy-crop 'crop' prop sposta l'immagine. 
                    // Se il Box è a destra (x > center), dobbiamo spostare l'immagine a SINISTRA (x negativo).
                    // Quindi: Spostamento = Centro Immagine - Centro Box
                    const dispX = imageCenterX - boxCenterX_px;
                    const dispY = imageCenterY - boxCenterY_px;

                    // IMPORTANTE: Dobbiamo ruotare questo vettore di spostamento!
                    // L'asse X/Y dello schermo non cambia, ma l'immagine sotto ruota.
                    // Se ruotiamo l'immagine di 90°, il "Top" dell'immagine diventa "Destra" dello schermo.
                    const rad = (newRotation * Math.PI) / 180;
                    
                    // Rotazione 2D del vettore (dispX, dispY)
                    const rotatedX = dispX * Math.cos(rad) - dispY * Math.sin(rad);
                    const rotatedY = dispX * Math.sin(rad) + dispY * Math.cos(rad);

                    if (!isNaN(rotatedX) && !isNaN(rotatedY)) {
                        setCrop({ x: rotatedX, y: rotatedY });
                        toast.success(`Ritagliato e Raddrizzato!`);
                    }
                } else {
                    setCrop({ x: 0, y: 0 }); // Reset al centro per solo raddrizzamento
                    toast.success(`Raddrizzato! Rotazione: ${Math.round(newRotation)}°`);
                }

            } catch (err: any) {
                console.error(err);
                toast.error("Impossibile rilevare il documento automaticamente.");
            } finally {
                setIsAutoDetecting(false);
            }
        };
        reader.readAsDataURL(blob);

    } catch (e) {
        console.error(e);
        toast.error("Errore caricamento immagine");
        setIsAutoDetecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white z-10 border-b border-slate-800">
        <h3 className="font-semibold text-lg flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-blue-400" />
            Ritaglia e Raddrizza
        </h3>
        <div className="flex items-center gap-2">
            <div className="hidden md:flex bg-slate-800 rounded-lg p-1 gap-1">
                <button 
                    onClick={() => performAutoDetection('straighten')}
                    disabled={isAutoDetecting}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-md transition-all disabled:opacity-50"
                    title="Solo rotazione e zoom"
                >
                    {isAutoDetecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
                    Raddrizza
                </button>
                <div className="w-px bg-slate-700 my-1"></div>
                <button 
                    onClick={() => performAutoDetection('crop')}
                    disabled={isAutoDetecting}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-md transition-all disabled:opacity-50 shadow-sm"
                    title="Raddrizza e centra il documento"
                >
                    {isAutoDetecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crop className="w-3 h-3" />}
                    Auto Crop
                </button>
            </div>

            <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
            </button>
        </div>
      </div>

      {/* Cropper Area */}
      <div className="relative flex-grow bg-black overflow-hidden group">
        <Cropper
          image={imageSrc}
          crop={crop}
          rotation={rotation}
          zoom={zoom}
          aspect={undefined} // Free aspect ratio
          onCropChange={onCropChange}
          onRotationChange={onRotationChange}
          onCropComplete={onCropCompleteCallback}
          onZoomChange={onZoomChange}
          onMediaLoaded={onMediaLoaded}
          objectFit="contain"
          minZoom={0.5} // Allow zooming out to fit large images
          maxZoom={3}
          classes={{
              containerClassName: "bg-slate-900/50",
              mediaClassName: "transition-all duration-500 ease-in-out", // Smooth transitions for auto-adjust
              cropAreaClassName: "border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.8)]"
          }}
        />
        
        {/* Floating Auto Buttons for Mobile */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 md:hidden z-20 flex gap-3">
             <button 
                onClick={() => performAutoDetection('straighten')}
                disabled={isAutoDetecting}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/90 backdrop-blur-md hover:bg-slate-700 text-white text-xs font-bold rounded-full transition-all disabled:opacity-50 border border-slate-600"
            >
                {isAutoDetecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
                Raddrizza
            </button>
            <button 
                onClick={() => performAutoDetection('crop')}
                disabled={isAutoDetecting}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600/90 backdrop-blur-md hover:bg-indigo-500 text-white text-xs font-bold rounded-full transition-all disabled:opacity-50 shadow-xl border border-indigo-400/30"
            >
                {isAutoDetecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crop className="w-3 h-3" />}
                Auto Crop
            </button>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Ruota: {Math.round(rotation)}° | Zoom: {zoom.toFixed(1)}x
        </div>
      </div>

      {/* Controls Footer */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 pb-8 space-y-5 z-10 select-none">
        
        {/* Sliders Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full px-2">
            
            {/* Rotation Control */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
                    <span>Raddrizza</span>
                    <div className="flex gap-2">
                        <button onClick={() => setRotation(r => r - 90)} className="hover:text-white transition-colors" title="-90°">
                            <RotateCcw className="w-3 h-3" />
                        </button>
                        <button onClick={() => setRotation(0)} className="hover:text-white transition-colors" title="Resetta">
                            0°
                        </button>
                        <button onClick={() => setRotation(r => r + 90)} className="hover:text-white transition-colors" title="+90°">
                            <RotateCw className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <RotateCcw className="w-4 h-4 text-slate-500" />
                    <input
                        type="range"
                        value={rotation}
                        min={-180}
                        max={180}
                        step={1}
                        aria-labelledby="Rotation"
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                    />
                    <RotateCw className="w-4 h-4 text-slate-500" />
                </div>
            </div>

            {/* Zoom Control */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
                    <span>Zoom</span>
                    <button onClick={() => setZoom(1)} className="hover:text-white transition-colors" title="Reset Zoom">
                        1.0x
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <ZoomOut className="w-4 h-4 text-slate-500" />
                    <input
                        type="range"
                        value={zoom}
                        min={0.5}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                    />
                    <ZoomIn className="w-4 h-4 text-slate-500" />
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 max-w-md mx-auto w-full pt-2">
            <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                disabled={isProcessing}
            >
                Annulla
            </button>
            <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                disabled={isProcessing}
            >
                {isProcessing ? 'Elaborazione...' : (
                    <>
                     <Check className="w-5 h-5" /> Conferma
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};