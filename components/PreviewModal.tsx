import React, { useState, useRef } from 'react';
import { SavedDocument, saveDocumentToDb } from '../services/dbService';
import { compressAndResizeImage } from '../services/imageUtils';
import { FileText, X, Pencil, Image as ImageIcon, Upload, Loader2, Plus, Trash2, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

interface PreviewModalProps {
  previewDoc: SavedDocument | null;
  onClose: () => void;
  onLoad: (doc: SavedDocument) => void;
  onDocUpdated: (updatedDoc: SavedDocument) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ previewDoc, onClose, onLoad, onDocUpdated }) => {
  const [activeTab, setActiveTab] = useState<'data' | 'images'>('data');
  const [isUploading, setIsUploading] = useState<'front' | 'back' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<'front' | 'back' | null>(null);
  
  const fileInputRefFront = useRef<HTMLInputElement>(null);
  const fileInputRefBack = useRef<HTMLInputElement>(null);
  
  if (!previewDoc) return null;
  const data = previewDoc.content;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsUploading(type);

    try {
        // 1. Comprimi immagine
        const compressedBase64 = await compressAndResizeImage(file);
        
        // 2. Prepara il nuovo oggetto dati
        const updatedContent = {
            ...data,
            [type === 'front' ? 'front_img' : 'back_img']: compressedBase64
        };

        // 3. Salva nel DB (Aggiornamento parziale)
        await saveDocumentToDb(updatedContent, previewDoc.id);

        // 4. Aggiorna lo stato locale e del genitore
        const updatedDoc = {
            ...previewDoc,
            content: updatedContent,
            updated_at: new Date().toISOString()
        };
        
        onDocUpdated(updatedDoc);
        toast.success(`Immagine ${type === 'front' ? 'fronte' : 'retro'} caricata!`);

    } catch (error: any) {
        console.error("Errore upload immagine:", error);
        toast.error("Errore durante il salvataggio dell'immagine.");
    } finally {
        setIsUploading(null);
        // Reset input
        if (e.target) e.target.value = '';
    }
  };

  const executeRemoveImage = async () => {
    if (!confirmDelete) return;
    const type = confirmDelete;
    
    try {
        // 1. Rimuovi immagine dall'oggetto
        const updatedContent = { ...data };
        if (type === 'front') delete updatedContent.front_img;
        else delete updatedContent.back_img;

        // 2. Salva nel DB
        await saveDocumentToDb(updatedContent, previewDoc.id);

        // 3. Aggiorna stato locale
        const updatedDoc = {
            ...previewDoc,
            content: updatedContent,
            updated_at: new Date().toISOString()
        };

        onDocUpdated(updatedDoc);
        toast.info("Immagine rimossa. Carica quella corretta.");
    } catch (error) {
        console.error("Errore rimozione immagine:", error);
        toast.error("Impossibile rimuovere l'immagine.");
    } finally {
        setConfirmDelete(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] transition-colors">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center flex-shrink-0">
           <div className="flex items-center gap-2 overflow-hidden">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg truncate pr-4">{previewDoc.summary}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Anteprima dati salvati - {new Date(previewDoc.created_at).toLocaleDateString()}</p>
              </div>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full">
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 pt-2">
            <button 
                type="button"
                onClick={() => setActiveTab('data')}
                className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'data' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
                <FileText className="w-4 h-4" /> Dati
            </button>
            <button 
                type="button"
                onClick={() => setActiveTab('images')}
                className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'images' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
                <ImageIcon className="w-4 h-4" /> Immagini
            </button>
        </div>
        
        {/* Content */}
        <div className="p-6 bg-white dark:bg-slate-900 overflow-y-auto min-h-[300px]">
           {activeTab === 'data' ? (
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Cognome</label>
                        <p className="font-medium text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1">{data.cognome || '-'}</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Nome</label>
                        <p className="font-medium text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1">{data.nome || '-'}</p>
                    </div>
                    
                    {data.data_nascita && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Data Nascita</label>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{data.data_nascita}</p>
                        </div>
                    )}
                    {data.data_scadenza && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Data Scadenza</label>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{data.data_scadenza}</p>
                        </div>
                    )}
                    {data.luogo_nascita && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Luogo Nascita</label>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{data.luogo_nascita}</p>
                        </div>
                    )}
                    {data.codice_fiscale && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Codice Fiscale</label>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">{data.codice_fiscale}</p>
                        </div>
                    )}
                    {data.numero_documento && (
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Numero Documento</label>
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-mono">{data.numero_documento}</p>
                        </div>
                    )}
                    {data.indirizzo_residenza && (
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Indirizzo Residenza</label>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{data.indirizzo_residenza} {data.citta_residenza ? `, ${data.citta_residenza}` : ''}</p>
                        </div>
                    )}
                </div>
           ) : (
               <div className="space-y-6">
                   {/* Fronte */}
                   <div>
                       <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 block">Fronte</label>
                       {data.front_img ? (
                           <div className="relative group border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950">
                               <img 
                                   src={`data:image/jpeg;base64,${data.front_img}`} 
                                   alt="Fronte Documento" 
                                   className="w-full h-auto object-contain max-h-[300px]"
                               />
                               {confirmDelete === 'front' ? (
                                   <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center p-4 z-10 animate-fade-in">
                                       <p className="text-white font-bold text-sm mb-3 text-center">Eliminare immagine?</p>
                                       <div className="flex gap-2 w-full max-w-[200px]">
                                           <button 
                                             type="button"
                                             onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                                             className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-1.5 rounded text-xs"
                                           >
                                             Annulla
                                           </button>
                                           <button 
                                             type="button"
                                             onClick={(e) => { e.stopPropagation(); executeRemoveImage(); }}
                                             className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs"
                                           >
                                             Conferma
                                           </button>
                                       </div>
                                   </div>
                               ) : (
                                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button 
                                         type="button"
                                         onClick={(e) => { e.stopPropagation(); setConfirmDelete('front'); }}
                                         className="bg-red-600 text-white p-1.5 rounded-full shadow-lg hover:bg-red-700 transition-colors"
                                         title="Rimuovi Immagine"
                                       >
                                           <Trash2 className="w-4 h-4" />
                                       </button>
                                   </div>
                               )}
                           </div>
                       ) : (
                           <div 
                                onClick={() => !isUploading && fileInputRefFront.current?.click()}
                                className={`
                                    border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                                    ${isUploading === 'front' ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                `}
                           >
                                <input 
                                    type="file" 
                                    ref={fileInputRefFront} 
                                    onChange={(e) => handleImageUpload(e, 'front')} 
                                    accept="image/*" 
                                    className="hidden" 
                                />
                                {isUploading === 'front' ? (
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                ) : (
                                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-3">
                                        <Plus className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                    </div>
                                )}
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {isUploading === 'front' ? 'Caricamento...' : 'Aggiungi Fronte'}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Clicca per caricare</p>
                           </div>
                       )}
                   </div>

                   {/* Retro */}
                   <div>
                       <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 block">Retro</label>
                       {data.back_img ? (
                           <div className="relative group border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950">
                               <img 
                                   src={`data:image/jpeg;base64,${data.back_img}`} 
                                   alt="Retro Documento" 
                                   className="w-full h-auto object-contain max-h-[300px]"
                               />
                               {confirmDelete === 'back' ? (
                                   <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center p-4 z-10 animate-fade-in">
                                       <p className="text-white font-bold text-sm mb-3 text-center">Eliminare immagine?</p>
                                       <div className="flex gap-2 w-full max-w-[200px]">
                                           <button 
                                             type="button"
                                             onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                                             className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-1.5 rounded text-xs"
                                           >
                                             Annulla
                                           </button>
                                           <button 
                                             type="button"
                                             onClick={(e) => { e.stopPropagation(); executeRemoveImage(); }}
                                             className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs"
                                           >
                                             Conferma
                                           </button>
                                       </div>
                                   </div>
                               ) : (
                                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button 
                                         type="button"
                                         onClick={(e) => { e.stopPropagation(); setConfirmDelete('back'); }}
                                         className="bg-red-600 text-white p-1.5 rounded-full shadow-lg hover:bg-red-700 transition-colors"
                                         title="Rimuovi Immagine"
                                       >
                                           <Trash2 className="w-4 h-4" />
                                       </button>
                                   </div>
                               )}
                           </div>
                       ) : (
                           <div 
                                onClick={() => !isUploading && fileInputRefBack.current?.click()}
                                className={`
                                    border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                                    ${isUploading === 'back' ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                `}
                           >
                                <input 
                                    type="file" 
                                    ref={fileInputRefBack} 
                                    onChange={(e) => handleImageUpload(e, 'back')} 
                                    accept="image/*" 
                                    className="hidden" 
                                />
                                {isUploading === 'back' ? (
                                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                ) : (
                                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full mb-3">
                                        <Plus className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                    </div>
                                )}
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {isUploading === 'back' ? 'Caricamento...' : 'Aggiungi Retro'}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Clicca per caricare</p>
                           </div>
                       )}
                   </div>
               </div>
           )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3 flex-shrink-0">
           <button 
             type="button"
             onClick={onClose}
             className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
           >
             Chiudi
           </button>
           <button 
             type="button"
             onClick={() => {
               onLoad(previewDoc);
               onClose();
             }}
             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-blue-200 dark:shadow-none transition-all flex items-center gap-2 font-medium"
           >
             <Pencil className="w-4 h-4" /> Carica e Modifica
           </button>
        </div>
      </div>
    </div>
  );
};