
// FORCE UPDATE: v0.20.4-beta
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';

import { Header } from './components/Header';
import { AuthForm } from './components/AuthForm';
import { UploadArea } from './components/UploadArea';
import { ResultForm } from './components/ResultForm';
import { StatsWidget } from './components/StatsWidget';
import { JotformModal } from './components/JotformModal';
import { ChatModal } from './components/ChatModal';
import { SettingsModal } from './components/SettingsModal';
import { PreviewModal } from './components/PreviewModal';

import { supabase } from './services/supabaseClient';
import { extractDataFromDocument } from './services/geminiService';
import { saveDocumentToDb, fetchDocumentsFromDb, deleteDocumentFromDb, deleteDocumentsFromDb, SavedDocument } from './services/dbService';
import { fileToBase64, convertHeicToJpeg } from './services/utils';
import { rotateImage, compressAndResizeImage } from './services/imageUtils';
import { scanQrCodeFromImage } from './services/qrService';
import { extractInfoFromFiscalCode } from './services/fiscalCodeUtils';
import { syncMasterKey } from './services/security';
import { generateLegalizationPdf, generateDataSheetPdf } from './services/pdfGenerator';
import { exportToCsv, exportMultipleToCsv, generateCsvFile } from './services/exportService';
import { addToCalendar } from './services/calendarService';
import { getExpirationInfo } from './services/dateUtils';
import { getTagColor } from './services/tagUtils';

import { 
  FileData, 
  ExtractedData, 
  ProcessingStatus, 
  ChatMessage 
} from './types';
import { 
  Plus, Download, Trash2, MessageSquare, Printer, Save, Loader2, Layout, 
  AlertTriangle, FileText, Search, Filter, ArrowUpDown, CheckSquare, Square, X, MoreHorizontal, Share2, Eye, Calendar, RefreshCw, Pencil, ScanFace, Sparkles
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Session State
  const [frontFile, setFrontFile] = useState<FileData | null>(null);
  const [backFile, setBackFile] = useState<FileData | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Track ID of the document being edited to allow updates instead of inserts
  const [editingDocId, setEditingDocId] = useState<string | null>(null);

  // Saved Docs State & Filtering
  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'date' | 'expiration'>('date');
  
  // Bulk Actions State
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  // Modals
  const [isJotformOpen, setIsJotformOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<SavedDocument | null>(null);
  const [isPdfMenuOpen, setIsPdfMenuOpen] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    docId?: string;
    count?: number;
  }>({ isOpen: false, type: 'single' });

  // Refs for scrolling
  const resultsRef = useRef<HTMLDivElement>(null);

  // Theme Handling
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- Auto-Scroll to Results ---
  useEffect(() => {
    if (processingStatus === ProcessingStatus.SUCCESS && extractedData && resultsRef.current) {
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
  }, [processingStatus, extractedData]);

  // --- Data Loading Function ---
  const loadSavedDocs = async () => {
    setLoadingDocs(true);
    try {
      const docs = await fetchDocumentsFromDb();
      setSavedDocs(docs);
    } catch (error) {
      console.error(error);
      toast.error("Errore caricamento documenti salvati");
    } finally {
      setLoadingDocs(false);
    }
  };

  // --- Auth & Init ---
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoadingAuth(false);
      
      if (session?.user) {
        await syncMasterKey(session.user);
        loadSavedDocs();
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
        if (session?.user) {
            await syncMasterKey(session.user);
            loadSavedDocs();
        }
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSavedDocs([]);
        setSelectedDocIds(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    setUser(null);
    Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
        }
    });
    supabase.auth.signOut().catch((err) => console.error("Errore logout background:", err));
    window.location.reload(); 
  };

  // --- File Processing Logic ---
  const handleFilesSelected = async (files: File[]) => {
    // New scan means new document, clear editing ID
    setEditingDocId(null);
    
    // Reset status to allow new analysis
    setProcessingStatus(ProcessingStatus.IDLE);
    setExtractedData(null);
    
    let newFront = frontFile;
    let newBack = backFile;

    for (const file of files) {
      let processedFile = file;
      if (file.name.toLowerCase().endsWith('.heic')) {
        try {
          processedFile = await convertHeicToJpeg(file);
        } catch (e) {
          toast.error(`Impossibile convertire ${file.name}`);
          continue;
        }
      }

      const base64 = await fileToBase64(processedFile);
      const fileData: FileData = {
        file: processedFile,
        previewUrl: URL.createObjectURL(processedFile),
        base64,
        mimeType: processedFile.type
      };

      if (!newFront) {
        newFront = fileData;
      } else if (!newBack) {
        newBack = fileData;
      }
    }

    setFrontFile(newFront);
    setBackFile(newBack);
    
    // NOTA: Rimossa chiamata automatica a processDocument.
    // L'utente deve cliccare il pulsante "Analizza Documento".
  };

  const processDocument = async (front: FileData, back: FileData | null) => {
    setProcessingStatus(ProcessingStatus.PROCESSING);
    setExtractedData(null); 
    
    try {
      let qrData = await scanQrCodeFromImage(front.file);
      if (!qrData && back) {
        qrData = await scanQrCodeFromImage(back.file);
      }

      const data = await extractDataFromDocument(
        front.base64, 
        front.mimeType, 
        back?.base64, 
        back?.mimeType
      );

      if (qrData && qrData.isFiscalCode) {
        data.codice_fiscale = qrData.text;
        toast.info("Codice Fiscale rilevato da Barcode!");
      }

      if (data.codice_fiscale) {
        const derived = extractInfoFromFiscalCode(data.codice_fiscale);
        if (derived.data_nascita && !data.data_nascita) data.data_nascita = derived.data_nascita;
        if (derived.sesso && !data.sesso) data.sesso = derived.sesso;
      }

      setExtractedData(data);
      setProcessingStatus(ProcessingStatus.SUCCESS);
      toast.success("Documento analizzato con successo!");
    } catch (error: any) {
      console.error(error);
      setProcessingStatus(ProcessingStatus.ERROR);
      toast.error(error.message || "Errore durante l'analisi");
    }
  };

  const handleRotate = async (isFront: boolean) => {
    const target = isFront ? frontFile : backFile;
    if (!target) return;

    try {
      const rotatedFile = await rotateImage(target.file);
      const base64 = await fileToBase64(rotatedFile);
      const newData: FileData = {
        file: rotatedFile,
        previewUrl: URL.createObjectURL(rotatedFile),
        base64,
        mimeType: rotatedFile.type
      };

      if (isFront) setFrontFile(newData);
      else setBackFile(newData);
    } catch (e) {
      toast.error("Errore rotazione immagine");
    }
  };

  const handleRemove = (isFront: boolean) => {
    if (isFront) {
      setFrontFile(null);
      setExtractedData(null);
      setProcessingStatus(ProcessingStatus.IDLE);
    } else {
      setBackFile(null);
    }
  };

  const handleDataChange = (field: keyof ExtractedData, value: any) => {
    if (!extractedData) return;
    setExtractedData({ ...extractedData, [field]: value });
  };

  const handleSave = async () => {
    if (!extractedData) return;
    try {
      const payload = { ...extractedData };

      // Image Compression & Attachment Logic
      // 1. If we have new files in state, compress and add them
      if (frontFile) {
        payload.front_img = await compressAndResizeImage(frontFile.file);
      }
      if (backFile) {
        payload.back_img = await compressAndResizeImage(backFile.file);
      }

      // 2. If we are updating an existing doc AND we didn't upload new files,
      // check if the old doc had images and preserve them.
      if (editingDocId) {
        const originalDoc = savedDocs.find(d => d.id === editingDocId);
        if (originalDoc) {
           if (!payload.front_img && originalDoc.content.front_img) {
             payload.front_img = originalDoc.content.front_img;
           }
           if (!payload.back_img && originalDoc.content.back_img) {
             payload.back_img = originalDoc.content.back_img;
           }
        }
      }

      // Pass editingDocId to update instead of insert if available
      await saveDocumentToDb(payload, editingDocId || undefined);
      
      if (editingDocId) {
          // CASE UPDATE: 
          // Update local state immediately to reflect changes in UI.
          const updatedContent = JSON.parse(JSON.stringify(payload));
          
          setSavedDocs(prev => prev.map(doc => {
              if (doc.id === editingDocId) {
                  return {
                      ...doc,
                      content: updatedContent, // Update content including new tags and images
                      summary: `${updatedContent.tipo_documento} - ${updatedContent.cognome} ${updatedContent.nome}`,
                      updated_at: new Date().toISOString()
                  };
              }
              return doc;
          }));
          
          toast.success("Documento aggiornato!");
      } else {
          // CASE INSERT:
          toast.success("Documento salvato nel cloud!");
          loadSavedDocs(); 
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Helper per mantenere sync lo stato quando si aggiorna dal modale Anteprima
  const handleDocUpdated = (updatedDoc: SavedDocument) => {
      setSavedDocs(prev => prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc));
      setPreviewDoc(updatedDoc); // Aggiorna anche l'anteprima corrente
  };

  const handleCalendarExport = (data: ExtractedData) => {
    try {
      addToCalendar(data);
      toast.success("Evento scaricato! Aggiungilo al tuo calendario.");
    } catch (e: any) {
      toast.warn(e.message || "Impossibile creare evento calendario");
    }
  };

  // --- Deletion Logic with Custom Modal ---
  
  const requestDeleteDoc = (id: string) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'single',
      docId: id
    });
  };

  const requestBulkDelete = () => {
    if (selectedDocIds.size === 0) return;
    setDeleteConfirmation({
      isOpen: true,
      type: 'bulk',
      count: selectedDocIds.size
    });
  };

  const executeDelete = async () => {
    // Close modal immediately
    setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
    
    // 1. Single Delete
    if (deleteConfirmation.type === 'single' && deleteConfirmation.docId) {
       const id = deleteConfirmation.docId;
       
       // Optimistic UI Update
       setSavedDocs(prev => prev.filter(d => d.id !== id));
       setSelectedDocIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
       });

       // Reset editing ID if we deleted the doc being edited
       if (editingDocId === id) {
           setEditingDocId(null);
           setExtractedData(null);
           setProcessingStatus(ProcessingStatus.IDLE);
       }

       try {
          await deleteDocumentFromDb(id);
          toast.success("Documento eliminato.");
       } catch (e) {
          console.error("Delete failed:", e);
          toast.error("Impossibile eliminare il documento.");
          loadSavedDocs(); // Revert
       }
    } 
    // 2. Bulk Delete
    else if (deleteConfirmation.type === 'bulk') {
       const idsToDelete = Array.from(selectedDocIds);
       
       // Optimistic UI Update
       setSavedDocs(prev => prev.filter(d => !selectedDocIds.has(d.id)));
       setSelectedDocIds(new Set());
       
       if (editingDocId && selectedDocIds.has(editingDocId)) {
           setEditingDocId(null);
           setExtractedData(null);
           setProcessingStatus(ProcessingStatus.IDLE);
       }

       try {
          await deleteDocumentsFromDb(idsToDelete);
          toast.success("Documenti eliminati.");
       } catch (e) {
          console.error("Bulk delete failed:", e);
          toast.error("Impossibile eliminare i documenti.");
          loadSavedDocs(); // Revert
       }
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedDocIds.size === filteredDocs.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(filteredDocs.map(d => d.id)));
    }
  };

  const handleBulkExport = () => {
    const docsToExport = savedDocs.filter(d => selectedDocIds.has(d.id));
    exportMultipleToCsv(docsToExport);
    toast.success("Export CSV generato.");
  };

  const handleNativeShare = async () => {
    if (!extractedData) return;
    try {
        const file = generateCsvFile(extractedData);
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Dati Documento',
                text: 'Ecco i dati estratti dal documento.'
            });
        } else {
            toast.warn("Condivisione file non supportata su questo dispositivo.");
        }
    } catch (error: any) {
        if (error.name !== 'AbortError') {
            console.error("Errore condivisione:", error);
            toast.error("Errore durante la condivisione.");
        }
    }
  };

  // --- Filtering & Sorting Logic ---
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    savedDocs.forEach(doc => {
      doc.content.tags?.forEach(t => tags.add(t));
    });
    return Array.from(tags);
  }, [savedDocs]);

  const filteredDocs = useMemo(() => {
    let docs = [...savedDocs];

    // Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(d => {
        const c = d.content;
        return (
          d.summary.toLowerCase().includes(q) ||
          c.cognome?.toLowerCase().includes(q) ||
          c.nome?.toLowerCase().includes(q) ||
          c.codice_fiscale?.toLowerCase().includes(q) ||
          c.citta_residenza?.toLowerCase().includes(q) ||
          c.numero_documento?.toLowerCase().includes(q)
        );
      });
    }

    // Filter by Tag
    if (selectedTag) {
      docs = docs.filter(d => d.content.tags?.includes(selectedTag));
    }

    // Sort
    docs.sort((a, b) => {
      if (sortOrder === 'expiration') {
        const dateA = getExpirationInfo(a.content.data_scadenza).daysLeft;
        const dateB = getExpirationInfo(b.content.data_scadenza).daysLeft;
        return dateA - dateB;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return docs;
  }, [savedDocs, searchQuery, selectedTag, sortOrder]);

  const handleLoadDirect = (doc: SavedDocument) => {
    setProcessingStatus(ProcessingStatus.IDLE);
    setEditingDocId(doc.id); // Set the editing ID to allow updates
    
    setTimeout(() => {
        setExtractedData(doc.content);
        setProcessingStatus(ProcessingStatus.SUCCESS);
        setFrontFile(null);
        setBackFile(null);
        setChatHistory([]); 
    }, 10);
  };

  // --- UI RENDER ---

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <ToastContainer position="top-right" />
        <AuthForm />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-24">
      <ToastContainer position="top-right" theme={isDarkMode ? 'dark' : 'light'} />
      
      <Header 
        isDarkMode={isDarkMode} 
        toggleTheme={toggleTheme} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        userEmail={user.email}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Upload Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Scansione</h2>
            <button 
               onClick={() => {
                 setFrontFile(null);
                 setBackFile(null);
                 setExtractedData(null);
                 setProcessingStatus(ProcessingStatus.IDLE);
                 setChatHistory([]); // Reset chat history
                 setEditingDocId(null); // Clear editing ID
               }}
               className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Nuovo
            </button>
          </div>
          <UploadArea 
            frontFile={frontFile}
            backFile={backFile}
            onFilesSelected={handleFilesSelected}
            onRemoveFront={() => handleRemove(true)}
            onRemoveBack={() => handleRemove(false)}
            onRotateFront={() => handleRotate(true)}
            onRotateBack={() => handleRotate(false)}
          />

          {/* Manual Analyze Button */}
          {frontFile && processingStatus !== ProcessingStatus.SUCCESS && (
            <div className="flex justify-center mt-6 animate-fade-in">
              <button
                onClick={() => processDocument(frontFile, backFile)}
                disabled={processingStatus === ProcessingStatus.PROCESSING}
                className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 hover:shadow-blue-500/30 transition-all transform hover:scale-105 disabled:opacity-70 disabled:scale-100 flex items-center gap-3"
              >
                {processingStatus === ProcessingStatus.PROCESSING ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Analisi in corso...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" /> Analizza Documento
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* Results Section */}
        {processingStatus === ProcessingStatus.SUCCESS && extractedData && (
          <section ref={resultsRef} className="animate-fade-in space-y-4 scroll-mt-20">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                Risultati Analisi
                {editingDocId && (
                    <span className="text-xs font-normal bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> Modifica in corso
                    </span>
                )}
            </h2>
            
            <ResultForm 
              data={extractedData} 
              onChange={handleDataChange} 
            />

            {/* Full Action Toolbar */}
            <div className="flex flex-wrap gap-3 mt-4">
                <button 
                  onClick={handleSave} 
                  className={`flex-1 text-white px-4 py-3 rounded-lg shadow-md transition-colors font-semibold flex items-center justify-center gap-2
                    ${editingDocId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-emerald-600 hover:bg-emerald-700'}
                  `}
                >
                  {editingDocId ? <RefreshCw className="w-5 h-5" /> : <Save className="w-5 h-5" />} 
                  {editingDocId ? "Aggiorna" : "Salva"}
                </button>
                
                <button onClick={() => setIsChatOpen(true)} className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 shadow-md transition-colors font-semibold flex items-center justify-center gap-2">
                  <MessageSquare className="w-5 h-5" /> Chiedi AI
                </button>

                <button onClick={handleNativeShare} className="flex-1 bg-pink-600 text-white px-4 py-3 rounded-lg hover:bg-pink-700 shadow-md transition-colors font-semibold flex items-center justify-center gap-2">
                  <Share2 className="w-5 h-5" /> Condividi
                </button>
            </div>

            <div className="flex flex-wrap gap-3">
                {/* PDF Menu */}
                <div className="relative flex-1">
                  <button 
                    onClick={() => setIsPdfMenuOpen(!isPdfMenuOpen)} 
                    className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 shadow-md transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <Printer className="w-5 h-5" /> Stampa
                  </button>
                  {isPdfMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsPdfMenuOpen(false)}></div>
                      <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 z-20 overflow-hidden">
                        <button 
                          onClick={() => { generateDataSheetPdf(extractedData); setIsPdfMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700"
                        >
                          <FileText className="w-4 h-4" /> Scheda Dati
                        </button>
                        <button 
                          onClick={() => { generateLegalizationPdf(extractedData); setIsPdfMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" /> Legalizzazione Foto
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <button onClick={() => handleCalendarExport(extractedData)} className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 shadow-md transition-colors font-semibold flex items-center justify-center gap-2">
                   <Calendar className="w-5 h-5" /> Calendario
                </button>

                <button onClick={() => exportToCsv(extractedData)} className="flex-1 bg-emerald-700 text-white px-4 py-3 rounded-lg hover:bg-emerald-800 shadow-md transition-colors font-semibold flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" /> CSV
                </button>

                <button onClick={() => setIsJotformOpen(true)} className="flex-1 bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 shadow-md transition-colors font-semibold flex items-center justify-center gap-2">
                  <Layout className="w-5 h-5" /> JotForm
                </button>
            </div>
          </section>
        )}

        {/* Dashboard / Saved Docs */}
        <section className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
             <div className="flex items-center gap-4">
               <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Archivio Cloud</h2>
               <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded-full">
                 {savedDocs.length}
               </span>
             </div>

             {/* Toolbar Filtri */}
             <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative">
                   <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Cerca nome, CF, città..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
                   />
                   {searchQuery && (
                     <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                       <X className="w-3 h-3" />
                     </button>
                   )}
                </div>

                <div className="flex gap-2">
                   <div className="relative">
                      <select 
                        value={selectedTag}
                        onChange={(e) => setSelectedTag(e.target.value)}
                        className="appearance-none pl-9 pr-8 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                      >
                        <option value="">Tutti i Tag</option>
                        {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                      </select>
                      <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   </div>

                   <div className="relative">
                      <select 
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="appearance-none pl-9 pr-8 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                      >
                        <option value="date">Più recenti</option>
                        <option value="expiration">Per Scadenza</option>
                      </select>
                      <ArrowUpDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   </div>
                   
                   <button 
                     type="button"
                     onClick={handleSelectAll}
                     className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                     title="Seleziona Tutto"
                   >
                     <CheckSquare className="w-4 h-4" />
                   </button>
                </div>
             </div>
          </div>
          
          <StatsWidget docs={savedDocs} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredDocs.length === 0 ? (
               <div className="col-span-full p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                 {loadingDocs ? <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> : "Nessun documento trovato."}
               </div>
             ) : (
               filteredDocs.map(doc => {
                 const expiration = getExpirationInfo(doc.content.data_scadenza);
                 const isSelected = selectedDocIds.has(doc.id);
                 const isEditing = editingDocId === doc.id;

                 return (
                   <div 
                      key={doc.id} 
                      className={`
                        group relative bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 overflow-hidden hover:shadow-md
                        ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700'}
                        ${isEditing ? 'ring-2 ring-orange-400 border-orange-400' : ''}
                      `}
                   >
                     {/* Header Card */}
                     <div className="p-4 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 overflow-hidden">
                           <div className={`p-2 rounded-lg flex-shrink-0 ${doc.is_error ? 'bg-red-100 text-red-600' : isEditing ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                              {doc.is_error ? <AlertTriangle className="w-5 h-5" /> : isEditing ? <Pencil className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                           </div>
                           <div className="min-w-0">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{doc.doc_type}</p>
                              <h4 className="font-semibold text-slate-900 dark:text-white truncate text-sm" title={doc.summary}>
                                {doc.summary.replace(`${doc.doc_type} - `, '')}
                              </h4>
                              <p className="text-[10px] text-slate-400 mt-1">{new Date(doc.created_at).toLocaleDateString()}</p>
                           </div>
                        </div>
                        
                        {/* Actions Top Right */}
                        <div className="flex items-center gap-1">
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setPreviewDoc(doc); }}
                                className="text-slate-400 hover:text-blue-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Anteprima Veloce"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleSelection(doc.id); }}
                                className={`text-slate-300 hover:text-blue-500 transition-colors ${isSelected ? 'text-blue-600 opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                                {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                            </button>
                        </div>
                     </div>

                     {/* Tags */}
                     {doc.content.tags && doc.content.tags.length > 0 && (
                        <div className="px-4 pb-2 flex flex-wrap gap-1">
                           {doc.content.tags.slice(0, 3).map(tag => (
                              <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded border ${getTagColor(tag)}`}>
                                {tag}
                              </span>
                           ))}
                           {doc.content.tags.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                +{doc.content.tags.length - 3}
                              </span>
                           )}
                        </div>
                     )}

                     {/* Status Bar */}
                     <div className="px-4 pb-4">
                        <div className={`flex items-center justify-between text-xs font-medium px-2 py-1 rounded-lg ${expiration.bgColor} ${expiration.color}`}>
                           <span className="flex items-center gap-1">
                              {expiration.status === 'valid' ? <CheckSquare className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {expiration.label}
                           </span>
                           <span>{doc.content.data_scadenza || 'N/D'}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 mt-2 rounded-full overflow-hidden">
                           <div 
                             className={`h-full ${expiration.status === 'expired' ? 'bg-red-500' : expiration.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                             style={{ width: `${expiration.progress}%` }}
                           ></div>
                        </div>
                     </div>

                     {/* Actions Footer */}
                     <div className="bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 p-2 flex justify-between items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => handleLoadDirect(doc)}
                          className="flex-1 text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline py-1"
                        >
                          Decifra e Carica
                        </button>
                        <div className="flex items-center gap-1">
                          <button 
                            type="button"
                            onClick={() => handleCalendarExport(doc.content)}
                            className="p-1 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                            title="Aggiungi al calendario"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); requestDeleteDoc(doc.id); }}
                            className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Elimina"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                     </div>
                   </div>
                 );
               })
             )}
          </div>
        </section>
      </main>

      {/* Floating Bulk Action Bar */}
      {selectedDocIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl z-40 flex items-center gap-6 animate-fade-in border border-slate-700">
           <span className="font-bold text-sm bg-slate-700 px-2 py-0.5 rounded text-white">{selectedDocIds.size}</span>
           <div className="h-4 w-px bg-slate-600"></div>
           <button onClick={handleBulkExport} className="flex items-center gap-2 text-sm hover:text-blue-300 transition-colors">
              <Download className="w-4 h-4" /> Esporta CSV
           </button>
           <button onClick={requestBulkDelete} className="flex items-center gap-2 text-sm hover:text-red-300 transition-colors">
              <Trash2 className="w-4 h-4" /> Elimina
           </button>
           <button onClick={() => setSelectedDocIds(new Set())} className="ml-2 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
           </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-4">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {deleteConfirmation.type === 'single' ? 'Eliminare il documento?' : `Eliminare ${deleteConfirmation.count} documenti?`}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Questa azione è irreversibile. Il documento verrà rimosso dall'archivio cloud.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Annulla
                </button>
                <button 
                  onClick={executeDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {extractedData && (
        <>
          <JotformModal 
            isOpen={isJotformOpen} 
            onClose={() => setIsJotformOpen(false)} 
            data={extractedData} 
          />
          <ChatModal 
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            sessionName={extractedData.tipo_documento}
            frontFile={frontFile}
            backFile={backFile}
            extractedData={extractedData}
            history={chatHistory}
            onUpdateHistory={setChatHistory}
          />
        </>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        userEmail={user.email} 
        onLogout={handleLogout}
      />

      <PreviewModal 
        previewDoc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onLoad={handleLoadDirect}
        onDocUpdated={handleDocUpdated}
      />
      
      {/* Footer Version */}
      <div className="text-center py-4 text-[10px] text-slate-400 dark:text-slate-600">
        &copy; 2025 DocuScanner AI
        <span className="float-right mr-4">v0.20.4-beta</span>
      </div>
    </div>
  );
};

export default App;
