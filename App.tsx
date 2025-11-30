import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
// CSS loaded via CDN in index.html to avoid ESM import issues
import { 
  Plus, History, FileText, Trash2, Save, Download, 
  ExternalLink, Loader2, Eye, ArrowUpDown, X, Pencil, Filter, Database, Key, Cloud, CheckCircle, AlertCircle, ScanSearch, Printer, Send,
  Sparkles, RefreshCw, Lock, Unlock, FileSpreadsheet, ShieldCheck, QrCode, Share2, CalendarClock, AlertTriangle, MessageSquareText, Search, CheckSquare, Square, Tag, ChevronDown, BookOpen
} from 'lucide-react';
import { Header } from './components/Header';
import { UploadArea } from './components/UploadArea';
import { ResultForm } from './components/ResultForm';
import { AuthForm } from './components/AuthForm';
import { JotformModal } from './components/JotformModal';
import { PdfThumbnail } from './components/PdfThumbnail';
import { ResultPreview } from './components/ResultPreview';
import { PreviewModal } from './components/PreviewModal';
import { ChatModal } from './components/ChatModal';
import { 
  ExtractedData, FileData, ProcessingStatus, DocumentSession, ChatMessage
} from './types';
import { extractDataFromDocument } from './services/geminiService';
import { fileToBase64, convertHeicToJpeg } from './services/utils';
import { supabase, isConfigured, saveSupabaseConfig } from './services/supabaseClient';
import { 
  saveDocumentToDb, fetchDocumentsFromDb, deleteDocumentFromDb, deleteDocumentsFromDb, SavedDocument 
} from './services/dbService';
import { generateLegalizationPdf, generateDataSheetPdf } from './services/pdfGenerator';
import { exportToCsv, generateCsvFile, exportMultipleToCsv } from './services/exportService';
import { syncMasterKey } from './services/security';
import { scanQrCodeFromImage } from './services/qrService';
import { extractInfoFromFiscalCode } from './services/fiscalCodeUtils';
import { rotateImage } from './services/imageUtils';
import { getExpirationInfo, parseItalianDate } from './services/dateUtils';
import { getTagColor } from './services/tagUtils';

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptySession = (index: number): DocumentSession => ({
  id: generateId(),
  name: `Documento ${index + 1}`,
  frontFile: null,
  backFile: null,
  status: ProcessingStatus.IDLE,
  extractedData: null,
  errorMsg: null,
  saveSuccess: false,
  chatHistory: [] // Init chat
});

const VAULT_FILTERS = [
  "Tutti",
  "Carta d'Identità",
  "Patente di Guida",
  "Tessera Sanitaria",
  "Passaporto",
  "Altro"
];

function App() {
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isSupabaseReady, setIsSupabaseReady] = useState(isConfigured());
  const [isSecurityReady, setIsSecurityReady] = useState(false); // Nuovo stato per la sync delle chiavi
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('docuscanner_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Config states
  const [configUrl, setConfigUrl] = useState('');
  const [configKey, setConfigKey] = useState('');
  
  const [sessions, setSessions] = useState<DocumentSession[]>([createEmptySession(0)]);
  const [activeSessionId, setActiveSessionId] = useState<string>(sessions[0].id);

  const [savedDocs, setSavedDocs] = useState<SavedDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set()); // Bulk Selection
  const [isJotformOpen, setIsJotformOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfMenuOpen, setIsPdfMenuOpen] = useState(false);

  // Vault States
  const [searchQuery, setSearchQuery] = useState("");
  const [vaultFilter, setVaultFilter] = useState<string>("Tutti");
  const [tagFilter, setTagFilter] = useState<string>(""); // Filtro per tag
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'type' | 'expiration'>('newest');
  const [previewDoc, setPreviewDoc] = useState<SavedDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Session Renaming
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");

  // Apply Theme Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('docuscanner_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('docuscanner_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Auth & Security Check
  useEffect(() => {
    if (!isSupabaseReady) {
        setLoadingAuth(false);
        return;
    }

    let mounted = true;

    const initApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Avvia sincronizzazione chiavi usando l'utente già recuperato
            await syncMasterKey(session.user);
          }
        }
      } catch (error) {
        console.error("Errore inizializzazione:", error);
      } finally {
        if (mounted) {
          // Importante: sblocchiamo SEMPRE l'interfaccia alla fine dell'init
          setIsSecurityReady(true);
          setLoadingAuth(false);
        }
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      // Ignora aggiornamenti token background per evitare loop di loading
      if (event === 'TOKEN_REFRESHED') {
        return;
      }

      // Aggiorna utente
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN') {
          // Login esplicito: mostra loader e sincronizza
          setLoadingAuth(true);
          setIsSecurityReady(false);
          
          if (session?.user) {
             await syncMasterKey(session.user);
          }
          
          setIsSecurityReady(true);
          setLoadingAuth(false);
      } else if (event === 'SIGNED_OUT') {
          // Reset completo stato per evitare UI sporca
          setIsSecurityReady(false);
          setUser(null);
          
          const newSession = createEmptySession(0);
          setSessions([newSession]);
          setActiveSessionId(newSession.id);
          
          setSavedDocs([]);
          setSelectedDocIds(new Set());
      }
    });

    return () => {
      mounted = false;
      // Reset preventivo stato
      setUser(null);
      subscription.unsubscribe();
    };
  }, [isSupabaseReady]);

  // Auto-healing activeSessionId: Assicura che la sessione attiva esista sempre
  useEffect(() => {
    if (sessions.length > 0) {
      const currentSessionExists = sessions.some(s => s.id === activeSessionId);
      if (!currentSessionExists) {
        // Se la sessione attiva non esiste più (es. dopo reset), passa alla prima disponibile
        setActiveSessionId(sessions[0].id);
      }
    }
  }, [sessions, activeSessionId]);

  // Fetch History only when User AND Security are ready
  useEffect(() => {
    if (user && isSecurityReady) {
      loadHistory();
    }
  }, [user, isSecurityReady]);

  const loadHistory = async () => {
    try {
      const docs = await fetchDocumentsFromDb();
      setSavedDocs(docs);
    } catch (error) {
      console.error(error);
      toast.error("Errore caricamento storico");
    }
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
        saveSupabaseConfig(configUrl, configKey);
    } catch (e: any) {
        toast.error(e.message);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const updateActiveSession = (updates: Partial<DocumentSession>) => {
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { ...s, ...updates } : s
    ));
  };

  // --- Session Management ---
  const addNewSession = () => {
    const newSession = createEmptySession(sessions.length);
    setSessions([...sessions, newSession]);
    setActiveSessionId(newSession.id);
  };

  const removeSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (sessions.length === 1) {
      updateActiveSession({
        frontFile: null,
        backFile: null,
        extractedData: null,
        status: ProcessingStatus.IDLE,
        errorMsg: null,
        saveSuccess: false,
        chatHistory: []
      });
      return;
    }
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    // Auto-healing useEffect will handle activeSessionId update if needed
  };

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

  // --- File Processing ---
  const validateFile = (file: File): string | null => {
    const validTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'application/pdf', 
      'image/heic', 'image/heic-sequence' // HEIC support
    ];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
      return "Formato file non supportato. Usa JPG, PNG, HEIC o PDF.";
    }
    if (file.size > 10 * 1024 * 1024) { // Increased limit for raw photos
      return "Il file è troppo grande. Dimensione massima 10MB.";
    }
    return null;
  };

  const processFiles = async (files: File[]) => {
    const validFiles: File[] = [];
    let error = null;

    // First Validation Pass
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
      // Conversion & Processing Pass
      const processedFiles = await Promise.all(validFiles.map(async (f) => {
        let finalFile = f;
        
        // Handle HEIC Conversion
        if (f.type === 'image/heic' || f.type === 'image/heic-sequence' || f.name.toLowerCase().endsWith('.heic')) {
          const loadingToast = toast.info(`Conversione HEIC: ${f.name}...`, { autoClose: false });
          try {
            finalFile = await convertHeicToJpeg(f);
            toast.dismiss(loadingToast);
            toast.success(`Convertito: ${f.name} -> JPG`);
          } catch (e) {
            toast.dismiss(loadingToast);
            toast.error(`Errore conversione ${f.name}`);
            throw e;
          }
        }

        return {
          file: finalFile,
          previewUrl: URL.createObjectURL(finalFile),
          base64: await fileToBase64(finalFile),
          mimeType: finalFile.type
        };
      }));

      if (processedFiles.length === 1) {
        const fileData = processedFiles[0];
        if (!activeSession.frontFile) {
          updateActiveSession({ frontFile: fileData, errorMsg: null });
        } else if (!activeSession.backFile) {
          updateActiveSession({ backFile: fileData, errorMsg: null });
        } else {
          updateActiveSession({ frontFile: fileData, errorMsg: null });
        }
      } 
      else if (processedFiles.length === 2 && !activeSession.frontFile && !activeSession.backFile) {
        updateActiveSession({
          frontFile: processedFiles[0],
          backFile: processedFiles[1],
          errorMsg: null
        });
      }
      else {
        const newSessions: DocumentSession[] = [];
        let currentBatchSession: Partial<DocumentSession> = {};
        
        processedFiles.forEach((pf, idx) => {
          if (idx % 2 === 0) {
             currentBatchSession = {
               id: generateId(),
               name: `Documento ${sessions.length + newSessions.length + 1}`,
               status: ProcessingStatus.IDLE,
               frontFile: pf,
               backFile: null,
               extractedData: null,
               errorMsg: null,
               saveSuccess: false,
               chatHistory: []
             };
             newSessions.push(currentBatchSession as DocumentSession);
          } else {
            const lastSession = newSessions[newSessions.length - 1];
            lastSession.backFile = pf;
          }
        });

        setSessions(prev => [...prev, ...newSessions]);
        toast.success(`${newSessions.length} nuovi documenti aggiunti.`);
      }

    } catch (e) {
      console.error(e);
      toast.error("Errore nella lettura dei file.");
      updateActiveSession({ errorMsg: "Errore nella lettura dei file." });
    }
  };

  // Funzione per ruotare un'immagine di 90 gradi
  const handleRotate = async (target: 'front' | 'back') => {
    const fileData = target === 'front' ? activeSession.frontFile : activeSession.backFile;
    if (!fileData) return;

    try {
      const loadingToast = toast.info("Rotazione immagine...", { autoClose: false });
      
      const rotatedFile = await rotateImage(fileData.file, 90);
      const newBase64 = await fileToBase64(rotatedFile);
      const newPreview = URL.createObjectURL(rotatedFile);
      
      const newFileData: FileData = {
        file: rotatedFile,
        base64: newBase64,
        previewUrl: newPreview,
        mimeType: 'image/jpeg'
      };

      if (target === 'front') {
        updateActiveSession({ frontFile: newFileData });
      } else {
        updateActiveSession({ backFile: newFileData });
      }
      
      toast.dismiss(loadingToast);
    } catch (error) {
      console.error(error);
      toast.error("Errore durante la rotazione dell'immagine");
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

      // 1. TENTATIVO SCANSIONE QR CODE / BARCODE (Fallback Locale & Validazione)
      let qrFiscalCode: string | null = null;
      try {
          const frontQr = await scanQrCodeFromImage(activeSession.frontFile.file);
          if (frontQr?.isFiscalCode) {
              qrFiscalCode = frontQr.text;
          } else if (activeSession.backFile) {
              const backQr = await scanQrCodeFromImage(activeSession.backFile.file);
              if (backQr?.isFiscalCode) {
                  qrFiscalCode = backQr.text;
              }
          }
          
          if (qrFiscalCode) {
              console.log("Barcode/QR Code Rilevato (CF):", qrFiscalCode);
              toast.success("Codice a barre/QR rilevato: Codice Fiscale estratto!", { autoClose: 2000 });
          }
      } catch (e) {
          console.warn("Errore scansione QR/Barcode (ignorato):", e);
      }
      
      // 2. CHIAMATA AI (Gemini)
      const data = await extractDataFromDocument(
        activeSession.frontFile.base64, 
        activeSession.frontFile.mimeType,
        activeSession.backFile?.base64,
        activeSession.backFile?.mimeType
      );
      
      // 3. MERGE DATI (QR vince su AI per CF) e REVERSE ENGINEERING CF
      const finalData = { ...data, tags: [] }; // Init tags empty
      if (qrFiscalCode) {
          finalData.codice_fiscale = qrFiscalCode.toUpperCase();
      }
      
      // Data Enrichment: Calcola Sesso e Data Nascita dal Codice Fiscale
      if (finalData.codice_fiscale) {
          const derived = extractInfoFromFiscalCode(finalData.codice_fiscale);
          
          // Assegna i dati derivati se mancanti o se abbiamo letto il CF da un Barcode (più affidabile dell'OCR)
          if (derived.sesso) {
              // Se manca o se abbiamo usato il QR, usiamo quello derivato
              if (!finalData.sesso || qrFiscalCode) {
                   finalData.sesso = derived.sesso;
              }
          }
          
          if (derived.data_nascita) {
               // Se manca o se abbiamo usato il QR, usiamo quello derivato
               if (!finalData.data_nascita || qrFiscalCode) {
                   finalData.data_nascita = derived.data_nascita;
               }
          }
      }
      
      // Logica euristica per raffinare il tipo documento se abbiamo un CF da barcode
      if (qrFiscalCode && (!finalData.tipo_documento || finalData.tipo_documento === "Altro")) {
           // Lasciamo come Altro o proviamo a indovinare, ma per ora la logica è sufficiente nel prompt
      }

      updateActiveSession({ 
        extractedData: finalData, 
        status: ProcessingStatus.SUCCESS 
      });
      
      if (!qrFiscalCode) {
        toast.success("Dati estratti con successo!");
      }

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
      saveSuccess: false,
      chatHistory: []
    });
  };

  const handleFormChange = (field: keyof ExtractedData, value: any) => {
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

  // --- Cloud Operations ---
  const handleCloudSave = async () => {
    if (!activeSession.extractedData) return;
    setIsSaving(true);
    try {
      await saveDocumentToDb(activeSession.extractedData);
      await loadHistory();
      updateActiveSession({ saveSuccess: true });
      toast.success("Documento salvato e crittografato!");
      setTimeout(() => updateActiveSession({ saveSuccess: false }), 3000);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadDoc = (doc: SavedDocument) => {
    if (doc.is_error) {
      toast.error("Impossibile caricare questo documento: la chiave di crittografia è diversa o mancante. Eliminalo e scansionalo di nuovo.", {
        autoClose: 5000
      });
      return;
    }

    // Assicuriamoci di operare sulla sessione attiva corrente
    updateActiveSession({
      name: doc.summary,
      extractedData: doc.content,
      status: ProcessingStatus.SUCCESS,
      frontFile: null,
      backFile: null,
      saveSuccess: true
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info("Documento decifrato e caricato.");
  };

  // --- Bulk Selection Handlers ---
  const handleToggleSelect = (id: string) => {
    setSelectedDocIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (filteredDocs: SavedDocument[]) => {
     if (selectedDocIds.size === filteredDocs.length && filteredDocs.length > 0) {
        // Deselect all
        setSelectedDocIds(new Set());
     } else {
        // Select all visible
        setSelectedDocIds(new Set(filteredDocs.map(d => d.id)));
     }
  };

  const handleBulkDelete = async () => {
    if (selectedDocIds.size === 0) return;
    if (!window.confirm(`Sei sicuro di voler eliminare ${selectedDocIds.size} documenti?`)) return;

    setIsBulkDeleting(true);
    try {
        await deleteDocumentsFromDb(Array.from(selectedDocIds));
        setSavedDocs(prev => prev.filter(d => !selectedDocIds.has(d.id)));
        setSelectedDocIds(new Set());
        toast.success("Documenti eliminati.");
    } catch (e) {
        console.error(e);
        toast.error("Errore durante l'eliminazione multipla.");
    } finally {
        setIsBulkDeleting(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedDocIds.size === 0) return;
    
    // Filtra i documenti selezionati
    const docsToExport = savedDocs.filter(d => selectedDocIds.has(d.id));
    // Filtra quelli con errore (non esportabili)
    const validDocs = docsToExport.filter(d => !d.is_error);

    if (validDocs.length === 0) {
        toast.warn("Nessun documento valido selezionato per l'esportazione.");
        return;
    }

    try {
        exportMultipleToCsv(validDocs);
        toast.success(`Esportati ${validDocs.length} documenti in CSV.`);
    } catch (e) {
        toast.error("Errore durante l'esportazione.");
    }
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    try {
      await deleteDocumentFromDb(docToDelete);
      setSavedDocs(prev => prev.filter(d => d.id !== docToDelete));
      toast.info("Documento eliminato.");
      if (activeSession.id === docToDelete) {
          updateActiveSession({
            status: ProcessingStatus.IDLE,
            extractedData: null,
            frontFile: null,
            backFile: null
          });
      }
    } catch (e) {
      toast.error("Errore durante l'eliminazione.");
    } finally {
      setDocToDelete(null);
    }
  };

  const handlePrintPdf = (type: 'legalization' | 'datasheet') => {
    setIsPdfMenuOpen(false); // Close menu
    if (activeSession.extractedData) {
        try {
            if (type === 'datasheet') {
                 generateDataSheetPdf(activeSession.extractedData);
            } else {
                 generateLegalizationPdf(activeSession.extractedData);
            }
            toast.success("PDF generato correttamente!");
        } catch (e) {
            toast.error("Errore nella generazione del PDF.");
        }
    }
  };

  const handleCsvExport = () => {
    if (activeSession.extractedData) {
        exportToCsv(activeSession.extractedData);
        toast.success("File CSV scaricato!");
    }
  };

  const handleNativeShare = async () => {
    if (!activeSession.extractedData) return;

    if (!navigator.canShare) {
        toast.error("Il tuo browser non supporta la condivisione nativa.");
        return;
    }

    try {
        const file = generateCsvFile(activeSession.extractedData);
        const shareData = {
            files: [file],
            title: `Documento - ${activeSession.extractedData.cognome}`,
            text: `Dati estratti per ${activeSession.extractedData.cognome} ${activeSession.extractedData.nome}`
        };

        if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
        } else {
            toast.warn("Il tuo dispositivo non supporta la condivisione di file.");
        }
    } catch (err: any) {
        // Ignora AbortError (utente ha chiuso il menu)
        if (err.name === 'AbortError') {
             console.log("Condivisione annullata dall'utente.");
             return;
        }
        console.error("Errore condivisione:", err);
        toast.error("Impossibile condividere.");
    }
  };

  // --- Rendering Helpers ---
  // Estrai tutti i tag univoci dai documenti salvati
  const availableTags = Array.from(new Set(
      savedDocs.flatMap(doc => doc.content.tags || [])
  )).sort();

  const getFilteredAndSortedDocs = () => {
    let result = savedDocs;

    // Filter by Type
    if (vaultFilter !== "Tutti") {
      result = result.filter(doc => doc.doc_type === vaultFilter);
    }
    
    // Filter by Tag
    if (tagFilter) {
      result = result.filter(doc => doc.content.tags?.includes(tagFilter));
    }

    // Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(doc => {
        // Search in summary
        if (doc.summary.toLowerCase().includes(q)) return true;
        
        // Search in tags
        if (doc.content.tags?.some(t => t.toLowerCase().includes(q))) return true;

        // Search in extracted content fields (safe access)
        const content = doc.content;
        return (
          content.nome?.toLowerCase().includes(q) ||
          content.cognome?.toLowerCase().includes(q) ||
          content.codice_fiscale?.toLowerCase().includes(q) ||
          content.numero_documento?.toLowerCase().includes(q) ||
          content.citta_residenza?.toLowerCase().includes(q)
        );
      });
    }

    // Sort
    return result.sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortOrder === 'type') return a.doc_type.localeCompare(b.doc_type);
      if (sortOrder === 'expiration') {
          const dateA = parseItalianDate(a.content.data_scadenza);
          const dateB = parseItalianDate(b.content.data_scadenza);
          
          if (!dateA) return 1; // Put ones without date at the end
          if (!dateB) return -1;
          
          return dateA.getTime() - dateB.getTime(); // Ascending (Expired first)
      }
      return 0;
    });
  };

  const sortedDocs = getFilteredAndSortedDocs();

  // --- Main Render ---
  if (loadingAuth || (user && !isSecurityReady)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400"/>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium animate-pulse">
           <ShieldCheck className="w-5 h-5 text-emerald-500" />
           <span>Sincronizzazione sicurezza in corso...</span>
        </div>
      </div>
    );
  }

  if (!isSupabaseReady) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-slate-100">
                <div className="text-center mb-6">
                    <div className="bg-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                        <Database className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Configurazione Database</h1>
                    <p className="text-slate-500 text-sm mt-2">
                        Per salvare i tuoi dati in cloud, connetti il tuo progetto Supabase.
                    </p>
                </div>

                <form onSubmit={handleConfigSubmit} className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-700 mb-4">
                        <span className="font-bold">Nota:</span> Inserisci l'URL e la chiave Anon del tuo progetto. Questi dati verranno salvati solo nel tuo browser.
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">Project URL</label>
                        <div className="relative">
                            <Cloud className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="url"
                                required
                                value={configUrl}
                                onChange={(e) => setConfigUrl(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                                placeholder="https://xyz.supabase.co"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">Anon / Public Key</label>
                        <div className="relative">
                            <Key className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                required
                                value={configKey}
                                onChange={(e) => setConfigKey(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                                placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mt-6"
                    >
                        <Save className="w-5 h-5" /> Salva e Connetti
                    </button>
                </form>
                <ToastContainer position="bottom-center" theme="colored" />
            </div>
        </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthForm />
        <ToastContainer position="bottom-center" theme="colored" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-300">
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

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
                  ? 'bg-white dark:bg-slate-800 border-blue-600 text-blue-700 dark:text-blue-400 shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-800/50 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}
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
                    className="text-sm font-semibold bg-white dark:bg-slate-700 border border-blue-400 rounded px-1 -ml-1 text-slate-900 dark:text-white w-full outline-none shadow-sm"
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
                 {activeSessionId === session.id && renamingId !== session.id && (
                    <button
                        onClick={(e) => startRenaming(session, e)}
                        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Rinomina"
                    >
                        <Pencil className="w-3 h-3" />
                    </button>
                 )}

                 {session.saveSuccess && <CheckCircle className="w-4 h-4 text-green-500" />}
                 {session.status === ProcessingStatus.ERROR && <AlertCircle className="w-4 h-4 text-red-500" />}
                 
                 <button 
                   onClick={(e) => removeSession(e, session.id)}
                   className="p-1 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors ml-1"
                   title="Chiudi sessione"
                 >
                   <X className="w-3 h-3" />
                 </button>
              </div>
            </div>
          ))}
          
          <button
            onClick={addNewSession}
            className="flex items-center justify-center p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
            title="Aggiungi Documento"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* ACTIVE SESSION CONTENT */}
        <div className="animate-fade-in">
          
          {activeSession.status === ProcessingStatus.IDLE && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                   Carica {activeSession.name}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Trascina uno o più file (Immagini, HEIC o PDF) per iniziare.
                </p>
              </div>
              
              {activeSession.errorMsg && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-300 max-w-2xl mx-auto">
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
                onRotateFront={() => handleRotate('front')}
                onRotateBack={() => handleRotate('back')}
              />

              <div className="flex justify-center pt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={!activeSession.frontFile}
                  className={`
                    flex items-center gap-3 px-8 py-4 rounded-full text-lg font-semibold shadow-lg transition-all
                    ${activeSession.frontFile 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 hover:scale-105 cursor-pointer' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'}
                  `}
                >
                  <ScanSearch className="w-6 h-6" />
                  Analizza Documento
                </button>
              </div>
            </div>
          )}

          {activeSession.status === ProcessingStatus.PROCESSING && (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-500 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Analisi di {activeSession.name} in corso...</h3>
                <p className="text-slate-500 dark:text-slate-400">L'intelligenza artificiale sta estraendo i dati.</p>
              </div>
            </div>
          )}

          {activeSession.status === ProcessingStatus.ERROR && (
            <div className="max-w-xl mx-auto mt-12 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-red-100 dark:border-red-900/50 text-center space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Errore su {activeSession.name}</h3>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-red-700 dark:text-red-300 text-sm font-medium border border-red-100 dark:border-red-800 inline-block px-6">
                {activeSession.errorMsg}
              </div>
              <button 
                onClick={() => updateActiveSession({ status: ProcessingStatus.IDLE })}
                className="mt-4 px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Riprova
              </button>
            </div>
          )}

          {activeSession.status === ProcessingStatus.SUCCESS && activeSession.extractedData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              <div className="space-y-4">
                {activeSession.frontFile ? (
                   <div className="grid grid-cols-2 gap-4">
                      <ResultPreview file={activeSession.frontFile} label="Fronte" />

                      {activeSession.backFile ? (
                        <ResultPreview file={activeSession.backFile} label="Retro" />
                      ) : (
                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs text-center p-4">
                            Nessun Retro
                        </div>
                      )}
                  </div>
                ) : (
                   <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-6 text-center text-blue-800 dark:text-blue-300 text-sm">
                      <p className="font-semibold">Visualizzazione Archivio</p>
                      <p>I file originali non sono disponibili nel cloud per risparmiare spazio, ma puoi modificare e riutilizzare i dati estratti.</p>
                   </div>
                )}
                
                <button 
                  onClick={handleResetSession}
                  className="w-full py-3 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <RefreshCw className="w-4 h-4" /> Resetta Documento
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Dati {activeSession.name}</span>
                    </div>
                </div>
                
                <ResultForm 
                  data={activeSession.extractedData} 
                  onChange={handleFormChange}
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  setActiveSessionId={setActiveSessionId}
                />
                
                <div className="flex gap-2 flex-wrap">
                  <button 
                    onClick={handleCloudSave}
                    disabled={isSaving || activeSession.saveSuccess}
                    className={`flex-1 min-w-[140px] py-3 px-2 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 font-semibold text-sm ${
                      activeSession.saveSuccess 
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-200 dark:shadow-none'
                      : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 shadow-slate-200 dark:shadow-none'
                    }`}
                  >
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : activeSession.saveSuccess ? (
                        <>
                            <CheckCircle className="w-4 h-4" /> Salvato
                        </>
                    ) : (
                        <>
                            <Lock className="w-4 h-4" /> Salva
                        </>
                    )}
                  </button>

                  {/* Ask AI Button (Enabled for both scan and archive modes) */}
                  {(activeSession.frontFile || activeSession.extractedData) && (
                    <button
                      onClick={() => setIsChatOpen(true)}
                      className="flex-1 min-w-[140px] py-3 px-2 bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                    >
                      <MessageSquareText className="w-4 h-4" /> Chiedi AI
                    </button>
                  )}
                  
                  {/* Share button visible only if supported */}
                  {navigator.canShare && (
                      <button 
                        onClick={handleNativeShare}
                        className="flex-1 min-w-[140px] py-3 px-2 bg-pink-600 text-white rounded-lg shadow-md shadow-pink-200 dark:shadow-none hover:bg-pink-700 transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                      >
                        <Share2 className="w-4 h-4" /> Condividi
                      </button>
                  )}

                  {/* PDF Print Dropdown */}
                  <div className="relative flex-1 min-w-[140px]">
                      <button 
                        onClick={() => setIsPdfMenuOpen(!isPdfMenuOpen)}
                        className="w-full py-3 px-2 bg-blue-500 text-white rounded-lg shadow-md shadow-blue-200 dark:shadow-none hover:bg-blue-600 transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                      >
                        <Printer className="w-4 h-4" /> Stampa
                        <ChevronDown className="w-3 h-3 opacity-80" />
                      </button>
                      
                      {isPdfMenuOpen && (
                          <div className="absolute bottom-full mb-2 left-0 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-20 animate-fade-in">
                              <button 
                                  onClick={() => handlePrintPdf('datasheet')}
                                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-2 border-b border-slate-100 dark:border-slate-700"
                              >
                                  <BookOpen className="w-4 h-4 text-blue-500" /> Scheda Dati
                              </button>
                              <button 
                                  onClick={() => handlePrintPdf('legalization')}
                                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-2"
                              >
                                  <FileText className="w-4 h-4 text-slate-500" /> Legalizzazione
                              </button>
                          </div>
                      )}
                  </div>

                  <button 
                    onClick={handleCsvExport}
                    className="flex-1 min-w-[140px] py-3 px-2 bg-emerald-600 text-white rounded-lg shadow-md shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> CSV
                  </button>

                  <button 
                    onClick={() => setIsJotformOpen(true)}
                    className="flex-1 min-w-[140px] py-3 px-2 bg-orange-500 text-white rounded-lg shadow-md shadow-orange-200 dark:shadow-none hover:bg-orange-600 transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                  >
                    <Send className="w-4 h-4" /> JotForm
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Vault Summary */}
        {savedDocs.length > 0 && (
          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700 pb-24">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                    <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Archivio Cloud</h3>
                  <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">{savedDocs.length}</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  
                  {/* BULK: Select All */}
                  <button 
                    onClick={() => handleSelectAll(sortedDocs)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                     {selectedDocIds.size > 0 && selectedDocIds.size === sortedDocs.length ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                     Seleziona Tutto
                  </button>

                  {/* SEARCH BAR */}
                  <div className="relative flex-grow md:flex-grow-0 md:w-64 group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Cerca nome, CF, città..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-1.5 bg-white text-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-400 dark:focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                           <X className="w-3 h-3" />
                        </button>
                      )}
                  </div>

                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

                  <div className="flex items-center gap-3">
                    <div className="relative group">
                        <button className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <ArrowUpDown className="w-3 h-3" />
                        {sortOrder === 'newest' ? 'Più recenti' : sortOrder === 'oldest' ? 'Meno recenti' : sortOrder === 'expiration' ? 'Per scadenza' : 'Per tipo'}
                        </button>
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-lg rounded-lg py-1 w-36 hidden group-hover:block z-20">
                        <button onClick={() => setSortOrder('newest')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Più recenti</button>
                        <button onClick={() => setSortOrder('oldest')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Meno recenti</button>
                        <button onClick={() => setSortOrder('expiration')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex justify-between items-center">Per scadenza <CalendarClock className="w-3 h-3 text-slate-400"/></button>
                        <button onClick={() => setSortOrder('type')} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Per tipo</button>
                        </div>
                    </div>

                    {/* TAG FILTER */}
                    {availableTags.length > 0 && (
                        <div className="relative">
                            <select 
                                value={tagFilter}
                                onChange={(e) => setTagFilter(e.target.value)}
                                className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg pr-8 focus:outline-none hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                            >
                                <option value="">Tutti i Tag</option>
                                {availableTags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                            <Tag className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    )}

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-full">
                        {VAULT_FILTERS.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setVaultFilter(filter)}
                            className={`
                            text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border
                            ${vaultFilter === filter 
                                ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-800 dark:border-white' 
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}
                            `}
                        >
                            {filter}
                        </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {sortedDocs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                   <p className="text-slate-500 dark:text-slate-400 text-sm">
                       {searchQuery 
                         ? `Nessun risultato per "${searchQuery}"`
                         : tagFilter
                         ? `Nessun documento con tag "${tagFilter}"`
                         : `Nessun documento trovato per "${vaultFilter}"`}
                   </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedDocs.map((savedDoc) => {
                    const expiryInfo = getExpirationInfo(savedDoc.content.data_scadenza);
                    const isSelected = selectedDocIds.has(savedDoc.id);
                    const docTags = savedDoc.content.tags || [];
                    
                    return (
                      <div 
                        key={savedDoc.id} 
                        className={`
                            bg-white dark:bg-slate-800 p-4 rounded-xl border shadow-sm transition-all group relative cursor-pointer
                            ${savedDoc.is_error ? 'border-red-200 dark:border-red-900 bg-red-50/20' : 
                              isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 
                              'border-slate-200 dark:border-slate-700 hover:shadow-md'}
                        `}
                        onClick={() => handleToggleSelect(savedDoc.id)}
                      >
                        {/* Checkbox Overlay */}
                        <div className="absolute top-4 right-4 z-20">
                             {isSelected ? (
                                 <CheckSquare className="w-5 h-5 text-blue-600 fill-white dark:fill-slate-800" />
                             ) : (
                                 <Square className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-blue-500 transition-colors" />
                             )}
                        </div>

                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${savedDoc.is_error ? 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400' : savedDoc.is_encrypted ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                {savedDoc.is_error ? <AlertCircle className="w-4 h-4" /> : savedDoc.is_encrypted ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className={`text-xs font-medium ${savedDoc.is_error ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>{savedDoc.doc_type || 'Sconosciuto'}</p>
                                <p className="text-xs text-slate-300 dark:text-slate-600">{new Date(savedDoc.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          {/* Standard Actions (Hidden if selecting multiple to avoid clutter, optional) */}
                          <div className="flex gap-1 pr-6">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPreviewDoc(savedDoc); }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="Anteprima rapida"
                              disabled={savedDoc.is_error}
                            >
                              <Eye className={`w-4 h-4 ${savedDoc.is_error ? 'opacity-50 cursor-not-allowed' : ''}`} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDocToDelete(savedDoc.id); }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="Elimina"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <h4 className={`font-semibold text-sm mb-3 truncate ${savedDoc.is_error ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`} title={String(savedDoc.summary)}>
                          {String(savedDoc.summary)}
                        </h4>
                        
                        {/* TAGS DISPLAY */}
                        {!savedDoc.is_error && docTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {docTags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${getTagColor(tag)}`}>
                                        {tag}
                                    </span>
                                ))}
                                {docTags.length > 3 && (
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                        +{docTags.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                        
                        {/* Expiration Badge & Bar */}
                        {!savedDoc.is_error && expiryInfo.status !== 'unknown' && (
                           <div className="mb-4">
                              <div className="flex justify-between items-center mb-1">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${expiryInfo.bgColor} ${expiryInfo.color} flex items-center gap-1`}>
                                    {expiryInfo.status === 'expired' && <AlertTriangle className="w-3 h-3" />}
                                    {expiryInfo.status === 'valid' && <CheckCircle className="w-3 h-3" />}
                                    {expiryInfo.status === 'warning' && <CalendarClock className="w-3 h-3" />}
                                    {expiryInfo.label}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{savedDoc.content.data_scadenza}</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                <div 
                                   className={`h-1.5 rounded-full transition-all duration-500 ${
                                     expiryInfo.status === 'valid' ? 'bg-emerald-500' :
                                     expiryInfo.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                                   }`} 
                                   style={{ width: `${expiryInfo.progress}%` }}
                                ></div>
                              </div>
                           </div>
                        )}

                        <button 
                          onClick={(e) => { e.stopPropagation(); handleLoadDoc(savedDoc); }}
                          className={`w-full py-2 text-xs font-semibold rounded-lg transition-colors ${
                            savedDoc.is_error 
                            ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 hover:bg-red-200 cursor-not-allowed' 
                            : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                          }`}
                        >
                          {savedDoc.is_error ? "Illeggibile (Elimina)" : savedDoc.is_encrypted ? "Decifra e Modifica" : "Carica nel workspace"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}

        {/* FLOATING ACTION BAR FOR BULK ACTIONS */}
        {selectedDocIds.size > 0 && (
           <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-2xl z-40 flex items-center gap-6 animate-fade-in border border-slate-700 dark:border-slate-200">
               <div className="flex items-center gap-2 font-bold text-sm">
                   <span className="bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                       {selectedDocIds.size}
                   </span>
                   <span>Selezionati</span>
               </div>
               
               <div className="h-6 w-px bg-slate-700 dark:bg-slate-200"></div>

               <div className="flex items-center gap-3">
                    <button 
                        onClick={handleBulkExport}
                        className="flex items-center gap-2 hover:text-blue-400 dark:hover:text-blue-600 transition-colors text-sm font-medium"
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Esporta CSV
                    </button>
                    <button 
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        className="flex items-center gap-2 hover:text-red-400 dark:hover:text-red-600 transition-colors text-sm font-medium"
                    >
                        {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />} Elimina
                    </button>
               </div>

               <button 
                 onClick={() => setSelectedDocIds(new Set())}
                 className="ml-2 p-1 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full transition-colors"
               >
                   <X className="w-4 h-4" />
               </button>
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

      {/* Chat Modal */}
      {(activeSession.frontFile || activeSession.extractedData) && (
        <ChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          sessionName={activeSession.name}
          frontFile={activeSession.frontFile}
          backFile={activeSession.backFile}
          extractedData={activeSession.extractedData}
          history={activeSession.chatHistory}
          onUpdateHistory={(newHistory) => updateActiveSession({ chatHistory: newHistory })}
        />
      )}

      {/* Preview Modal */}
      <PreviewModal previewDoc={previewDoc} onClose={() => setPreviewDoc(null)} onLoad={handleLoadDoc} />

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                 <AlertCircle className="w-6 h-6" />
                 <h3 className="text-lg font-bold">Elimina Documento</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                 Sei sicuro di voler eliminare questo documento dall'archivio cloud? Questa azione non può essere annullata.
              </p>
              <div className="flex justify-end gap-3">
                 <button 
                   onClick={() => setDocToDelete(null)}
                   className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                 >
                   Annulla
                 </button>
                 <button 
                   onClick={confirmDelete}
                   className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium shadow-md transition-colors"
                 >
                   Elimina Definitivamente
                 </button>
              </div>
           </div>
        </div>
      )}

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 mt-auto">
         <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-xs text-slate-400 dark:text-slate-600">
            <p>&copy; {new Date().getFullYear()} DocuScanner AI</p>
            <p>v0.16.0-beta</p>
         </div>
      </footer>

      {/* Global Toast Notifications */}
      <ToastContainer position="bottom-right" theme={isDarkMode ? 'dark' : 'colored'} autoClose={3000} />
    </div>
  );
}

export default App;