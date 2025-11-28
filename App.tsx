import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadArea } from './components/UploadArea';
import { ResultForm } from './components/ResultForm';
import { JotformModal } from './components/JotformModal';
import { PdfThumbnail } from './components/PdfThumbnail';
import { extractDataFromDocument } from './services/geminiService';
import { fileToBase64 } from './services/utils';
import { encryptAndSave, getStoredDocsList, EncryptedDocument } from './services/security';
import { ExtractedData, FileData, ProcessingStatus, DocumentSession } from './types';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw, Sparkles, Save, Lock, History, ScanSearch, Plus, X, FileText, Send, Pencil, Filter } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptySession = (index: number): DocumentSession => ({
  id: generateId(),
  name: `Documento ${index + 1}`,
  frontFile: null,
  backFile: null,
  status: ProcessingStatus.IDLE,
  extractedData: null,
  errorMsg: null,
  saveSuccess: false
});

const VAULT_FILTERS = [
  "Tutti",
  "Carta d'Identità",
  "Patente di Guida",
  "Tessera Sanitaria",
  "Passaporto",
  "Altro"
];

const App: React.FC = () => {
  const [sessions, setSessions] = useState<DocumentSession[]>([createEmptySession(0)]);
  const [activeSessionId, setActiveSessionId] = useState<string>(sessions[0].id);
  
  const [savedDocs, setSavedDocs] = useState<EncryptedDocument[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isJotformOpen, setIsJotformOpen] = useState(false);

  // Stati per la rinomina della sessione
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  // Stato per il filtro del Vault
  const [vaultFilter, setVaultFilter] = useState<string>("Tutti");

  // Recupera la sessione attiva
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    setSavedDocs(getStoredDocsList());
  }, []);

  // Helper per aggiornare la sessione corrente
  const updateActiveSession = (updates: Partial<DocumentSession>) => {
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { ...s, ...updates } : s
    ));
  };

  // Funzioni per rinominare la sessione
  const startRenaming = (session: DocumentSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(session.id);
    setTempName(session.name);
  };

  const handleRenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempName(e.target.value);
  };

  const handleRenameSubmit = () => {
    if (renamingId && tempName.trim()) {
      setSessions(prev => prev.map(s => 
        s.id === renamingId ? { ...s, name: tempName.trim() } : s
      ));
    }
    setRenamingId(null);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') setRenamingId(null);
  };

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return "Formato file non supportato. Usa JPG, PNG o PDF.";
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      return "Il file è troppo grande. Dimensione massima 5MB.";
    }
    return null;
  };

  const processFiles = async (files: File[]) => {
    const validFiles: File[] = [];
    let error = null;

    for (const file of files) {
      const err = validateFile(file);
      if (err) error = err;
      else validFiles.push(file);
    }

    if (error && validFiles.length === 0) {
      toast.error(error);
      updateActiveSession({ errorMsg: error });
      return;
    }

    try {
      // Converti tutti i file in FileData
      const processedFiles = await Promise.all(validFiles.map(async f => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
        base64: await fileToBase64(f),
        mimeType: f.type
      })));

      // LOGICA DI ASSEGNAZIONE INTELLIGENTE
      
      // Caso 1: Un solo file caricato nella sessione corrente
      if (processedFiles.length === 1) {
        const fileData = processedFiles[0];
        if (!activeSession.frontFile) {
          updateActiveSession({ frontFile: fileData, errorMsg: null });
        } else if (!activeSession.backFile) {
          updateActiveSession({ backFile: fileData, errorMsg: null });
        } else {
          // Se entrambi pieni, sostituisci il fronte (comportamento standard)
          updateActiveSession({ frontFile: fileData, errorMsg: null });
        }
      } 
      // Caso 2: Due file caricati contemporaneamente (Coppia Fronte/Retro)
      else if (processedFiles.length === 2 && !activeSession.frontFile && !activeSession.backFile) {
        updateActiveSession({
          frontFile: processedFiles[0],
          backFile: processedFiles[1],
          errorMsg: null
        });
      }
      // Caso 3: Batch Upload (più file o sessione corrente già piena)
      else {
        // Distribuisci i file in nuove sessioni
        const newSessions: DocumentSession[] = [];
        let currentBatchSession: Partial<DocumentSession> = {};
        
        processedFiles.forEach((pf, idx) => {
          
          if (idx % 2 === 0) {
             // Inizia nuova coppia
             currentBatchSession = {
               id: generateId(),
               name: `Documento ${sessions.length + newSessions.length + 1}`,
               status: ProcessingStatus.IDLE,
               frontFile: pf,
               backFile: null,
               extractedData: null,
               errorMsg: null,
               saveSuccess: false
             };
             newSessions.push(currentBatchSession as DocumentSession);
          } else {
            // Completa la coppia precedente con il Retro
            const lastSession = newSessions[newSessions.length - 1];
            lastSession.backFile = pf;
          }
        });

        setSessions(prev => [...prev, ...newSessions]);
        toast.success(`${newSessions.length} nuovi documenti aggiunti.`);
      }

    } catch (e) {
      toast.error("Errore nella lettura dei file.");
      updateActiveSession({ errorMsg: "Errore nella lettura dei file." });
    }
  };

  const handleAnalyze = async () => {
    if (!activeSession.frontFile) {
      toast.warn("Carica almeno il fronte del documento.");
      updateActiveSession({ errorMsg: "Carica almeno il fronte del documento." });
      return;
    }

    try {
      updateActiveSession({ 
        status: ProcessingStatus.PROCESSING, 
        errorMsg: null, 
        saveSuccess: false 
      });
      
      const data = await extractDataFromDocument(
        activeSession.frontFile.base64, 
        activeSession.frontFile.mimeType,
        activeSession.backFile?.base64,
        activeSession.backFile?.mimeType
      );
      
      updateActiveSession({ 
        extractedData: data, 
        status: ProcessingStatus.SUCCESS 
      });
      toast.success("Dati estratti con successo!");

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Impossibile analizzare il documento.");
      updateActiveSession({ 
        status: ProcessingStatus.ERROR, 
        errorMsg: err.message || "Impossibile analizzare il documento." 
      });
    }
  };

  const handleResetSession = () => {
    updateActiveSession({
      frontFile: null,
      backFile: null,
      extractedData: null,
      status: ProcessingStatus.IDLE,
      errorMsg: null,
      saveSuccess: false
    });
  };

  const handleFormChange = (field: keyof ExtractedData, value: string) => {
    if (activeSession.extractedData) {
      updateActiveSession({
        extractedData: {
          ...activeSession.extractedData,
          [field]: value
        },
        saveSuccess: false
      });
    }
  };

  const handleSecureSave = async () => {
    if (!activeSession.extractedData) return;
    setIsSaving(true);
    try {
      await encryptAndSave(activeSession.extractedData);
      setSavedDocs(getStoredDocsList());
      updateActiveSession({ saveSuccess: true });
      toast.success("Dati salvati nel Vault in sicurezza.");
      setTimeout(() => updateActiveSession({ saveSuccess: false }), 3000);
    } catch (e) {
      toast.error("Errore durante il salvataggio sicuro.");
    } finally {
      setIsSaving(false);
    }
  };

  const addNewSession = () => {
    const newSession = createEmptySession(sessions.length);
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSession.id);
  };

  const removeSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (sessions.length === 1) {
      handleResetSession();
      return;
    }
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      setActiveSessionId(newSessions[newSessions.length - 1].id);
    }
  };

  // Helper component for PDF/Image preview in results
  const ResultPreview = ({ file, label }: { file: FileData; label: string }) => {
    const isPdf = file.mimeType === 'application/pdf';
    return (
      <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
        <span className={`text-[10px] font-bold ${label === 'Fronte' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 bg-slate-100'} px-2 py-1 rounded uppercase mb-2 inline-block`}>
          {label}
        </span>
        <div className="relative rounded-lg overflow-hidden bg-slate-50 h-32 flex items-center justify-center">
          {isPdf ? (
            <PdfThumbnail file={file.file} className="w-full h-full" />
          ) : (
            <img src={file.previewUrl} className="max-w-full max-h-full object-contain" alt={label} />
          )}
        </div>
      </div>
    );
  };

  // Filtra i documenti del vault
  const filteredDocs = savedDocs.filter(doc => {
    if (vaultFilter === "Tutti") return true;
    // Se abbiamo il campo docType esplicito (nuovi salvataggi)
    if (doc.docType) return doc.docType === vaultFilter;
    // Fallback per vecchi salvataggi: controlla se la stringa inizia con il filtro
    return doc.previewSummary.startsWith(vaultFilter);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Document Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`
                group relative flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 cursor-pointer transition-all whitespace-nowrap min-w-[160px] max-w-[280px]
                ${activeSessionId === session.id 
                  ? 'bg-white border-blue-600 text-blue-700 shadow-sm' 
                  : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200'}
              `}
            >
              <div 
                className="flex flex-col flex-grow min-w-0" 
                onDoubleClick={(e) => startRenaming(session, e)}
                title="Doppio click per rinominare"
              >
                {renamingId === session.id ? (
                  <input 
                    type="text"
                    value={tempName}
                    onChange={handleRenameChange}
                    onBlur={handleRenameSubmit}
                    onKeyDown={handleRenameKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="text-sm font-semibold bg-white border border-blue-400 rounded px-1 -ml-1 text-slate-900 w-full outline-none shadow-sm"
                  />
                ) : (
                  <span className="text-sm font-semibold truncate pr-2">{session.name}</span>
                )}
                
                <span className="text-[10px] uppercase tracking-wider opacity-75">
                  {session.status === ProcessingStatus.SUCCESS ? 'Completato' : 
                   session.status === ProcessingStatus.PROCESSING ? 'Analisi...' : 
                   session.frontFile ? 'Pronto' : 'Vuoto'}
                </span>
              </div>
              
              <div className="ml-2 flex items-center gap-1 flex-shrink-0">
                 {/* Rename button only for active session */}
                 {activeSessionId === session.id && renamingId !== session.id && (
                    <button
                        onClick={(e) => startRenaming(session, e)}
                        className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Rinomina"
                    >
                        <Pencil className="w-3 h-3" />
                    </button>
                 )}

                 {session.saveSuccess && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                 {session.status === ProcessingStatus.ERROR && <AlertCircle className="w-4 h-4 text-red-500" />}
                 
                 <button 
                   onClick={(e) => removeSession(e, session.id)}
                   className="p-1 rounded-full hover:bg-slate-300 text-slate-400 hover:text-red-500 transition-colors ml-1"
                   title="Chiudi sessione"
                 >
                   <X className="w-3 h-3" />
                 </button>
              </div>
            </div>
          ))}
          
          <button
            onClick={addNewSession}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 transition-colors"
            title="Aggiungi Documento"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* ACTIVE SESSION CONTENT */}
        <div className="animate-fade-in">
          
          {/* Intro / Upload State */}
          {activeSession.status === ProcessingStatus.IDLE && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">
                   Carica {activeSession.name}
                </h2>
                <p className="text-slate-600">
                  Trascina uno o più file (Immagini o PDF) per iniziare.
                </p>
              </div>
              
              {activeSession.errorMsg && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-center gap-3 text-red-700 max-w-2xl mx-auto">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{activeSession.errorMsg}</span>
                </div>
              )}

              <UploadArea 
                frontFile={activeSession.frontFile}
                backFile={activeSession.backFile}
                onFilesSelected={processFiles}
                onRemoveFront={() => updateActiveSession({ frontFile: null })}
                onRemoveBack={() => updateActiveSession({ backFile: null })}
              />

              <div className="flex justify-center pt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={!activeSession.frontFile}
                  className={`
                    flex items-center gap-3 px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-all
                    ${activeSession.frontFile 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 hover:scale-105 cursor-pointer' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                  `}
                >
                  <ScanSearch className="w-6 h-6" />
                  Analizza Documento
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {activeSession.status === ProcessingStatus.PROCESSING && (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-slate-800">Analisi di {activeSession.name} in corso...</h3>
                <p className="text-slate-500">L'intelligenza artificiale sta estraendo i dati.</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {activeSession.status === ProcessingStatus.ERROR && (
            <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm border border-red-100 text-center space-y-4">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Errore su {activeSession.name}</h3>
              <div className="bg-red-50 p-3 rounded-lg text-red-700 text-sm font-medium border border-red-100 inline-block px-6">
                {activeSession.errorMsg}
              </div>
              <button 
                onClick={() => updateActiveSession({ status: ProcessingStatus.IDLE })}
                className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Riprova
              </button>
            </div>
          )}

          {/* Success State */}
          {activeSession.status === ProcessingStatus.SUCCESS && activeSession.extractedData && activeSession.frontFile && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Left Column: Image Previews */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <ResultPreview file={activeSession.frontFile} label="Fronte" />

                    {activeSession.backFile ? (
                       <ResultPreview file={activeSession.backFile} label="Retro" />
                    ) : (
                       <div className="border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 text-xs text-center p-4">
                          Nessun Retro
                       </div>
                    )}
                </div>
                
                <button 
                  onClick={handleResetSession}
                  className="w-full py-3 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <RefreshCw className="w-4 h-4" /> Resetta Documento
                </button>
              </div>

              {/* Right Column: Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 p-1 rounded-full">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-green-700">Dati {activeSession.name}</span>
                    </div>
                </div>
                
                <ResultForm 
                  data={activeSession.extractedData} 
                  onChange={handleFormChange} 
                />
                
                <div className="flex gap-3">
                  <button 
                    onClick={handleSecureSave}
                    disabled={isSaving || activeSession.saveSuccess}
                    className={`flex-1 py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 font-semibold ${
                      activeSession.saveSuccess 
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-200'
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
                    }`}
                  >
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : activeSession.saveSuccess ? (
                        <>
                            <CheckCircle2 className="w-5 h-5" /> Salvato
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" /> Salva nel Vault
                        </>
                    )}
                  </button>

                  <button 
                    onClick={() => setIsJotformOpen(true)}
                    className="flex-1 py-3 bg-orange-500 text-white rounded-lg shadow-md shadow-orange-200 hover:bg-orange-600 transition-all flex items-center justify-center gap-2 font-semibold"
                  >
                    <Send className="w-5 h-5" /> Esporta su JotForm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Vault Summary */}
        {savedDocs.length > 0 && (
          <div className="mt-16 pt-8 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 text-slate-800">
                  <History className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-lg">Vault Globale</h3>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-full">
                  <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Filtra:
                  </span>
                  {VAULT_FILTERS.map(filter => (
                    <button
                      key={filter}
                      onClick={() => setVaultFilter(filter)}
                      className={`
                        text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border
                        ${vaultFilter === filter 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}
                      `}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {filteredDocs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                   <p className="text-slate-500 text-sm">Nessun documento trovato per il filtro "{vaultFilter}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocs.map((doc) => (
                    <div key={doc.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                      <div>
                        <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <Lock className="w-3 h-3 text-green-600" /> {doc.previewSummary}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                            Salvato il {new Date(doc.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-full text-slate-400">
                        <FileText className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

      </main>

      {/* Jotform Modal */}
      {activeSession.extractedData && (
        <JotformModal 
          isOpen={isJotformOpen} 
          onClose={() => setIsJotformOpen(false)} 
          data={activeSession.extractedData} 
        />
      )}

      {/* Global Toast Notifications */}
      <ToastContainer position="bottom-right" theme="colored" autoClose={3000} />
    </div>
  );
};

export default App;