import React, { useState } from 'react';
import { ExtractedData } from '../types';
import { User, Calendar, MapPin, Map, CreditCard, FileBadge, Hash, ChevronDown, Pencil, Copy, Check, AlertTriangle, CalendarCheck, Users } from 'lucide-react';

interface ResultFormProps {
  data: ExtractedData;
  onChange: (field: keyof ExtractedData, value: string) => void;
  sessions?: any[]; // Opzionale per compatibilità
  activeSessionId?: string;
  setActiveSessionId?: (id: string) => void;
}

const DOCUMENT_TYPES = [
  "Carta d'Identità",
  "Patente di Guida",
  "Tessera Sanitaria",
  "Passaporto",
  "Altro"
];

// Helper per validazione
const Validators = {
  date: (val: string) => /^\d{2}\/\d{2}\/\d{4}$/.test(val),
  cf: (val: string) => /^[A-Z0-9]{16}$/i.test(val),
  notEmpty: (val: string) => val.trim().length > 0
};

export const ResultForm: React.FC<ResultFormProps> = ({ 
  data, 
  onChange,
  sessions = [],
  activeSessionId,
  setActiveSessionId
}) => {
  const handleChange = (field: keyof ExtractedData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange(field, e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value;
    
    // Cerca se esiste già una sessione con questo tipo di documento
    const existingSession = sessions.find(s => 
      s.id !== activeSessionId && 
      s.extractedData?.tipo_documento === selectedType
    );

    if (existingSession && setActiveSessionId) {
      // Se esiste, naviga a quella sessione
      setActiveSessionId(existingSession.id);
    } else {
      // Altrimenti aggiorna il tipo del documento corrente
      onChange('tipo_documento', selectedType);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <FileBadge className="w-5 h-5 text-blue-600" />
          Dati Estratti
          <span className="text-xs font-normal text-slate-400 ml-2 flex items-center gap-1">
            <Pencil className="w-3 h-3" /> Modificabili
          </span>
        </h2>
        
        <div className="relative">
            <select
              value={data.tipo_documento || ''}
              onChange={handleTypeChange}
              className="appearance-none bg-white text-slate-700 font-medium text-sm pl-3 pr-10 py-2 rounded-lg border border-slate-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all w-full md:w-auto shadow-sm"
              title="Modifica tipo documento o vai a documento esistente"
            >
              <option value="" disabled>Seleziona tipo...</option>
              {DOCUMENT_TYPES.map((type) => {
                 const exists = sessions.find(s => s.id !== activeSessionId && s.extractedData?.tipo_documento === type);
                 return (
                  <option key={type} value={type}>
                    {exists ? `➔ Vai a: ${type}` : type}
                  </option>
                 );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <FieldInput 
          label="Cognome"
          icon={User}
          value={data.cognome}
          onChange={handleChange('cognome')}
          validate={Validators.notEmpty}
        />

        <FieldInput 
          label="Nome"
          icon={User}
          value={data.nome}
          onChange={handleChange('nome')}
          validate={Validators.notEmpty}
        />

        <FieldInput 
          label="Sesso"
          icon={Users}
          value={data.sesso}
          onChange={handleChange('sesso')}
          placeholder="M / F"
          className="uppercase"
        />

        <FieldInput 
          label="Data di Nascita"
          icon={Calendar}
          value={data.data_nascita}
          onChange={handleChange('data_nascita')}
          placeholder="GG/MM/AAAA"
          validate={Validators.date}
          warningMessage="Formato atteso: GG/MM/AAAA"
        />

        <div className="md:col-span-2">
           <FieldInput 
            label="Luogo di Nascita"
            icon={MapPin}
            value={data.luogo_nascita}
            onChange={handleChange('luogo_nascita')}
          />
        </div>

        <div className="md:col-span-2">
            <FieldInput 
            label="Indirizzo Residenza"
            icon={Map}
            value={data.indirizzo_residenza}
            onChange={handleChange('indirizzo_residenza')}
            />
        </div>

        <FieldInput 
          label="Città Residenza"
          icon={MapPin}
          value={data.citta_residenza}
          onChange={handleChange('citta_residenza')}
        />

        <FieldInput 
          label="Codice Fiscale"
          icon={CreditCard}
          value={data.codice_fiscale}
          onChange={handleChange('codice_fiscale')}
          className="font-mono"
          validate={Validators.cf}
          warningMessage="Dovrebbe essere di 16 caratteri"
        />

        <FieldInput 
          label="N. Documento"
          icon={Hash}
          value={data.numero_documento}
          onChange={handleChange('numero_documento')}
          className="font-mono"
        />

        <FieldInput 
          label="Data Rilascio"
          icon={CalendarCheck}
          value={data.data_rilascio}
          onChange={handleChange('data_rilascio')}
          placeholder="GG/MM/AAAA"
          validate={Validators.date}
          warningMessage="Formato atteso: GG/MM/AAAA"
        />

        <FieldInput 
          label="Data Scadenza"
          icon={Calendar}
          value={data.data_scadenza}
          onChange={handleChange('data_scadenza')}
          placeholder="GG/MM/AAAA"
          validate={Validators.date}
          warningMessage="Formato atteso: GG/MM/AAAA"
        />

      </div>
    </div>
  );
};

interface FieldInputProps {
  label: string;
  icon: React.ElementType;
  value: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  validate?: (val: string) => boolean;
  warningMessage?: string;
}

const FieldInput: React.FC<FieldInputProps> = ({ 
  label, 
  icon: Icon, 
  value = '', 
  onChange, 
  className = '', 
  placeholder,
  validate,
  warningMessage
}) => {
  const [copied, setCopied] = useState(false);
  
  const isValid = validate ? validate(value) : true;
  const showWarning = value && !isValid;

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1 relative group/field">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1 justify-between">
        <span className="flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</span>
        {showWarning && (
            <span className="text-[10px] text-orange-600 flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3" /> {warningMessage || 'Formato non valido'}
            </span>
        )}
      </label>
      <div className="relative">
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`
                w-full pl-3 pr-10 py-2 bg-white border rounded-lg outline-none transition-all text-slate-900 placeholder-slate-400
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${showWarning ? 'border-orange-300 bg-orange-50 focus:border-orange-500' : 'border-slate-300'}
                ${className}
            `}
        />
        <button
            onClick={handleCopy}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
            title="Copia"
        >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};