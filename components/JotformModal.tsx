import React, { useState, useEffect } from 'react';
import { X, Settings, ExternalLink, Save, FileText, Check, Layout, AlertCircle } from 'lucide-react';
import { ExtractedData, JotformSettings, JotformConfig } from '../types';
import { toast } from 'react-toastify';

interface JotformModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExtractedData;
}

const DEFAULT_MAPPINGS = {
  cognome: 'input_4',
  nome: 'input_3',
  data_nascita: 'input_5',
  luogo_nascita: 'input_6',
  indirizzo_residenza: 'input_7',
  citta_residenza: 'input_8',
  codice_fiscale: 'input_9',
  numero_documento: 'input_10',
  data_scadenza: 'input_11'
};

const EMPTY_CONFIG: JotformConfig = {
  formId: '',
  mappings: { ...DEFAULT_MAPPINGS }
};

const DOCUMENT_PROFILES = [
  "Patente di Guida",
  "Carta d'Identità",
  "Tessera Sanitaria",
  "Passaporto",
  "Generico"
];

export const JotformModal: React.FC<JotformModalProps> = ({ isOpen, onClose, data }) => {
  // Determina il profilo iniziale basato sul documento rilevato o usa Generico
  const initialProfile = DOCUMENT_PROFILES.includes(data.tipo_documento) 
    ? data.tipo_documento 
    : "Generico";

  const [activeProfile, setActiveProfile] = useState<string>(initialProfile);
  const [settings, setSettings] = useState<JotformSettings>({});
  const [showConfig, setShowConfig] = useState(false);

  // Inizializza i settings caricandoli o creando default vuoti
  useEffect(() => {
    const saved = localStorage.getItem('docuscanner_jotform_settings');
    let loadedSettings: JotformSettings = {};
    
    if (saved) {
      try {
        loadedSettings = JSON.parse(saved);
        // Migrazione retrocompatibile per vecchi formati se necessario
        if ('tt746' in loadedSettings) {
           loadedSettings = {}; // Reset se il formato è vecchio (o si potrebbe mappare)
        }
      } catch (e) {
        console.error("Errore parsing settings", e);
      }
    }

    // Assicura che ogni profilo abbia almeno una config vuota
    const initializedSettings: JotformSettings = { ...loadedSettings };
    DOCUMENT_PROFILES.forEach(profile => {
      if (!initializedSettings[profile]) {
        initializedSettings[profile] = JSON.parse(JSON.stringify(EMPTY_CONFIG));
      }
    });

    setSettings(initializedSettings);
    
    // Se il profilo corrente non ha un Form ID salvato, mostra direttamente la config
    if (!initializedSettings[initialProfile]?.formId) {
        setShowConfig(true);
    }
  }, [initialProfile]);

  // Aggiorna il profilo attivo se i dati cambiano (es. navigando tra sessioni)
  useEffect(() => {
    if (isOpen) {
        const newProfile = DOCUMENT_PROFILES.includes(data.tipo_documento) 
            ? data.tipo_documento 
            : "Generico";
        setActiveProfile(newProfile);
    }
  }, [data.tipo_documento, isOpen]);

  const saveSettings = () => {
    localStorage.setItem('docuscanner_jotform_settings', JSON.stringify(settings));
    toast.success(`Configurazione per "${activeProfile}" salvata!`);
    setShowConfig(false);
  };

  const updateMapping = (field: keyof typeof DEFAULT_MAPPINGS, value: string) => {
    setSettings(prev => ({
      ...prev,
      [activeProfile]: {
        ...prev[activeProfile],
        mappings: {
          ...prev[activeProfile].mappings,
          [field]: value
        }
      }
    }));
  };

  const updateFormId = (value: string) => {
    setSettings(prev => ({
      ...prev,
      [activeProfile]: {
        ...prev[activeProfile],
        formId: value
      }
    }));
  };

  const handleExport = () => {
    const config = settings[activeProfile];
    if (!config || !config.formId) {
      toast.warn("Inserisci l'ID del Form Jotform nelle impostazioni prima di procedere.");
      setShowConfig(true);
      return;
    }

    const params = new URLSearchParams();
    const m = config.mappings;

    if (data.cognome && m.cognome) params.append(m.cognome, data.cognome);
    if (data.nome && m.nome) params.append(m.nome, data.nome);
    if (data.data_nascita && m.data_nascita) params.append(m.data_nascita, data.data_nascita);
    if (data.luogo_nascita && m.luogo_nascita) params.append(m.luogo_nascita, data.luogo_nascita);
    if (data.indirizzo_residenza && m.indirizzo_residenza) params.append(m.indirizzo_residenza, data.indirizzo_residenza);
    if (data.citta_residenza && m.citta_residenza) params.append(m.citta_residenza, data.citta_residenza);
    if (data.codice_fiscale && m.codice_fiscale) params.append(m.codice_fiscale, data.codice_fiscale);
    if (data.numero_documento && m.numero_documento) params.append(m.numero_documento, data.numero_documento);
    if (data.data_scadenza && m.data_scadenza) params.append(m.data_scadenza, data.data_scadenza);

    const url = `https://form.jotform.com/${config.formId}?${params.toString()}`;
    window.open(url, '_blank');
    onClose();
  };

  if (!isOpen || !settings[activeProfile]) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
        
        {/* Sidebar / Profiles List */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
           <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <Layout className="w-4 h-4 text-orange-500" /> Profili
              </h3>
           </div>
           <div className="flex-grow overflow-y-auto p-2 space-y-1">
              {DOCUMENT_PROFILES.map(profile => {
                  const isCurrent = activeProfile === profile;
                  const isDetected = data.tipo_documento === profile;
                  const hasConfig = settings[profile]?.formId?.length > 0;

                  return (
                      <button
                        key={profile}
                        onClick={() => setActiveProfile(profile)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between group
                            ${isCurrent ? 'bg-white shadow-sm ring-1 ring-slate-200 text-orange-600' : 'text-slate-500 hover:bg-slate-100'}
                        `}
                      >
                         <span className="truncate">{profile}</span>
                         <div className="flex items-center gap-1">
                            {isDetected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Documento rilevato"></span>
                            )}
                            {hasConfig && (
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400" title="Configurato"></span>
                            )}
                         </div>
                      </button>
                  )
              })}
           </div>
           <div className="p-4 border-t border-slate-200 text-xs text-slate-400">
              Configura il modulo JotForm specifico per ogni tipo di documento.
           </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white z-10">
            <div className="flex flex-col">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-orange-500 text-white p-1 rounded text-sm">J</span> 
                    Esporta: <span className="text-orange-600">{activeProfile}</span>
                </h2>
                {data.tipo_documento === activeProfile && (
                     <span className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Corrisponde al documento analizzato
                     </span>
                )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full">
                <X className="w-6 h-6" />
            </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto p-6 bg-white">
            {!showConfig ? (
                <div className="space-y-6 text-center py-4">
                <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100">
                    <FileText className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                    Pronto all'invio
                </h3>
                <p className="text-slate-500 max-w-md mx-auto text-sm">
                    I dati estratti verranno inviati al form JotForm configurato per <strong>{activeProfile}</strong>.
                    <br/><span className="text-xs opacity-70">ID Form: {settings[activeProfile].formId || 'Non configurato'}</span>
                </p>
                
                <div className="flex gap-4 justify-center pt-4">
                    <button
                    onClick={() => setShowConfig(true)}
                    className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                    <Settings className="w-4 h-4" /> Modifica Mapping
                    </button>
                    <button
                    onClick={handleExport}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-lg shadow-orange-200 flex items-center gap-2 font-medium transition-all hover:scale-105"
                    >
                    <ExternalLink className="w-4 h-4" /> Compila su JotForm
                    </button>
                </div>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <strong>Configurazione {activeProfile}:</strong> Inserisci l'ID del Form e associa i campi di JotForm (es. <code>input_3</code>) ai dati estratti. Queste impostazioni verranno salvate per i futuri documenti di tipo "{activeProfile}".
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">JotForm Form ID</label>
                    <input 
                    type="text" 
                    value={settings[activeProfile].formId}
                    onChange={(e) => updateFormId(e.target.value)}
                    placeholder="Es. 233364567890123"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-slate-900"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <h4 className="md:col-span-2 font-semibold text-slate-800 text-sm border-b pb-2 mt-2 flex justify-between items-center">
                        Mappatura Campi (JotForm Field IDs)
                        <span className="text-xs font-normal text-slate-400">Lascia vuoto per ignorare</span>
                    </h4>
                    
                    {Object.keys(DEFAULT_MAPPINGS).map((key) => (
                    <div key={key}>
                        <label className="block text-xs font-medium text-slate-500 uppercase mb-1 truncate" title={key.replace('_', ' ')}>
                        {key.replace('_', ' ')}
                        </label>
                        <div className="relative">
                            <input
                            type="text"
                            value={settings[activeProfile].mappings[key as keyof typeof DEFAULT_MAPPINGS]}
                            onChange={(e) => updateMapping(key as keyof typeof DEFAULT_MAPPINGS, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-white text-slate-900"
                            placeholder={DEFAULT_MAPPINGS[key as keyof typeof DEFAULT_MAPPINGS]}
                            />
                            {settings[activeProfile].mappings[key as keyof typeof DEFAULT_MAPPINGS] && (
                                <Check className="w-3 h-3 text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
                            )}
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            )}
            </div>

            {/* Footer Actions (Only visible in Config mode) */}
            {showConfig && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={() => setShowConfig(false)}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={saveSettings}
                        className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2 font-medium shadow-sm transition-colors"
                    >
                        <Save className="w-4 h-4" /> Salva Configurazione
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};