import React, { useState, useMemo } from 'react';
import { ExtractedData } from '../types';
import { User, Calendar, MapPin, Map, CreditCard, FileBadge, Hash, ChevronDown, Pencil, Copy, Check, AlertTriangle, CalendarCheck, Users, Eye, EyeOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import { TagInput } from './TagInput';
import { extractInfoFromFiscalCode } from '../services/fiscalCodeUtils';

interface ResultFormProps {
  data: ExtractedData;
  onChange: (field: keyof ExtractedData, value: any) => void;
  sessions?: any[];
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

// Helper per formattazione automatica
const Formatters = {
  date: (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    }
    if (cleaned.length > 4) {
      formatted = formatted.substring(0, 5) + '/' + cleaned.substring(4, 8);
    }
    return formatted.substring(0, 10);
  },
  upper: (val: string) => val.toUpperCase(),
  cf: (val: string) => val.toUpperCase().substring(0, 16),
  gender: (val: string) => val.toUpperCase().substring(0, 1)
};

export const ResultForm: React.FC<ResultFormProps> = ({ 
  data, 
  onChange,
  sessions = [],
  activeSessionId,
  setActiveSessionId
}) => {
  const handleChange = (field: keyof ExtractedData, formatter?: (val: string) => string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value = e.target.value;
    if (formatter) {
      value = formatter(value);
    }
    onChange(field, value);
  };

  const handleTagsChange = (newTags: string[]) => {
    onChange('tags', newTags);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value;
    const existingSession = sessions.find(s => 
      s.id !== activeSessionId && 
      s.extractedData?.tipo_documento === selectedType
    );

    if (existingSession && setActiveSessionId) {
      setActiveSessionId(existingSession.id);
    } else {
      onChange('tipo_documento', selectedType);
    }
  };

  // Logica di Validazione Incrociata (CF vs Dati)
  const cfValidation = useMemo(() => {
     if (!data.codice_fiscale || data.codice_fiscale.length !== 16) return null;
     
     const computed = extractInfoFromFiscalCode(data.codice_fiscale);
     const isDateMatch = !data.data_nascita || (computed.data_nascita === data.data_nascita);
     const isGenderMatch = !data.sesso || (computed.sesso === data.sesso);
     
     if (isDateMatch && isGenderMatch) return 'valid';
     return 'invalid';
  }, [data.codice_fiscale, data.data_nascita, data.sesso]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden group transition-colors">
      <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <FileBadge className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Dati Estratti
          <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-2 flex items-center gap-1">
            <Pencil className="w-3 h-3" /> Modificabili
          </span>
        </h2>
        
        <div className="relative">
            <select
              value={data.tipo_documento || ''}
              onChange={handleTypeChange}
              className="appearance-none bg-white dark:bg-slate-800 text-slate-700 dark:text-white font-medium text-sm pl-3 pr-10 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all w-full md:w-auto shadow-sm"
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
            <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Full width Tag Input */}
        <div className="md:col-span-2">
           <TagInput 
              tags={data.tags || []} 
              onChange={handleTagsChange} 
           />
        </div>

        <FieldInput 
          label="Cognome"
          icon={User}
          value={data.cognome}
          onChange={handleChange('cognome', Formatters.upper)}
          validate={Validators.notEmpty}
          className="uppercase"
        />

        <FieldInput 
          label="Nome"
          icon={User}
          value={data.nome}
          onChange={handleChange('nome', Formatters.upper)}
          validate={Validators.notEmpty}
          className="uppercase"
        />

        <FieldInput 
          label="Sesso"
          icon={Users}
          value={data.sesso}
          onChange={handleChange('sesso', Formatters.gender)}
          placeholder="M / F"
          className="uppercase"
        />

        <FieldInput 
          label="Data di Nascita"
          icon={Calendar}
          value={data.data_nascita}
          onChange={handleChange('data_nascita', Formatters.date)}
          placeholder="GG/MM/AAAA"
          validate={Validators.date}
          warningMessage="Formato atteso: GG/MM/AAAA"
          maxLength={10}
        />

        <div className="md:col-span-2">
           <FieldInput 
            label="Luogo di Nascita"
            icon={MapPin}
            value={data.luogo_nascita}
            onChange={handleChange('luogo_nascita', Formatters.upper)}
            className="uppercase"
          />
        </div>

        <div className="md:col-span-2">
            <FieldInput 
            label="Indirizzo Residenza"
            icon={Map}
            value={data.indirizzo_residenza}
            onChange={handleChange('indirizzo_residenza', Formatters.upper)}
            className="uppercase"
            />
        </div>

        <FieldInput 
          label="Città Residenza"
          icon={MapPin}
          value={data.citta_residenza}
          onChange={handleChange('citta_residenza', Formatters.upper)}
          className="uppercase"
        />

        <FieldInput 
          label="Codice Fiscale"
          icon={CreditCard}
          value={data.codice_fiscale}
          onChange={handleChange('codice_fiscale', Formatters.cf)}
          className="font-mono uppercase"
          validate={Validators.cf}
          warningMessage="Dovrebbe essere di 16 caratteri"
          maxLength={16}
          isSensitive={true}
          validationStatus={cfValidation}
        />

        <FieldInput 
          label="N. Documento"
          icon={Hash}
          value={data.numero_documento}
          onChange={handleChange('numero_documento', Formatters.upper)}
          className="font-mono uppercase"
          isSensitive={true}
        />

        <FieldInput 
          label="Data Rilascio"
          icon={CalendarCheck}
          value={data.data_rilascio}
          onChange={handleChange('data_rilascio', Formatters.date)}
          placeholder="GG/MM/AAAA"
          validate={Validators.date}
          warningMessage="Formato atteso: GG/MM/AAAA"
          maxLength={10}
        />

        <FieldInput 
          label="Data Scadenza"
          icon={Calendar}
          value={data.data_scadenza}
          onChange={handleChange('data_scadenza', Formatters.date)}
          placeholder="GG/MM/AAAA"
          validate={Validators.date}
          warningMessage="Formato atteso: GG/MM/AAAA"
          maxLength={10}
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
  maxLength?: number;
  isSensitive?: boolean;
  validationStatus?: 'valid' | 'invalid' | null;
}

const FieldInput: React.FC<FieldInputProps> = ({ 
  label, 
  icon: Icon, 
  value = '', 
  onChange, 
  className = '', 
  placeholder,
  validate,
  warningMessage,
  maxLength,
  isSensitive = false,
  validationStatus
}) => {
  const [copied, setCopied] = useState(false);
  const [showValue, setShowValue] = useState(!isSensitive);
  
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
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-between">
        <span className="flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</span>
        <div className="flex items-center gap-2">
            {validationStatus === 'valid' && (
                 <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                    <ShieldCheck className="w-3 h-3" /> Verificato
                 </span>
            )}
            {validationStatus === 'invalid' && (
                 <span className="text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-1 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">
                    <ShieldAlert className="w-3 h-3" /> Discrepanza
                 </span>
            )}
            {showWarning && (
                <span className="text-[10px] text-orange-600 dark:text-orange-400 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> {warningMessage || 'Formato non valido'}
                </span>
            )}
        </div>
      </label>
      <div className="relative">
        <input
            type={showValue ? "text" : "password"}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`
                w-full pl-3 ${isSensitive ? 'pr-16' : 'pr-9'} py-2 bg-white dark:bg-slate-900 border rounded-lg outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${showWarning ? 'border-orange-300 dark:border-orange-500 bg-orange-50 dark:bg-orange-900/20 focus:border-orange-500' : 'border-slate-300 dark:border-slate-600'}
                ${isSensitive && !showValue ? 'tracking-widest' : ''}
                ${className}
            `}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {isSensitive && (
                <button
                    onClick={() => setShowValue(!showValue)}
                    className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={showValue ? "Nascondi" : "Mostra"}
                    type="button"
                >
                    {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            )}
            <button
                onClick={handleCopy}
                className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Copia"
                type="button"
            >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
        </div>
      </div>
    </div>
  );
};