import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop/types';
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
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
        <h3 className="font-semibold text-lg">Ritaglia Documento</h3>
        <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Cropper Area */}
      <div className="relative flex-grow bg-black">
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
          classes={{
              containerClassName: "bg-slate-900",
              mediaClassName: "",
              cropAreaClassName: "border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
          }}
        />
      </div>

      {/* Controls Footer */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 pb-8 space-y-4 z-10">
        
        {/* Sliders */}
        <div className="flex flex-col gap-4 max-w-md mx-auto w-full px-4">
            <div className="flex items-center gap-4">
                <ZoomOut className="w-5 h-5 text-slate-400" />
                <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <ZoomIn className="w-5 h-5 text-slate-400" />
            </div>
            
            <div className="flex items-center justify-center">
                 <button 
                    onClick={() => setRotation((r) => r + 90)}
                    className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
                 >
                    <RotateCw className="w-4 h-4" /> Ruota 90°
                 </button>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 max-w-md mx-auto w-full">
            <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                disabled={isProcessing}
            >
                Annulla
            </button>
            <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                disabled={isProcessing}
            >
                {isProcessing ? 'Elaborazione...' : (
                    <>
                     <Check className="w-5 h-5" /> Conferma Ritaglio
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};