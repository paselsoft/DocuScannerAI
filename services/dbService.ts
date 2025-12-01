import { supabase } from './supabaseClient';
import { ExtractedData } from '../types';
import { encryptData, decryptData } from './security';

export interface SavedDocument {
  id: string;
  created_at: string;
  doc_type: string;
  summary: string;
  content: ExtractedData; // In memoria è decifrato, ma arriva cifrato dal DB
  is_encrypted?: boolean; // Flag UI
  is_error?: boolean; // Flag per indicare decrittazione fallita
}

export const saveDocumentToDb = async (data: ExtractedData, docId?: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Utente non autenticato");

  // CIFRATURA CLIENT-SIDE
  // Il contenuto viene trasformato in { iv: "...", data: "...", isEncrypted: true }
  const encryptedContent = await encryptData(data);
  const summary = `${data.tipo_documento} - ${data.cognome} ${data.nome}`;

  if (docId) {
    // UPDATE: Aggiorna documento esistente
    const { data: updatedRows, error } = await supabase
      .from('documents')
      .update({
        doc_type: data.tipo_documento,
        summary: summary,
        content: encryptedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', docId)
      .eq('user_id', user.id) // Sicurezza aggiuntiva
      .select(); // Verifica che l'update sia avvenuto effettivamente

    if (error) {
      console.error("Errore aggiornamento DB:", error);
      throw new Error("Errore durante l'aggiornamento del documento.");
    }

    // Se RLS blocca l'update, updatedRows sarà vuoto
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error("Aggiornamento fallito: Il database non ha confermato la modifica. Verifica le policy RLS.");
    }

  } else {
    // INSERT: Crea nuovo documento
    const { error } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        doc_type: data.tipo_documento,
        summary: summary,
        content: encryptedContent // Salviamo il payload cifrato nel campo JSONB
      });

    if (error) {
      console.error("Errore salvataggio DB:", error);
      throw new Error("Errore durante il salvataggio nel cloud.");
    }
  }
};

export const fetchDocumentsFromDb = async (): Promise<SavedDocument[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Errore recupero dati:", error);
    throw new Error("Impossibile scaricare i documenti dal cloud.");
  }

  // Decifriamo i documenti uno per uno
  const decryptedDocs = await Promise.all(data.map(async (doc: any) => {
      try {
          const decryptedContent = await decryptData(doc.content);
          return {
              ...doc,
              content: decryptedContent,
              is_encrypted: doc.content?.isEncrypted === true,
              is_error: false
          };
      } catch (e) {
          // Se fallisce la decrittografia, ritorniamo un oggetto errore parziale
          // per non rompere l'intera lista.
          // Non logghiamo "error" in console per evitare allarmi, è un caso gestito.
          return {
              ...doc,
              content: {}, 
              summary: "🔒 Dati Illeggibili (Chiave mancante)",
              is_encrypted: true,
              is_error: true
          };
      }
  }));

  return decryptedDocs as SavedDocument[];
};

export const deleteDocumentFromDb = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const deleteDocumentsFromDb = async (ids: string[]): Promise<void> => {
  const { error } = await supabase
    .from('documents')
    .delete()
    .in('id', ids);

  if (error) throw error;
};