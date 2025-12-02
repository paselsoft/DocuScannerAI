import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop/types';
import { X, Check, ZoomIn, ZoomOut, RotateCw, RotateCcw, Grid3X3 } from 'lucide-react';
import getCroppedImg from '../services/imageCropUtils';

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

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onRotationChange = (rotation: number) => {
    setRotation(rotation);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
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

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white z-10 border-b border-slate-800">
        <h3 className="font-semibold text-lg flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-blue-400" />
            Ritaglia e Raddrizza
        </h3>
        <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Cropper Area */}
      <div className="relative flex-grow bg-black overflow-hidden">
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
          objectFit="contain"
          minZoom={0.5} // Allow zooming out to fit large images
          maxZoom={3}
          classes={{
              containerClassName: "bg-slate-900/50",
              mediaClassName: "",
              cropAreaClassName: "border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.8)]"
          }}
        />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full pointer-events-none backdrop-blur-sm">
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