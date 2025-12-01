
import React, { useState } from 'react';
import { SavedDocument } from '../services/dbService';
import { FileText, X, Pencil, Image as ImageIcon } from 'lucide-react';

interface PreviewModalProps {
  previewDoc: SavedDocument | null;
  onClose: () => void;
  onLoad: (doc: SavedDocument) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ previewDoc, onClose, onLoad }) => {
  const [activeTab, setActiveTab] = useState<'data' | 'images'>('data');
  
  if (!previewDoc) return null;
  const data = previewDoc.content;

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
                onClick={() => setActiveTab('data')}
                className={`pb-2 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'data' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
            >
                <FileText className="w-4 h-4" /> Dati
            </button>
            <button 
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
                   {data.front_img ? (
                       <div>
                           <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 block">Fronte</label>
                           <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950">
                               <img 
                                   src={`data:image/jpeg;base64,${data.front_img}`} 
                                   alt="Fronte Documento" 
                                   className="w-full h-auto object-contain max-h-[300px]"
                               />
                           </div>
                       </div>
                   ) : (
                       <div className="text-center py-8 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                           Immagine fronte non disponibile
                       </div>
                   )}

                   {data.back_img ? (
                       <div>
                           <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2 block">Retro</label>
                           <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950">
                               <img 
                                   src={`data:image/jpeg;base64,${data.back_img}`} 
                                   alt="Retro Documento" 
                                   className="w-full h-auto object-contain max-h-[300px]"
                               />
                           </div>
                       </div>
                   ) : (
                       <div className="text-center py-8 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                           Immagine retro non disponibile
                       </div>
                   )}
               </div>
           )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3 flex-shrink-0">
           <button 
             onClick={onClose}
             className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
           >
             Chiudi
           </button>
           <button 
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
