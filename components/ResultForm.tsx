import React from 'react';
import { ExtractedData } from '../types';
import { User, Calendar, MapPin, Map, CreditCard, FileBadge, Hash, ChevronDown, Edit3 } from 'lucide-react';

interface ResultFormProps {
  data: ExtractedData;
  onChange: (field: keyof ExtractedData, value: string) => void;
}

const DOCUMENT_TYPES = [
  "Carta d'Identità",
  "Patente di Guida",
  "Tessera Sanitaria",
  "Passaporto",
  "Altro"
];

export const ResultForm: React.FC<ResultFormProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof ExtractedData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(field, e.target.value);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <FileBadge className="w-5 h-5 text-blue-600" />
          Dati Estratti
          <span className="text-xs font-normal text-slate-400 ml-2 flex items-center gap-1">
            <Edit3 className="w-3 h-3" /> Modificabili
          </span>
        </h2>
        
        <div className="relative">
            <select
              value={data.tipo_documento || ''}
              onChange={handleChange('tipo_documento')}
              className="appearance-none bg-white text-slate-700 font-medium text-sm pl-3 pr-10 py-2 rounded-lg border border-slate-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all w-full md:w-auto shadow-sm"
              title="Modifica tipo documento"
            >
              <option value="" disabled>Seleziona tipo...</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Cognome */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <User className="w-3 h-3" /> Cognome
          </label>
          <input
            type="text"
            value={data.cognome || ''}
            onChange={handleChange('cognome')}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Nome */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <User className="w-3 h-3" /> Nome
          </label>
          <input
            type="text"
            value={data.nome || ''}
            onChange={handleChange('nome')}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Data di Nascita */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Data di Nascita
          </label>
          <input
            type="text"
            value={data.data_nascita || ''}
            onChange={handleChange('data_nascita')}
            placeholder="GG/MM/AAAA"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Luogo di Nascita */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Luogo di Nascita
          </label>
          <input
            type="text"
            value={data.luogo_nascita || ''}
            onChange={handleChange('luogo_nascita')}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Indirizzo */}
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Map className="w-3 h-3" /> Indirizzo Residenza
          </label>
          <input
            type="text"
            value={data.indirizzo_residenza || ''}
            onChange={handleChange('indirizzo_residenza')}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Città */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Città Residenza
          </label>
          <input
            type="text"
            value={data.citta_residenza || ''}
            onChange={handleChange('citta_residenza')}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Codice Fiscale (Optional) */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <CreditCard className="w-3 h-3" /> Codice Fiscale
          </label>
          <input
            type="text"
            value={data.codice_fiscale || ''}
            onChange={handleChange('codice_fiscale')}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Numero Documento */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Hash className="w-3 h-3" /> N. Documento
          </label>
          <input
            type="text"
            value={data.numero_documento || ''}
            onChange={handleChange('numero_documento')}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-slate-900 placeholder-slate-400"
          />
        </div>

         {/* Data di Scadenza */}
         <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Data Scadenza
          </label>
          <input
            type="text"
            value={data.data_scadenza || ''}
            onChange={handleChange('data_scadenza')}
            placeholder="GG/MM/AAAA"
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
          />
        </div>

      </div>
    </div>
  );
};