export interface ExtractedData {
  cognome: string;
  nome: string;
  data_nascita: string;
  luogo_nascita: string;
  sesso?: string; // Nuovo campo (M/F)
  indirizzo_residenza: string;
  citta_residenza: string;
  codice_fiscale?: string;
  numero_documento?: string;
  data_scadenza?: string;
  data_rilascio?: string;
  tipo_documento: string;
}

export interface FileData {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface DocumentSession {
  id: string;
  name: string; // Es. "Documento 1"
  frontFile: FileData | null;
  backFile: FileData | null;
  status: ProcessingStatus;
  extractedData: ExtractedData | null;
  errorMsg: string | null;
  saveSuccess: boolean;
  chatHistory: ChatMessage[];
}

export interface JotformFieldMapping {
  cognome: string;
  nome: string;
  data_nascita: string;
  luogo_nascita: string;
  indirizzo_residenza: string;
  citta_residenza: string;
  codice_fiscale: string;
  numero_documento: string;
  data_scadenza: string;
  data_rilascio: string;
}

export interface JotformConfig {
  formId: string;
  mappings: JotformFieldMapping;
}

// Aggiornato per supportare chiavi dinamiche (Profili documento)
export interface JotformSettings {
  [profileName: string]: JotformConfig;
}