
// Implementazione crittografia AES-GCM Client-Side per Supabase
// I dati vengono cifrati PRIMA di essere inviati al database.

const KEY_STORAGE_NAME = 'docuscanner_master_key';
let cachedKey: CryptoKey | null = null;

// Helper robusto per convertire ArrayBuffer in Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper robusto per convertire Base64 in Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

// Genera o recupera una chiave di crittografia persistente per il browser
const getEncryptionKey = async (): Promise<CryptoKey> => {
    // 1. Controlla cache in memoria
    if (cachedKey) return cachedKey;

    // 2. Controlla localStorage
    const storedKey = localStorage.getItem(KEY_STORAGE_NAME);
    
    if (storedKey) {
      try {
        // Tenta di importare la chiave esistente
        const rawKey = base64ToBuffer(storedKey);
        const key = await window.crypto.subtle.importKey(
          "raw",
          rawKey,
          "AES-GCM",
          true,
          ["encrypt", "decrypt"]
        );
        cachedKey = key;
        return key;
      } catch (e) {
        console.error("ERRORE CRITICO: La chiave salvata nel browser sembra corrotta o non valida.", e);
        // NON generiamo automaticamente una nuova chiave qui per evitare di rendere
        // permanentemente illeggibili i dati vecchi sovrascrivendo la chiave.
        // Se l'import fallisce, meglio lanciare errore che distruggere l'accesso.
        throw new Error("Errore critico sicurezza: Chiave di crittografia locale illeggibile.");
      }
    }
  
    // 3. Se non esiste chiave, generane una nuova
    console.log("Nessuna chiave trovata. Generazione nuova Master Key...");
    const key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
  
    // 4. Esporta e salva
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
    const b64Key = bufferToBase64(exportedKey);
    localStorage.setItem(KEY_STORAGE_NAME, b64Key);
    
    cachedKey = key;
    return key;
};

export interface EncryptedPayload {
  iv: string;   // Initialization Vector (Base64)
  data: string; // Ciphertext (Base64)
  isEncrypted: boolean;
}

// Cifra un oggetto JSON
export const encryptData = async (data: any): Promise<EncryptedPayload> => {
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

    return {
      iv: bufferToBase64(iv.buffer),
      data: bufferToBase64(encryptedBuffer),
      isEncrypted: true
    };
    
  } catch (e) {
    console.error("Errore crittografia:", e);
    throw new Error("Impossibile proteggere i dati. Operazione annullata.");
  }
};

// Decifra un payload
export const decryptData = async (payload: any): Promise<any> => {
  // Se i dati non sono cifrati (retrocompatibilità v0.1.0), ritornali così come sono
  if (!payload || !payload.isEncrypted) {
      return payload;
  }

  try {
      const key = await getEncryptionKey();
      
      // Controllo validità payload base
      if (!payload.iv || !payload.data) {
          throw new Error("Payload dati incompleto");
      }

      const iv = base64ToBuffer(payload.iv);
      const data = base64ToBuffer(payload.data);

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
  } catch (e: any) {
      // OperationError significa quasi sempre "Chiave sbagliata" o "Dati corrotti"
      if (e.name === 'OperationError') {
          console.warn("Decrittografia fallita: La chiave locale non corrisponde ai dati.");
      } else {
          console.warn("Errore decrittografia generico:", e);
      }
      throw new Error("Impossibile decifrare il documento.");
  }
};
