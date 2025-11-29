
import { supabase } from './supabaseClient';

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

// Funzione principale per SINCRONIZZARE la chiave tra LocalStorage e Cloud (Supabase)
export const syncMasterKey = async (): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // 1. Cerchiamo se c'è una chiave nel Cloud
        const { data: cloudKeyData, error } = await supabase
            .from('user_keys')
            .select('master_key')
            .eq('user_id', user.id)
            .single();

        const localKeyB64 = localStorage.getItem(KEY_STORAGE_NAME);

        // CASO A: Chiave presente nel Cloud -> Scarichiamo e usiamo quella (La verità è nel Cloud)
        if (cloudKeyData?.master_key) {
            console.log("🔒 Chiave trovata nel Cloud. Sincronizzazione...");
            // Se abbiamo una chiave locale diversa, la sovrascriviamo per allinearci
            if (localKeyB64 !== cloudKeyData.master_key) {
                localStorage.setItem(KEY_STORAGE_NAME, cloudKeyData.master_key);
                cachedKey = null; // Resetta cache per forzare ricaricamento
                await getEncryptionKey(); // Ricarica in memoria
                console.log("✅ Chiave locale aggiornata dal Cloud.");
            }
            return true;
        }

        // CASO B: Nessuna chiave nel Cloud, ma abbiamo una chiave Locale (es. Preview environment)
        if (localKeyB64 && !cloudKeyData) {
            console.log("☁️ Caricamento chiave locale nel Cloud...");
            const { error: uploadError } = await supabase
                .from('user_keys')
                .insert({
                    user_id: user.id,
                    master_key: localKeyB64
                });
            
            if (uploadError) {
                console.error("Errore upload chiave:", uploadError);
                return false;
            }
            console.log("✅ Chiave salvata nel Cloud!");
            return true;
        }

        // CASO C: Nessuna chiave né locale né Cloud (Primo avvio assoluto)
        if (!localKeyB64 && !cloudKeyData) {
            console.log("🆕 Generazione nuova Master Key (Local + Cloud)...");
            // Genera
            await getEncryptionKey(); 
            // Recupera la stringa appena generata
            const newKeyB64 = localStorage.getItem(KEY_STORAGE_NAME);
            if (newKeyB64) {
                 await supabase
                .from('user_keys')
                .insert({
                    user_id: user.id,
                    master_key: newKeyB64
                });
                console.log("✅ Nuova chiave generata e sincronizzata.");
            }
            return true;
        }

        return true;
    } catch (e) {
        console.error("Errore syncMasterKey:", e);
        return false;
    }
};

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
