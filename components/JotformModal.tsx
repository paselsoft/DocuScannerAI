import React, { useState, useEffect } from 'react';
import { X, Settings, ExternalLink, Save, FileText } from 'lucide-react';
import { ExtractedData, JotformSettings, JotformConfig } from '../types';

interface JotformModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExtractedData;
}

const DEFAULT_MAPPINGS = {
  cognome: 'input_4', // Esempio generico
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

export const JotformModal: React.FC<JotformModalProps> = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState<'tt746' | 'tt2112'>('tt746');
  const [settings, setSettings] = useState<JotformSettings>({
    tt746: { ...EMPTY_CONFIG },
    tt2112: { ...EMPTY_CONFIG }
  });
  const [showConfig, setShowConfig] = useState(false);

  // Carica impostazioni salvate
  useEffect(() => {
    const saved = localStorage.getItem('docuscanner_jotform_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    } else {
      // Se non ci sono settings, mostra la config di default
      setShowConfig(true);
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('docuscanner_jotform_settings', JSON.stringify(settings));
    setShowConfig(false);
  };

  const updateMapping = (field: keyof typeof DEFAULT_MAPPINGS, value: string) => {
    setSettings(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        mappings: {
          ...prev[activeTab].mappings,
          [field]: value
        }
      }
    }));
  };

  const updateFormId = (value: string) => {
    setSettings(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        formId: value
      }
    }));
  };

  const handleExport = () => {
    const config = settings[activeTab];
    if (!config.formId) {
      alert("Inserisci l'ID del Form Jotform nelle impostazioni.");
      setShowConfig(true);
      return;
    }

    // Costruzione URL query params
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-orange-500 text-white p-1 rounded">J</span> Esporta su JotForm
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          <button
            onClick={() => setActiveTab('tt746')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tt746' 
              ? 'border-orange-500 text-orange-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Modello TT746
          </button>
          <button
            onClick={() => setActiveTab('tt2112')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tt2112' 
              ? 'border-orange-500 text-orange-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Modello TT2112
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-grow">
          
          {!showConfig ? (
            <div className="space-y-6 text-center py-8">
              <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Pronto per compilare il {activeTab.toUpperCase()}
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                I dati estratti verranno inviati al modulo JotForm configurato.
                Clicca il pulsante qui sotto per aprire il modulo in una nuova scheda.
              </p>
              
              <div className="flex gap-4 justify-center pt-4">
                <button
                  onClick={() => setShowConfig(true)}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" /> Configura
                </button>
                <button
                  onClick={handleExport}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-lg shadow-orange-200 flex items-center gap-2 font-medium"
                >
                  <ExternalLink className="w-4 h-4" /> Compila Modulo Ora
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                <strong>Come configurare:</strong> Inserisci l'ID del tuo form JotForm e per ogni campo, inserisci il "Field Name" o "Field ID" che trovi nelle proprietà del campo su JotForm (es. <code>input_3</code>, <code>q4_name</code>, etc.).
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">JotForm ID</label>
                <input 
                  type="text" 
                  value={settings[activeTab].formId}
                  onChange={(e) => updateFormId(e.target.value)}
                  placeholder="Es. 233364567890123"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <h4 className="md:col-span-2 font-semibold text-slate-800 text-sm border-b pb-2 mt-2">Mappatura Campi (JotForm Field IDs)</h4>
                
                {Object.keys(DEFAULT_MAPPINGS).map((key) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
                      {key.replace('_', ' ')}
                    </label>
                    <input
                      type="text"
                      value={settings[activeTab].mappings[key as keyof typeof DEFAULT_MAPPINGS]}
                      onChange={(e) => updateMapping(key as keyof typeof DEFAULT_MAPPINGS, e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:border-orange-500 outline-none bg-white text-slate-900"
                      placeholder={`Es. ${DEFAULT_MAPPINGS[key as keyof typeof DEFAULT_MAPPINGS]}`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                 <button
                  onClick={() => setShowConfig(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Indietro
                </button>
                <button
                  onClick={saveSettings}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Salva Configurazione
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};