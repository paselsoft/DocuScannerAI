import React from 'react';
import { SavedDocument } from '../services/dbService';
import { FileText, X, Pencil } from 'lucide-react';

interface PreviewModalProps {
  previewDoc: SavedDocument | null;
  onClose: () => void;
  onLoad: (doc: SavedDocument) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ previewDoc, onClose, onLoad }) => {
  if (!previewDoc) return null;
  const data = previewDoc.content;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
           <div className="flex items-center gap-2 overflow-hidden">
              <div className="bg-blue-100 p-1.5 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-lg truncate pr-4">{previewDoc.summary}</h3>
                  <p className="text-xs text-slate-500">Anteprima dati salvati - {new Date(previewDoc.created_at).toLocaleDateString()}</p>
              </div>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-full">
             <X className="w-5 h-5" />
           </button>
        </div>
        
        <div className="p-6 grid grid-cols-2 gap-6 bg-white overflow-y-auto">
           <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Cognome</label>
              <p className="font-medium text-slate-800 border-b border-slate-100 pb-1">{data.cognome || '-'}</p>
           </div>
           <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Nome</label>
              <p className="font-medium text-slate-800 border-b border-slate-100 pb-1">{data.nome || '-'}</p>
           </div>
           
           {data.data_nascita && (
             <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Data Nascita</label>
                <p className="text-sm text-slate-700">{data.data_nascita}</p>
             </div>
           )}
           {data.data_scadenza && (
             <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Data Scadenza</label>
                <p className="text-sm text-slate-700">{data.data_scadenza}</p>
             </div>
           )}
           {data.luogo_nascita && (
             <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Luogo Nascita</label>
                <p className="text-sm text-slate-700">{data.luogo_nascita}</p>
             </div>
           )}
           {data.codice_fiscale && (
             <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Codice Fiscale</label>
                <p className="text-sm text-slate-700 font-mono">{data.codice_fiscale}</p>
             </div>
           )}
           {data.numero_documento && (
             <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Numero Documento</label>
                <p className="text-sm text-slate-700 font-mono">{data.numero_documento}</p>
             </div>
           )}
           {data.indirizzo_residenza && (
             <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Indirizzo Residenza</label>
                <p className="text-sm text-slate-700">{data.indirizzo_residenza} {data.citta_residenza ? `, ${data.citta_residenza}` : ''}</p>
             </div>
           )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-shrink-0">
           <button 
             onClick={onClose}
             className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg font-medium transition-colors"
           >
             Chiudi
           </button>
           <button 
             onClick={() => {
               onLoad(previewDoc);
               onClose();
             }}
             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-blue-200 transition-all flex items-center gap-2 font-medium"
           >
             <Pencil className="w-4 h-4" /> Carica e Modifica
           </button>
        </div>
      </div>
    </div>
  );
};