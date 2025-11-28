// Implementazione crittografia AES-GCM per archiviazione sicura locale

// Genera o recupera una chiave di crittografia per la sessione corrente
const getEncryptionKey = async (): Promise<CryptoKey> => {
    // In un'app reale, questa chiave dovrebbe derivare da una password utente tramite PBKDF2
    // Per questa demo, generiamo una chiave persistente in sessione
    const storedKey = sessionStorage.getItem('docuscanner_session_key');
    
    if (storedKey) {
      const rawKey = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
      return await window.crypto.subtle.importKey(
        "raw",
        rawKey,
        "AES-GCM",
        true,
        ["encrypt", "decrypt"]
      );
    }
  
    const key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
  
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
    const b64Key = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
    sessionStorage.setItem('docuscanner_session_key', b64Key);
    
    return key;
  };
  
  export interface EncryptedDocument {
    id: string;
    timestamp: number;
    iv: string; // Vettore di inizializzazione base64
    data: string; // Dati crittografati base64
    previewSummary: string; // Dati minimi in chiaro per la lista (es. "Patente - Mario Rossi")
    docType?: string; // Tipo documento per filtraggio (opzionale per retrocompatibilità)
  }
  
  export const encryptAndSave = async (data: any): Promise<void> => {
    try {
      const key = await getEncryptionKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(JSON.stringify(data));
      
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        key,
        encodedData
      );
  
      const encryptedDoc: EncryptedDocument = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        iv: btoa(String.fromCharCode(...iv)),
        data: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
        previewSummary: `${data.tipo_documento} - ${data.cognome} ${data.nome}`,
        docType: data.tipo_documento // Salviamo il tipo per i filtri
      };
  
      // Salva nel localStorage (simulazione DB sicuro)
      const existingDocs = getStoredDocsList();
      existingDocs.push(encryptedDoc);
      localStorage.setItem('secure_vault_docs', JSON.stringify(existingDocs));
      
    } catch (e) {
      console.error("Errore crittografia:", e);
      throw new Error("Impossibile crittografare i dati per il salvataggio sicuro.");
    }
  };
  
  export const getStoredDocsList = (): EncryptedDocument[] => {
    try {
      const docs = localStorage.getItem('secure_vault_docs');
      return docs ? JSON.parse(docs) : [];
    } catch {
      return [];
    }
  };
  
  export const decryptDoc = async (doc: EncryptedDocument): Promise<any> => {
    try {
        const key = await getEncryptionKey();
        const iv = Uint8Array.from(atob(doc.iv), c => c.charCodeAt(0));
        const data = Uint8Array.from(atob(doc.data), c => c.charCodeAt(0));
  
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            data
        );
  
        const decoded = new TextDecoder().decode(decryptedBuffer);
        return JSON.parse(decoded);
    } catch (e) {
        throw new Error("Decrittografia fallita. Chiave di sessione non valida o dati corrotti.");
    }
  };