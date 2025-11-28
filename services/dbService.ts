import { supabase } from './supabaseClient';
import { ExtractedData } from '../types';

export interface SavedDocument {
  id: string;
  created_at: string;
  doc_type: string;
  summary: string;
  content: ExtractedData;
}

export const saveDocumentToDb = async (data: ExtractedData): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Utente non autenticato");

  const { error } = await supabase
    .from('documents')
    .insert({
      user_id: user.id,
      doc_type: data.tipo_documento,
      summary: `${data.tipo_documento} - ${data.cognome} ${data.nome}`,
      content: data
    });

  if (error) {
    console.error("Errore salvataggio DB:", error);
    throw new Error("Errore durante il salvataggio nel cloud.");
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

  return data as SavedDocument[];
};

export const deleteDocumentFromDb = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
};